import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type {
  WorkoutDay,
  WorkoutSet,
  Exercise,
  CompletedWorkout,
  TimerState,
  AppSettings,
  AuthUser,
  SyncStatus,
} from '../types';
import { DEFAULT_WORKOUTS } from '../data/defaultWorkouts';
import { playCountdownBeep, playRestFinishedChime, playSetDoneSound } from '../utils/audio';
import { api, getStoredToken, getStoredUser, getServerNow } from '../utils/apiClient';
import {
  scheduleTimerNotification,
  cancelTimerNotification,
  triggerHaptic,
  setScreenWakeLock,
  registerServiceWorker,
} from '../utils/notifications';
import { getAccentOption } from '../utils/accentColors';

interface WorkoutContextType {
  workouts: WorkoutDay[];
  currentDayId: string;
  setCurrentDayId: (id: string) => void;
  currentWorkout: WorkoutDay;
  isWorkoutActive: boolean;
  workoutStartTime: number | null;
  startWorkout: () => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;
  toggleSetCompleted: (exerciseId: string, setId: string) => void;
  updateSet: (exerciseId: string, setId: string, changes: Partial<WorkoutSet>) => void;
  setExerciseSetWeight: (exerciseId: string, setId: string, weightKg: number, applyToFollowing: boolean) => void;
  changeExerciseRest: (exerciseId: string, seconds: number) => void;
  addExercise: (dayId: string, exercise: Omit<Exercise, 'id'>) => void;
  updateExercise: (dayId: string, exercise: Exercise) => void;
  deleteExercise: (dayId: string, exerciseId: string) => void;
  setExerciseMachineSetting: (exerciseId: string, machineSetting?: number | null) => void;
  updateWorkoutDay: (dayId: string, updates: { title?: string; subtitle?: string }) => void;
  addWorkoutDay: (title?: string, subtitle?: string) => string;
  deleteWorkoutDay: (dayId: string) => void;
  moveExercise: (dayId: string, exerciseIndex: number, direction: 'up' | 'down') => void;
  reorderExercises: (dayId: string, newExercises: Exercise[]) => void;
  resetToDefaultWorkouts: () => void;
  
