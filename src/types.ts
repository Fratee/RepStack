export interface WorkoutSet {
  id: string;
  setNumber: number;
  targetReps: string; // e.g. "8", "10", "12-15"
  actualReps: number;
  weightKg: number;
  completed: boolean;
  completedAt?: number;
}

export interface Exercise {
  id: string;
  name: string;
  category: 'legs' | 'chest' | 'back' | 'shoulders' | 'arms' | 'core' | 'calves';
  sets: WorkoutSet[];
  defaultRestSeconds: number; // in seconds, e.g. 120, 90, 60
  notes?: string;
  machineSetting?: number; // Optional numerical machine setting (e.g. seat height, pin position, lever notch)
}

export interface WorkoutDay {
  id: string; // 'day1' | 'day2'
  title: string; // 'Giorno 1'
  subtitle: string;
  exercises: Exercise[];
}

export interface CompletedWorkout {
  id: string;
  dayId: string;
  dayTitle: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  totalSets: number;
  completedSets: number;
  totalVolumeKg: number;
  exercisesSummary: {
    name: string;
    setsCompleted: number;
    totalSets: number;
    maxWeight: number;
  }[];
}

export interface TimerState {
  isActive: boolean;
  isPaused: boolean;
  totalDuration: number; // in seconds
  remainingSeconds: number;
  targetTimestamp: number | null;
  exerciseName?: string;
  setNumber?: number;
  totalSets?: number;
}

export interface AppSettings {
  autoStartTimer: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
  wakeLockEnabled: boolean;
  compactTimer: boolean;
  theme: 'dark' | 'light';
}

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'guest';

export interface ServerState {
  workouts: WorkoutDay[];
  history: CompletedWorkout[];
  settings: Partial<AppSettings>;
  activeSession?: {
    isActive: boolean;
    startTime: number | null;
    dayId?: string;
  } | null;
  currentDayId?: string;
  updatedAt: number;
}


