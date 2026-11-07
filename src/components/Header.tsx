import React from 'react';
import { Watch, History, Settings, Dumbbell, Timer, Download, User, Cloud } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

interface HeaderProps {
  onOpenWatchGuide: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenQuickTimer: () => void;
  onInstallPWA?: () => void;
  isInstallable: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenWatchGuide,
  onOpenHistory,
  onOpenSettings,
  onOpenQuickTimer,
  onInstallPWA,
  isInstallable,
}) => {
  const { user, setIsAuthModalOpen, setIsAccountModalOpen } = useWorkout();

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 px-4 py-3 sm:py-3.5 transition-colors duration-200">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <Dumbbell className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
              GymTimer
            </h1>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Account / Cloud Sync Pill */}
          <button
            onClick={() => {
              if (user) {
                setIsAccountModalOpen(true);
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl border transition flex items-center gap-1.5 text-xs cursor-pointer ${
              user
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60'
            }`}
            title={user ? `Account: ${user.displayName || user.username} (Salvataggio attivo sul server)` : 'Accedi o crea un account per non perdere mai i tuoi allenamenti'}
          >
            {user ? (
              <>
                <div className="relative flex items-center">
                  <User className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-slate-900" />
                </div>
                <span className="hidden sm:inline font-bold truncate max-w-[80px]">
                  {user.displayName || user.username}
                </span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span className="hidden sm:inline font-semibold">Accedi</span>
              </>
            )}
          </button>

          {/* Quick Timer Launcher */}
          <button
            onClick={onOpenQuickTimer}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700/60 transition flex items-center gap-1.5 text-xs cursor-pointer"
            title="Timer Rapido"
          >
            <Timer className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="hidden sm:inline font-semibold">Timer</span>
          </button>

          {/* Smartwatch Sync Guide & Test */}
          <button
            onClick={onOpenWatchGuide}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-700/60 transition flex items-center gap-1.5 text-xs cursor-pointer"
            title="Notifiche Smartwatch (Apple Watch & Wear OS)"
          >
            <Watch className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden sm:inline font-semibold">Watch</span>
          </button>

          {/* Install PWA Button (if available) */}
          {isInstallable && onInstallPWA && (
            <button
              onClick={onInstallPWA}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition flex items-center gap-1.5 text-xs cursor-pointer font-bold"
              title="Installa App sul telefono"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Installa</span>
            </button>
          )}

          {/* History */}
          <button
            onClick={onOpenHistory}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 transition cursor-pointer"
            title="Cronologia Allenamenti"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 transition cursor-pointer"
            title="Impostazioni"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