  // Timer
  timer: TimerState;
  startTimer: (seconds: number, exerciseName?: string, setNumber?: number, totalSets?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  adjustTimer: (seconds: number) => void;
  stopTimer: () => void;
  isTimerModalOpen: boolean;
  setIsTimerModalOpen: (open: boolean) => void;

  // History & Settings
  history: CompletedWorkout[];
  deleteHistoryItem: (id: string) => void;
  clearHistory: () => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  toggleTheme: () => void;

  // Quick Stats
  totalSetsCompletedInDay: number;
  totalSetsInDay: number;

  // Auth & Cloud Sync (Server-Backed State)
  user: AuthUser | null;
  isAuthenticated: boolean;
  syncStatus: SyncStatus;
  lastSyncTime: number | null;
  syncError: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (
    username: string,
    password: string,
    displayName?: string,
    saveCurrentData?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  syncWithServer: () => Promise<{ success: boolean; error?: string }>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isAccountModalOpen: boolean;
  setIsAccountModalOpen: (open: boolean) => void;
}

const STORAGE_KEY_WORKOUTS = 'gym_workouts_v1';
const STORAGE_KEY_HISTORY = 'gym_history_v1';
const STORAGE_KEY_SETTINGS = 'gym_settings_v1';
const STORAGE_KEY_CURRENT_DAY = 'gym_current_day_v1';
const STORAGE_KEY_ACTIVE_SESSION = 'gym_active_session_v1';
const STORAGE_KEY_TIMER = 'gym_timer_v1';

interface PersistedTimerState extends TimerState {
  isTimerModalOpen: boolean;
  savedAt: number;
}

const defaultSettings: AppSettings = {
  autoStartTimer: true,
  soundEnabled: true,
  vibrationEnabled: true,
  notificationsEnabled: true,
  wakeLockEnabled: true,
  compactTimer: false,
  theme: 'dark',
  accentColor: 'emerald',
};

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Workouts State (preserves exercises, custom weights, reps, completed status)
  const [workouts, setWorkouts] = useState<WorkoutDay[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WORKOUTS);
      if (saved) {
        const parsed: WorkoutDay[] = JSON.parse(saved);
        // Ensure each exercise has strictly one rest period (strip legacy restOptions)
        return parsed.map((day) => ({
          ...day,
          exercises: day.exercises.map((ex) => {
            const { restOptions: _unused, ...cleanEx } = ex as any;
            return cleanEx;
          }),
        }));
      }
    } catch (e) {
      console.error('Error loading workouts from localStorage:', e);
    }
    return DEFAULT_WORKOUTS;
  });

  // 2. Selected Day State (preserves selected day across page reloads)
  const [currentDayId, setCurrentDayId] = useState<string>(() => {
    // 1. Check URL search param first (e.g. ?day=1 or ?day=2 from PWA shortcuts)
    try {
      const params = new URLSearchParams(window.location.search);
      const dayParam = params.get('day');
      if (dayParam === '1') return 'day1';
      if (dayParam === '2') return 'day2';
    } catch {
      // ignore
    }

    // 2. Check saved day in localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_DAY);
      if (saved && (saved === 'day1' || saved === 'day2')) {
        return saved;
      }
    } catch {
      // ignore
    }

    // 3. Fallback to active session day if present
    try {
      const savedSession = localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.dayId) return parsed.dayId;
      }
    } catch {
      // ignore
    }

    return 'day1';
  });

  // 3. Active Workout Session (preserves stopwatch and active status across reloads)
  const [isWorkoutActive, setIsWorkoutActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.isActive);
      }
    } catch {
      // ignore
    }
    return false;
  });

  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        return typeof parsed.startTime === 'number' ? parsed.startTime : null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  // 4. Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return defaultSettings;
  });

  // 5. History State
  const [history, setHistory] = useState<CompletedWorkout[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // 6. Timer State (reconstructed from localStorage with wall-clock accuracy on reload)
  const initialTimerData = (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TIMER);
      if (saved) {
        const data: PersistedTimerState = JSON.parse(saved);
        if (data && data.isActive) {
          if (data.isPaused) {
            // Restore paused timer
            return {
              timer: {
                isActive: true,
                isPaused: true,
                totalDuration: data.totalDuration || 90,
                remainingSeconds: Math.max(1, data.remainingSeconds),
                targetTimestamp: null,
                exerciseName: data.exerciseName,
                setNumber: data.setNumber,
                totalSets: data.totalSets,
              },
              isModalOpen: Boolean(data.isTimerModalOpen),
            };
          } else if (data.targetTimestamp) {
            // Restore running timer based on real wall-clock elapsed time
            const now = Date.now();
            const diffMs = data.targetTimestamp - now;
            const remaining = Math.max(0, Math.ceil(diffMs / 1000));
            if (remaining > 0) {
              return {
                timer: {
                  isActive: true,
                  isPaused: false,
                  totalDuration: data.totalDuration || remaining,
                  remainingSeconds: remaining,
                  targetTimestamp: data.targetTimestamp,
                  exerciseName: data.exerciseName,
                  setNumber: data.setNumber,
                  totalSets: data.totalSets,
                },
                isModalOpen: Boolean(data.isTimerModalOpen),
              };
            }
          }
        }
      }
    } catch (e) {
      console.error('Error restoring timer from localStorage:', e);
    }

    try {
      localStorage.removeItem(STORAGE_KEY_TIMER);
    } catch {
      // ignore
    }

    return {
      timer: {
        isActive: false,
        isPaused: false,
        totalDuration: 90,
        remainingSeconds: 90,
        targetTimestamp: null,
      },
      isModalOpen: false,
    };
  })();

  const [timer, setTimer] = useState<TimerState>(initialTimerData.timer);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(initialTimerData.isModalOpen);

  // 6. User Auth & Server Sync State
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => (getStoredToken() ? 'syncing' : 'guest'));
  const [lastSyncTime, setLastSyncTimeState] = useState<number | null>(null);
  const lastSyncTimeRef = useRef<number | null>(null);
  const isRemoteUpdateRef = useRef<boolean>(false);

  const setLastSyncTime = useCallback((t: number | null) => {
    lastSyncTimeRef.current = t;
    setLastSyncTimeState(t);
  }, []);

  const [syncError, setSyncError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);

  // Initial Auth Check & Cloud Sync on startup
  useEffect(() => {
    const initAuthAndSync = async () => {
      const token = getStoredToken();
      if (!token) {
        setSyncStatus('guest');
        return;
      }

      setSyncStatus('syncing');
      try {
        const meRes = await api.getMe();
        if (meRes.status === 401) {
          // Token expired or invalid
          setUser(null);
          setSyncStatus('guest');
          return;
        }

        if (meRes.data?.user) {
          setUser(meRes.data.user);

          // Restore state from server
          const stateRes = await api.getState();
          if (stateRes.data?.state) {
            const serverState = stateRes.data.state;
            if (Array.isArray(serverState.workouts) && serverState.workouts.length > 0) {
              setWorkouts(serverState.workouts);
            }
            if (Array.isArray(serverState.history)) {
              setHistory(serverState.history);
            }
            if (serverState.settings && Object.keys(serverState.settings).length > 0) {
              setSettings((prev) => ({ ...prev, ...serverState.settings }));
            }
            if (serverState.currentDayId) {
              setCurrentDayId(serverState.currentDayId);
            }
            if (serverState.activeSession && serverState.activeSession.isActive) {
              const ageMs = Date.now() - (serverState.activeSession.startTime || 0);
              if (ageMs < 18 * 3600 * 1000) {
                setIsWorkoutActive(true);
                setWorkoutStartTime(serverState.activeSession.startTime || null);
              } else {
                setIsWorkoutActive(false);
                setWorkoutStartTime(null);
                try {
                  localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
                } catch {}
              }
            } else {
              setIsWorkoutActive(false);
              setWorkoutStartTime(null);
              try {
                localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
              } catch {}
            }
            setLastSyncTime(serverState.updatedAt || Date.now());
            setSyncStatus('synced');
            setSyncError(null);
          }
        } else if (meRes.isOffline) {
          setSyncStatus('offline');
        }
      } catch (err) {
        console.warn('Initial auth sync error:', err);
        setSyncStatus('offline');
      }
    };

    initAuthAndSync();
  }, [setLastSyncTime]);

  // Auto-sync debounced to server when user is authenticated
  const syncTimeoutRef = useRef<number | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!user) return;

    // Do not bounce back changes that were just pulled from the server
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = window.setTimeout(async () => {
      syncTimeoutRef.current = null;
      setSyncStatus('syncing');
      try {
        const res = await api.syncState({
          workouts,
          history,
          settings,
          activeSession: isWorkoutActive ? { isActive: true, startTime: workoutStartTime, dayId: currentDayId } : null,
          currentDayId,
        });
        if (res.data?.success) {
          const updated = res.data.updatedAt || Date.now();
          lastSyncTimeRef.current = updated;
          setLastSyncTime(updated);
          setSyncStatus('synced');
          setSyncError(null);
        } else {
          setSyncStatus(res.isOffline ? 'offline' : 'error');
          if (res.error) setSyncError(res.error);
        }
      } catch {
        setSyncStatus('offline');
      }
    }, 1500);

    return () => {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [workouts, history, settings, isWorkoutActive, workoutStartTime, currentDayId, user, setLastSyncTime]);

  // Cross-device background polling & visibility change listener
  useEffect(() => {
    if (!user) return;

    let isPolling = false;

    const pullServerState = async () => {
      if (isPolling) return;
      // If a local modification is pending sync on this device, don't interrupt
      if (syncTimeoutRef.current) return;

      isPolling = true;
      try {
        const res = await api.getState();
        if (res.data?.state) {
          const serverState = res.data.state;
          const serverUpdated = serverState.updatedAt || 0;

          // Only apply if server state is newer than our last sync
          if (serverUpdated > (lastSyncTimeRef.current || 0)) {
            isRemoteUpdateRef.current = true;

            if (Array.isArray(serverState.workouts) && serverState.workouts.length > 0) {
              setWorkouts(serverState.workouts);
            }
            if (Array.isArray(serverState.history)) {
              setHistory(serverState.history);
            }
            if (serverState.settings && Object.keys(serverState.settings).length > 0) {
              setSettings((prev) => ({ ...prev, ...serverState.settings }));
            }
            if (serverState.currentDayId) {
              setCurrentDayId(serverState.currentDayId);
            }

            // Sync activeSession accurately
            if (serverState.activeSession && serverState.activeSession.isActive) {
              const ageMs = Date.now() - (serverState.activeSession.startTime || 0);
              if (ageMs < 18 * 3600 * 1000) {
                setIsWorkoutActive(true);
                setWorkoutStartTime(serverState.activeSession.startTime || null);
              } else {
                setIsWorkoutActive(false);
                setWorkoutStartTime(null);
                try {
                  localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
                } catch {}
              }
            } else {
              setIsWorkoutActive(false);
              setWorkoutStartTime(null);
              try {
                localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
              } catch {}
            }

            lastSyncTimeRef.current = serverUpdated;
            setLastSyncTime(serverUpdated);
            setSyncStatus('synced');
            setSyncError(null);
          }
        }
      } catch (err) {
        // quiet fallback
      } finally {
        isPolling = false;
      }
    };

    // 1. Check immediately when user switches tabs or unlocks screen
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pullServerState();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', pullServerState);

    // 2. Poll every 4 seconds when tab is visible
    const pollInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        pullServerState();
      }
    }, 4000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', pullServerState);
      window.clearInterval(pollInterval);
    };
  }, [user, setLastSyncTime]);

  // Sync workouts to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(workouts));
  }, [workouts]);

  // Sync selected day to localStorage and URL search param
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_DAY, currentDayId);
      const currentParam = new URLSearchParams(window.location.search).get('day');
      const targetParam = currentDayId === 'day2' ? '2' : '1';
      if (currentParam !== targetParam) {
        const url = new URL(window.location.href);
        url.searchParams.set('day', targetParam);
        window.history.replaceState(null, '', url.toString());
      }
    } catch (e) {
      console.warn('Could not sync currentDayId to storage/URL:', e);
    }
  }, [currentDayId]);

  // Sync active workout session to localStorage
  useEffect(() => {
    if (isWorkoutActive && workoutStartTime) {
      try {
        localStorage.setItem(
          STORAGE_KEY_ACTIVE_SESSION,
          JSON.stringify({
            isActive: true,
            startTime: workoutStartTime,
            dayId: currentDayId,
          })
        );
      } catch (e) {
        console.error('Error saving active session:', e);
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
      } catch {
        // ignore
      }
    }
  }, [isWorkoutActive, workoutStartTime, currentDayId]);

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  }, [history]);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Sync rest timer state to localStorage whenever meaningful state changes
  useEffect(() => {
    if (timer.isActive) {
      try {
        const dataToSave: PersistedTimerState = {
          ...timer,
          isTimerModalOpen,
          savedAt: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY_TIMER, JSON.stringify(dataToSave));
      } catch (e) {
        console.error('Error saving timer state:', e);
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY_TIMER);
      } catch {
        // ignore
      }
    }
  }, [
    timer.isActive,
    timer.isPaused,
    timer.targetTimestamp,
    timer.totalDuration,
    timer.exerciseName,
    timer.setNumber,
    timer.totalSets,
    timer.isPaused ? timer.remainingSeconds : null,
    isTimerModalOpen,
  ]);

  // Extra safeguard: sync state before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (timer.isActive) {
        try {
          const data: PersistedTimerState = {
            ...timer,
            isTimerModalOpen,
            savedAt: Date.now(),
          };
          localStorage.setItem(STORAGE_KEY_TIMER, JSON.stringify(data));
        } catch {
          // ignore
        }
      }
      if (isWorkoutActive && workoutStartTime) {
        try {
          localStorage.setItem(
            STORAGE_KEY_ACTIVE_SESSION,
            JSON.stringify({
              isActive: true,
              startTime: workoutStartTime,
              dayId: currentDayId,
            })
          );
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [timer, isTimerModalOpen, isWorkoutActive, workoutStartTime, currentDayId]);

  // Register service worker on mount & verify notification schedule if timer restored running
  useEffect(() => {
    registerServiceWorker();

    // If timer was restored actively running on reload, re-schedule Service Worker notification
    if (initialTimerData.timer.isActive && !initialTimerData.timer.isPaused && initialTimerData.timer.targetTimestamp) {
      if (settings.notificationsEnabled) {
        scheduleTimerNotification({
          targetTimestamp: initialTimerData.timer.targetTimestamp,
          durationSeconds: initialTimerData.timer.remainingSeconds,
          exerciseName: initialTimerData.timer.exerciseName,
          setNumber: initialTimerData.timer.setNumber,
          totalSets: initialTimerData.timer.totalSets,
        });
      }
    }
  }, []);

  // Theme HTML class, data-accent and theme-color sync
  useEffect(() => {
    const root = document.documentElement;
    const isDark = settings.theme !== 'light';
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    const accent = settings.accentColor || 'emerald';
    root.setAttribute('data-accent', accent);
    const accentOption = getAccentOption(accent);
    root.style.setProperty('--color-accent-text', accentOption.contrastTextColor);

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#070a11' : '#f8fafc');
    }
  }, [settings.theme, settings.accentColor]);

  // Screen Wake Lock sync
  useEffect(() => {
    if (isWorkoutActive && settings.wakeLockEnabled) {
      setScreenWakeLock(true);
    } else {
      setScreenWakeLock(false);
    }
    return () => {
      setScreenWakeLock(false);
    };
  }, [isWorkoutActive, settings.wakeLockEnabled]);

  const currentWorkout = workouts.find((w) => w.id === currentDayId) || workouts[0];

  // Total completed sets in current day
  const totalSetsInDay = currentWorkout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const totalSetsCompletedInDay = currentWorkout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );

  // Timer Tick Interval
  const lastBeepRef = useRef<number | null>(null);

  useEffect(() => {
    if (!timer.isActive || timer.isPaused || !timer.targetTimestamp) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = timer.targetTimestamp! - now;
      const remaining = Math.max(0, Math.ceil(diffMs / 1000));

      setTimer((prev) => ({
        ...prev,
        remainingSeconds: remaining,
      }));

      // Play audio countdown beeps at 3, 2, 1 seconds
      if (settings.soundEnabled && remaining > 0 && remaining <= 3 && lastBeepRef.current !== remaining) {
        lastBeepRef.current = remaining;
        playCountdownBeep();
        if (settings.vibrationEnabled) {
          triggerHaptic([80]);
        }
      }

      // Reached zero!
      if (remaining <= 0) {
        clearInterval(interval);
        lastBeepRef.current = null;

        if (settings.soundEnabled) {
          playRestFinishedChime();
        }
        if (settings.vibrationEnabled) {
          triggerHaptic([300, 100, 300, 100, 500]);
        }

        setTimer((prev) => ({
          ...prev,
          isActive: false,
          remainingSeconds: 0,
        }));
      }
    }, 250);

    return () => clearInterval(interval);
  }, [timer.isActive, timer.isPaused, timer.targetTimestamp, settings.soundEnabled, settings.vibrationEnabled]);

  // Start Timer Handler
  const startTimer = useCallback(
    (seconds: number, exerciseName?: string, setNumber?: number, totalSets?: number) => {
      const now = Date.now();
      const targetTimestamp = now + seconds * 1000;
      lastBeepRef.current = null;

      setTimer({
        isActive: true,
        isPaused: false,
        totalDuration: seconds,
        remainingSeconds: seconds,
        targetTimestamp,
        exerciseName,
        setNumber,
        totalSets,
      });

      // Schedule smartwatch & OS notification via Service Worker
      if (settings.notificationsEnabled) {
        scheduleTimerNotification({
          targetTimestamp,
          durationSeconds: seconds,
          exerciseName,
          setNumber,
          totalSets,
        });
      }
    },
    [settings.notificationsEnabled]
  );

  const pauseTimer = useCallback(() => {
    if (!timer.isActive || timer.isPaused) return;
    cancelTimerNotification();
    setTimer((prev) => ({
      ...prev,
      isPaused: true,
      targetTimestamp: null,
    }));
  }, [timer.isActive, timer.isPaused]);

  const resumeTimer = useCallback(() => {
    if (!timer.isActive || !timer.isPaused) return;
    const now = Date.now();
    const targetTimestamp = now + timer.remainingSeconds * 1000;
    lastBeepRef.current = null;

    setTimer((prev) => ({
      ...prev,
      isPaused: false,
      targetTimestamp,
    }));

    if (settings.notificationsEnabled) {
      scheduleTimerNotification({
        targetTimestamp,
        durationSeconds: timer.remainingSeconds,
        exerciseName: timer.exerciseName,
        setNumber: timer.setNumber,
        totalSets: timer.totalSets,
      });
    }
  }, [timer.isActive, timer.isPaused, timer.remainingSeconds, timer.exerciseName, timer.setNumber, timer.totalSets, settings.notificationsEnabled]);

  const adjustTimer = useCallback(
    (seconds: number) => {
      setTimer((prev) => {
        if (!prev.isActive) return prev;
        const newRemaining = Math.max(5, prev.remainingSeconds + seconds);
        const newDuration = Math.max(prev.totalDuration, newRemaining);
        const now = Date.now();
        const targetTimestamp = prev.isPaused ? null : now + newRemaining * 1000;

        if (!prev.isPaused && settings.notificationsEnabled && targetTimestamp) {
          scheduleTimerNotification({
            targetTimestamp,
            durationSeconds: newRemaining,
            exerciseName: prev.exerciseName,
            setNumber: prev.setNumber,
            totalSets: prev.totalSets,
          });
        }

        return {
          ...prev,
          remainingSeconds: newRemaining,
          totalDuration: newDuration,
          targetTimestamp,
        };
      });
    },
    [settings.notificationsEnabled]
  );

  const stopTimer = useCallback(() => {
    cancelTimerNotification();
    setTimer((prev) => ({
      ...prev,
      isActive: false,
      isPaused: false,
      remainingSeconds: 0,
      targetTimestamp: null,
    }));
    setIsTimerModalOpen(false);
    try {
      localStorage.removeItem(STORAGE_KEY_TIMER);
    } catch {
      // ignore
    }
  }, []);

  // Workout Session Start/Finish
  const startWorkout = () => {
    const startTime = getServerNow();
    setIsWorkoutActive(true);
    setWorkoutStartTime(startTime);

    try {
      localStorage.setItem(
        STORAGE_KEY_ACTIVE_SESSION,
        JSON.stringify({
          isActive: true,
          startTime,
          dayId: currentDayId,
        })
      );
    } catch {}

    if (user) {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      api.syncState({
        workouts,
        history,
        settings,
        activeSession: { isActive: true, startTime, dayId: currentDayId },
        currentDayId,
      }).then((res) => {
        if (res.data?.success) {
          const updated = res.data.updatedAt || Date.now();
          lastSyncTimeRef.current = updated;
          setLastSyncTime(updated);
          setSyncStatus('synced');
          setSyncError(null);
        }
      }).catch((e) => console.warn('Start workout sync error:', e));
    }
  };

  const cancelWorkout = () => {
    setIsWorkoutActive(false);
    setWorkoutStartTime(null);
    stopTimer();

    try {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
    } catch {}

    // Reset sets completed status for next time, but keep custom weights & reps!
    const nextWorkouts = workouts.map((w) => {
      if (w.id !== currentDayId) return w;
      return {
        ...w,
        exercises: w.exercises.map((ex) => ({
          ...ex,
          sets: ex.sets.map((s) => ({
            ...s,
            completed: false,
            completedAt: undefined,
          })),
        })),
      };
    });
    setWorkouts(nextWorkouts);

    // Immediately push reset to server so other devices exit workout instantly
    if (user) {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      api.syncState({
        workouts: nextWorkouts,
        history,
        settings,
        activeSession: null,
        currentDayId,
      }).then((res) => {
        if (res.data?.success) {
          const updated = res.data.updatedAt || Date.now();
          lastSyncTimeRef.current = updated;
          setLastSyncTime(updated);
          setSyncStatus('synced');
          setSyncError(null);
        }
      }).catch((e) => console.warn('Cancel workout sync error:', e));
    }
  };

  const finishWorkout = () => {
    const endTime = getServerNow();
    const durationSeconds = workoutStartTime ? Math.round((endTime - workoutStartTime) / 1000) : 0;

    let totalVolume = 0;
    const exercisesSummary = currentWorkout.exercises.map((ex) => {
      const completedSets = ex.sets.filter((s) => s.completed);
      const maxWeight = Math.max(0, ...ex.sets.map((s) => s.weightKg || 0));

      completedSets.forEach((s) => {
        totalVolume += (s.weightKg || 0) * (s.actualReps || 0);
      });

      return {
        name: ex.name,
        setsCompleted: completedSets.length,
        totalSets: ex.sets.length,
        maxWeight,
      };
    });

    const newHistoryItem: CompletedWorkout = {
      id: `history-${Date.now()}`,
      dayId: currentWorkout.id,
      dayTitle: currentWorkout.title,
      startTime: workoutStartTime || endTime - 3600 * 1000,
      endTime,
      durationSeconds,
      totalSets: totalSetsInDay,
      completedSets: totalSetsCompletedInDay,
      totalVolumeKg: Math.round(totalVolume),
      exercisesSummary,
    };

    const nextHistory = [newHistoryItem, ...history];
    setHistory(nextHistory);

    // Send immediately to server so workout is never lost even if cache wiped right after
    if (user) {
      api.addHistoryItem(newHistoryItem).catch((err) => console.warn('History server upload error:', err));
    }

    setIsWorkoutActive(false);
    setWorkoutStartTime(null);
    stopTimer();

    try {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
    } catch {}

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    // Reset sets completed status for next time, but keep custom weights & reps!
    const nextWorkouts = workouts.map((w) => {
      if (w.id !== currentDayId) return w;
      return {
        ...w,
        exercises: w.exercises.map((ex) => ({
          ...ex,
          sets: ex.sets.map((s) => ({
            ...s,
            completed: false,
            completedAt: undefined,
          })),
        })),
      };
    });
    setWorkouts(nextWorkouts);

    // Immediately push finish to server with activeSession: null
    if (user) {
      if (syncTimeoutRef.current) {
        window.clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      api.syncState({
        workouts: nextWorkouts,
        history: nextHistory,
        settings,
        activeSession: null,
        currentDayId,
      }).then((res) => {
        if (res.data?.success) {
          const updated = res.data.updatedAt || Date.now();
          lastSyncTimeRef.current = updated;
          setLastSyncTime(updated);
          setSyncStatus('synced');
          setSyncError(null);
        }
      }).catch((e) => console.warn('Finish workout sync error:', e));
    }
  };

  // Toggle single set completed
  const toggleSetCompleted = (exerciseId: string, setId: string) => {
    if (!isWorkoutActive) {
      startWorkout();
    }

    setWorkouts((prevWorkouts) => {
      let willBeCompleted = false;
      let targetExercise: Exercise | undefined;
      let targetSetNumber = 1;

      const nextWorkouts = prevWorkouts.map((day) => {
        if (day.id !== currentDayId) return day;

        const nextExercises = day.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          targetExercise = ex;

          const nextSets = ex.sets.map((s) => {
            if (s.id !== setId) return s;
            willBeCompleted = !s.completed;
            targetSetNumber = s.setNumber;
            return {
              ...s,
              completed: willBeCompleted,
              completedAt: willBeCompleted ? Date.now() : undefined,
            };
          });

          return { ...ex, sets: nextSets };
        });

        return { ...day, exercises: nextExercises };
      });

      if (willBeCompleted) {
        if (settings.soundEnabled) playSetDoneSound();
        if (settings.vibrationEnabled) triggerHaptic([60, 40, 60]);

        // Auto-start rest timer if enabled
        if (settings.autoStartTimer && targetExercise) {
          startTimer(
            targetExercise.defaultRestSeconds,
            targetExercise.name,
            targetSetNumber,
            targetExercise.sets.length
          );
          // Open timer modal or show floating timer
          if (!settings.compactTimer) {
            setIsTimerModalOpen(true);
          }
        }
      }

      return nextWorkouts;
    });
  };

  // Update set details (weight, reps)
  const updateSet = (exerciseId: string, setId: string, changes: Partial<WorkoutSet>) => {
    setWorkouts((prevWorkouts) =>
      prevWorkouts.map((day) => {
        if (day.id !== currentDayId) return day;
        return {
          ...day,
          exercises: day.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...changes } : s)),
            };
          }),
        };
      })
    );
  };

  const setExerciseSetWeight = (
    exerciseId: string,
    setId: string,
    weightKg: number,
    applyToFollowing: boolean
  ) => {
    setWorkouts((prevWorkouts) =>
      prevWorkouts.map((day) => {
        if (day.id !== currentDayId) return day;
        return {
          ...day,
          exercises: day.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;

            const targetSetIndex = ex.sets.findIndex((s) => s.id === setId);
            if (targetSetIndex === -1) return ex;

            const nextSets = ex.sets.map((s, idx) => {
              if (s.id === setId || (applyToFollowing && idx > targetSetIndex)) {
                return { ...s, weightKg };
              }
              return s;
            });

            return { ...ex, sets: nextSets };
          }),
        };
      })
    );
  };

  // Change default rest for an exercise (e.g. Leg Curl toggle between 90s and 120s)
  const changeExerciseRest = (exerciseId: string, seconds: number) => {
    setWorkouts((prev) =>
      prev.map((day) => {
        if (day.id !== currentDayId) return day;
        return {
          ...day,
          exercises: day.exercises.map((ex) =>
            ex.id === exerciseId ? { ...ex, defaultRestSeconds: seconds } : ex
          ),
        };
      })
    );
  };

  // Add / Edit / Delete Exercises
  const addExercise = (dayId: string, exerciseData: Omit<Exercise, 'id'>) => {
    const newEx: Exercise = {
      ...exerciseData,
      id: `ex-${Date.now()}`,
    };
    setWorkouts((prev) =>
      prev.map((day) => (day.id === dayId ? { ...day, exercises: [...day.exercises, newEx] } : day))
    );
  };

  const updateExercise = (dayId: string, updated: Exercise) => {
    setWorkouts((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              exercises: day.exercises.map((ex) => (ex.id === updated.id ? updated : ex)),
            }
          : day
      )
    );
  };

  const deleteExercise = (dayId: string, exerciseId: string) => {
    setWorkouts((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              exercises: day.exercises.filter((ex) => ex.id !== exerciseId),
            }
          : day
      )
    );
  };

  const setExerciseMachineSetting = (exerciseId: string, machineSetting?: number | null) => {
    setWorkouts((prev) =>
      prev.map((day) => {
        if (day.id !== currentDayId) return day;
        return {
          ...day,
          exercises: day.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            const valid =
              machineSetting !== undefined && machineSetting !== null && !Number.isNaN(machineSetting)
                ? machineSetting
                : undefined;
            return {
              ...ex,
              machineSetting: valid,
            };
          }),
        };
      })
    );
  };

  const updateWorkoutDay = (dayId: string, updates: { title?: string; subtitle?: string }) => {
    setWorkouts((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              title: updates.title !== undefined ? updates.title.trim() || day.title : day.title,
              subtitle: updates.subtitle !== undefined ? updates.subtitle.trim() : day.subtitle,
            }
          : day
      )
    );
  };

  const addWorkoutDay = (title?: string, subtitle = '') => {
    const nextNum = workouts.length + 1;
    const newId = `day-${Date.now()}`;
    const newDay: WorkoutDay = {
      id: newId,
      title: title?.trim() || `Giorno ${nextNum}`,
      subtitle: subtitle.trim(),
      exercises: [],
    };
    setWorkouts((prev) => [...prev, newDay]);
    setCurrentDayId(newId);
    return newId;
  };

  const deleteWorkoutDay = (dayId: string) => {
    if (workouts.length <= 1) return;
    setWorkouts((prev) => {
      const filtered = prev.filter((d) => d.id !== dayId);
      if (currentDayId === dayId && filtered.length > 0) {
        setCurrentDayId(filtered[0].id);
      }
      return filtered;
    });
  };

  const moveExercise = (dayId: string, exerciseIndex: number, direction: 'up' | 'down') => {
    setWorkouts((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day;
        const targetIdx = direction === 'up' ? exerciseIndex - 1 : exerciseIndex + 1;
        if (targetIdx < 0 || targetIdx >= day.exercises.length) return day;
        const newExercises = [...day.exercises];
        const temp = newExercises[exerciseIndex];
        newExercises[exerciseIndex] = newExercises[targetIdx];
        newExercises[targetIdx] = temp;
        return { ...day, exercises: newExercises };
      })
    );
  };

  const reorderExercises = (dayId: string, newExercises: Exercise[]) => {
    setWorkouts((prev) =>
      prev.map((day) => (day.id === dayId ? { ...day, exercises: newExercises } : day))
    );
  };

  const resetToDefaultWorkouts = () => {
    setWorkouts(DEFAULT_WORKOUTS);
    localStorage.removeItem(STORAGE_KEY_WORKOUTS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
    localStorage.removeItem(STORAGE_KEY_TIMER);
    setIsWorkoutActive(false);
    setWorkoutStartTime(null);
    stopTimer();
  };

  // History management
  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (user) {
      api.deleteHistoryItem(id).catch((err) => console.warn('History item delete error:', err));
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    if (user) {
      api.clearHistory().catch((err) => console.warn('History clear error:', err));
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  };

  // Auth & Cloud Sync Methods
  const login = async (username: string, password: string) => {
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      const res = await api.login(username, password);
      if (res.data?.success && res.data.user) {
        setUser(res.data.user);
        const serverState = res.data.state;
        if (serverState) {
          if (Array.isArray(serverState.workouts) && serverState.workouts.length > 0) {
            setWorkouts(serverState.workouts);
          }
          if (Array.isArray(serverState.history)) {
            setHistory(serverState.history);
          }
          if (serverState.settings && Object.keys(serverState.settings).length > 0) {
            setSettings((prev) => ({ ...prev, ...serverState.settings }));
          }
          if (serverState.currentDayId) {
            setCurrentDayId(serverState.currentDayId);
          }
          if (serverState.activeSession && serverState.activeSession.isActive) {
            const ageMs = Date.now() - (serverState.activeSession.startTime || 0);
            if (ageMs < 18 * 3600 * 1000) {
              setIsWorkoutActive(true);
              setWorkoutStartTime(serverState.activeSession.startTime || null);
            } else {
              setIsWorkoutActive(false);
              setWorkoutStartTime(null);
              try {
                localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
              } catch {}
            }
          } else {
            setIsWorkoutActive(false);
            setWorkoutStartTime(null);
            try {
              localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
            } catch {}
          }
        }
        const updated = serverState?.updatedAt || Date.now();
        lastSyncTimeRef.current = updated;
        setLastSyncTime(updated);
        setSyncStatus('synced');
        return { success: true };
      }
      setSyncStatus('guest');
      setSyncError(res.error || 'Credenziali non valide.');
      return { success: false, error: res.error || 'Credenziali non valide.' };
    } catch (err) {
      setSyncStatus('error');
      const msg = `Errore di connessione: ${String(err)}`;
      setSyncError(msg);
      return { success: false, error: msg };
    }
  };

  const registerUser = async (
    username: string,
    password: string,
    displayName?: string,
    saveCurrentData = true
  ) => {
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      const res = await api.register({
        username,
        password,
        displayName,
        initialWorkouts: saveCurrentData ? workouts : undefined,
        initialHistory: saveCurrentData ? history : undefined,
        initialSettings: saveCurrentData ? settings : { accentColor: settings.accentColor },
        initialDayId: currentDayId,
      });

      if (res.data?.success && res.data.user) {
        setUser(res.data.user);
        setSyncStatus('synced');
        setLastSyncTime(Date.now());
        return { success: true };
      }
      setSyncStatus('guest');
      setSyncError(res.error || 'Errore durante la registrazione.');
      return { success: false, error: res.error || 'Errore durante la registrazione.' };
    } catch (err) {
      setSyncStatus('error');
      const msg = `Errore: ${String(err)}`;
      setSyncError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setSyncStatus('guest');
  };

  const syncWithServer = async () => {
    if (!user) return { success: false, error: 'Non sei autenticato.' };

    setSyncStatus('syncing');
    try {
      // 1. Check if server has newer updates from another device
      const stateRes = await api.getState();
      if (stateRes.data?.state) {
        const serverState = stateRes.data.state;
        const serverUpdated = serverState.updatedAt || 0;
        if (serverUpdated > (lastSyncTimeRef.current || 0)) {
          isRemoteUpdateRef.current = true;
          if (Array.isArray(serverState.workouts) && serverState.workouts.length > 0) {
            setWorkouts(serverState.workouts);
          }
          if (Array.isArray(serverState.history)) {
            setHistory(serverState.history);
          }
          if (serverState.settings && Object.keys(serverState.settings).length > 0) {
            setSettings((prev) => ({ ...prev, ...serverState.settings }));
          }
          if (serverState.currentDayId) {
            setCurrentDayId(serverState.currentDayId);
          }
          if (serverState.activeSession && serverState.activeSession.isActive) {
            const ageMs = Date.now() - (serverState.activeSession.startTime || 0);
            if (ageMs < 18 * 3600 * 1000) {
              setIsWorkoutActive(true);
              setWorkoutStartTime(serverState.activeSession.startTime || null);
            } else {
              setIsWorkoutActive(false);
              setWorkoutStartTime(null);
              try { localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION); } catch {}
            }
          } else {
            setIsWorkoutActive(false);
            setWorkoutStartTime(null);
            try {
              localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
            } catch {}
          }
          lastSyncTimeRef.current = serverUpdated;
          setLastSyncTime(serverUpdated);
          setSyncStatus('synced');
          setSyncError(null);
          return { success: true };
        }
      }

      // 2. Push local state if local is current
      const res = await api.syncState({
        workouts,
        history,
        settings,
        activeSession: isWorkoutActive ? { isActive: true, startTime: workoutStartTime, dayId: currentDayId } : null,
        currentDayId,
      });

      if (res.data?.success) {
        const updated = res.data.updatedAt || Date.now();
        lastSyncTimeRef.current = updated;
        setLastSyncTime(updated);
        setSyncStatus('synced');
        setSyncError(null);
        return { success: true };
      } else {
        setSyncStatus(res.isOffline ? 'offline' : 'error');
        setSyncError(res.error || 'Errore durante il salvataggio sul server.');
        return { success: false, error: res.error };
      }
    } catch (err) {
      setSyncStatus('offline');
      return { success: false, error: String(err) };
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        currentDayId,
        setCurrentDayId,
        currentWorkout,
        isWorkoutActive,
        workoutStartTime,
        startWorkout,
        finishWorkout,
        cancelWorkout,
        toggleSetCompleted,
        updateSet,
        setExerciseSetWeight,
        changeExerciseRest,
        addExercise,
        updateExercise,
        deleteExercise,
        setExerciseMachineSetting,
        updateWorkoutDay,
        addWorkoutDay,
        deleteWorkoutDay,
        moveExercise,
        reorderExercises,
        resetToDefaultWorkouts,

        timer,
        startTimer,
        pauseTimer,
        resumeTimer,
        adjustTimer,
        stopTimer,
        isTimerModalOpen,
        setIsTimerModalOpen,

        history,
        deleteHistoryItem,
        clearHistory,
        settings,
        updateSettings,
        toggleTheme,

        totalSetsCompletedInDay,
        totalSetsInDay,

        // Auth & Sync
        user,
        isAuthenticated: !!user,
        syncStatus,
        lastSyncTime,
        syncError,
        login,
        registerUser,
        logout,
        syncWithServer,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isAccountModalOpen,
        setIsAccountModalOpen,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};
