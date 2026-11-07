import React, { useState, useEffect } from 'react';
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
import { PWAInstallModal } from './components/PWAInstallModal';
import { AuthModal } from './components/AuthModal';
import { AccountModal } from './components/AccountModal';
import type { Exercise } from './types';
import { unlockAudio } from './utils/audio';
import { PlusCircle, Watch, Cloud } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const GymAppContent: React.FC = () => {
  const {
    currentWorkout,
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

        {/* Day Header Info */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{currentWorkout.title}</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60">
                {currentWorkout.exercises.length} esercizi
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {currentWorkout.subtitle}
            </p>
          </div>

          <button
            onClick={() => setIsAddExerciseOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700/60 shadow-sm dark:shadow-none transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Aggiungi</span>
          </button>
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
