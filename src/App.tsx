import React, { useState, useEffect, useRef } from 'react';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { Header } from './components/Header';
import { WorkoutProgressBar } from './components/WorkoutProgressBar';
import { ExerciseCard } from './components/ExerciseCard';
import { TimerModal } from './components/TimerModal';
import { FloatingTimer } from './components/FloatingTimer';
import { WatchGuideModal } from './components/WatchGuideModal';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { QuickTimerModal } from './components/QuickTimerModal';
import { EditExerciseModal } from './components/EditExerciseModal';
import { AddExerciseModal } from './components/AddExerciseModal';
import { EditDayModal } from './components/EditDayModal';
import { ReorderExercisesModal } from './components/ReorderExercisesModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { AuthModal } from './components/AuthModal';
import { AccountModal } from './components/AccountModal';
import type { Exercise } from './types';
import { unlockAudio } from './utils/audio';
import { PlusCircle, Watch, Cloud, ChevronDown, Edit3, Settings, Plus, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const GymAppContent: React.FC = () => {
  const {
    currentWorkout,
    workouts,
    setCurrentDayId,
    user,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isAccountModalOpen,
    setIsAccountModalOpen,
  } = useWorkout();

  // Modals state
  const [isWatchGuideOpen, setIsWatchGuideOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickTimerOpen, setIsQuickTimerOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // Day editing & Reorder state
  const [isEditDayOpen, setIsEditDayOpen] = useState(false);
  const [isCreatingNewDay, setIsCreatingNewDay] = useState(false);
  const [isDayDropdownOpen, setIsDayDropdownOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const dayDropdownRef = useRef<HTMLDivElement>(null);

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture install prompt for Android/Desktop Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Unlock Web Audio on first user tap/click
    const handleFirstTouch = () => {
      unlockAudio();
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
    };
    window.addEventListener('click', handleFirstTouch, { passive: true });
    window.addEventListener('touchstart', handleFirstTouch, { passive: true });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
    };
  }, []);

  // Close Day dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dayDropdownRef.current && !dayDropdownRef.current.contains(e.target as Node)) {
        setIsDayDropdownOpen(false);
      }
    };
    if (isDayDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDayDropdownOpen]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#070a11] text-slate-900 dark:text-slate-100 flex flex-col font-sans pb-28 transition-colors duration-200">
      {/* Top Header & Day Navigation */}
      <Header
        onOpenWatchGuide={() => setIsWatchGuideOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenQuickTimer={() => setIsQuickTimerOpen(true)}
        onInstallPWA={handleInstallClick}
        isInstallable={!!deferredPrompt || isIOS}
      />

      {/* Main Container */}
      <main className="max-w-3xl w-full mx-auto px-4 py-4 space-y-4 flex-1">
        {/* Workout Session & Progress Bar */}
        <WorkoutProgressBar />

        {/* Guest Warning / Cloud Sync Callout Banner if not logged in */}
        {!user && (
          <div
            onClick={() => setIsAuthModalOpen(true)}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-white to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 text-slate-700 dark:text-slate-300 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-500/60 transition group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition">
                <Cloud className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  Salva i tuoi allenamenti sul server
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Accedi o crea un account per non perdere mai carichi e schede se cancelli la cache
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
              Accedi &rarr;
            </span>
          </div>
        )}

        {/* Day Header & Dropdown Selection on Top of the Day */}
        <div className="flex items-start justify-between gap-3 px-1 relative z-20">
          <div className="relative min-w-0 flex-1" ref={dayDropdownRef}>
            {/* Day Title with Dropdown Trigger & Edit Icon */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsDayDropdownOpen(!isDayDropdownOpen)}
                className="flex items-center gap-2 text-xl sm:text-2xl font-black text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition group cursor-pointer text-left"
                title="Tocca per cambiare giorno o gestirne le schede"
              >
                <span className="truncate">{currentWorkout.title}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-transform duration-200 shrink-0 ${
                    isDayDropdownOpen ? 'rotate-180 text-emerald-500' : ''
                  }`}
                />
              </button>

              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 shrink-0">
                {currentWorkout.exercises.length} es.
              </span>

              {/* Edit Day Button */}
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNewDay(false);
                  setIsEditDayOpen(true);
                  setIsDayDropdownOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Modifica titolo e focus del giorno"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
              {currentWorkout.subtitle || 'Nessun focus specificato'}
            </p>

            {/* Dropdown Menu on top of the day */}
            {isDayDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in text-slate-900 dark:text-slate-100">
                <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Seleziona Scheda Giorno
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto py-1">
                  {workouts.map((day) => {
                    const isSelected = day.id === currentWorkout.id;
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => {
                          setCurrentDayId(day.id);
                          setIsDayDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm truncate">{day.title}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {day.exercises.length} es.
                            </span>
                          </div>
                          {day.subtitle && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {day.subtitle}
                            </p>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 mt-1 border-t border-slate-200 dark:border-slate-800/80 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewDay(true);
                      setIsEditDayOpen(true);
                      setIsDayDropdownOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2 cursor-pointer transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Aggiungi Nuovo Giorno...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewDay(false);
                      setIsEditDayOpen(true);
                      setIsDayDropdownOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Modifica giorno attuale ({currentWorkout.title})</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons: Cog for exercises ordering + Add exercise */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Cog button for exercises ordering */}
            <button
              type="button"
              onClick={() => setIsReorderModalOpen(true)}
              className="px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700/60 shadow-xs hover:border-emerald-500 dark:hover:border-emerald-500 transition cursor-pointer group"
              title="Imposta ordine degli esercizi (rotella)"
            >
              <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 group-hover:rotate-45 transition duration-300" />
              <span className="hidden sm:inline font-bold">Ordina</span>
            </button>

            {/* Add exercise button */}
            <button
              type="button"
              onClick={() => setIsAddExerciseOpen(true)}
              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
              title="Aggiungi nuovo esercizio"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Aggiungi</span>
            </button>
          </div>
        </div>

        {/* Exercises List */}
        <div className="space-y-4">
          {currentWorkout.exercises.map((exercise, index) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              index={index}
              onEdit={(ex) => setEditingExercise(ex)}
            />
          ))}
        </div>

        {/* Smartwatch Banner callout */}
        <div
          onClick={() => setIsWatchGuideOpen(true)}
          className="p-4 rounded-3xl bg-gradient-to-r from-cyan-500/10 via-white to-white dark:from-cyan-950/30 dark:via-slate-900 dark:to-slate-900 border border-cyan-500/30 dark:border-cyan-800/40 text-slate-700 dark:text-slate-300 shadow-sm dark:shadow-none flex items-center justify-between gap-3 cursor-pointer hover:border-cyan-500/60 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition">
              <Watch className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Timer sincronizzato con il tuo Smartwatch
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Apple Watch, Galaxy Watch, Wear OS: ricevi avvisi e vibrazioni al polso
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 shrink-0">Configura &rarr;</span>
        </div>
      </main>

      {/* Floating Bottom Timer (active when minimized) */}
      <FloatingTimer />

      {/* Modals */}
      <TimerModal />

      <WatchGuideModal
        isOpen={isWatchGuideOpen}
        onClose={() => setIsWatchGuideOpen(false)}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenWatchGuide={() => setIsWatchGuideOpen(true)}
      />

      <QuickTimerModal
        isOpen={isQuickTimerOpen}
        onClose={() => setIsQuickTimerOpen(false)}
      />

      <EditExerciseModal
        exercise={editingExercise}
        isOpen={!!editingExercise}
        onClose={() => setEditingExercise(null)}
      />

      <AddExerciseModal
        isOpen={isAddExerciseOpen}
        onClose={() => setIsAddExerciseOpen(false)}
      />

      {/* Edit Day & Reorder Modals */}
      <EditDayModal
        day={isCreatingNewDay ? null : currentWorkout}
        isOpen={isEditDayOpen}
        onClose={() => setIsEditDayOpen(false)}
        isCreatingNew={isCreatingNewDay}
      />

      <ReorderExercisesModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
      />

      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onInstall={handleInstallClick}
        isIOS={isIOS}
      />

      {/* Account & Auth Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />
    </div>
  );
};

export default function App() {
  return (
    <WorkoutProvider>
      <GymAppContent />
    </WorkoutProvider>
  );
}
