import React, { useState } from 'react';
import { X, User, Cloud, RefreshCw, LogOut, CheckCircle2, Shield, WifiOff } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onOpenAuth }) => {
  const { user, syncStatus, lastSyncTime, syncWithServer, logout, history, workouts } = useWorkout();
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleManualSync = async () => {
    setSyncing(true);
    setFeedback(null);
    try {
      const res = await syncWithServer();
      if (res.success) {
        setFeedback('Sincronizzazione completata con successo!');
      } else {
        setFeedback(res.error || 'Errore durante la sincronizzazione.');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Non ancora sincronizzato';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 10) return 'Proprio adesso';
    if (diffSec < 60) return `${diffSec} secondi fa`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min fa`;
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const totalExercises = workouts.reduce((sum, day) => sum + day.exercises.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
              <User className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Profilo & Server</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Account sincronizzato</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="my-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-lg">
                {(user.displayName || user.username).substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                  {user.displayName || user.username}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">@{user.username}</p>
              </div>
            </div>

            <div className="flex flex-col items-end">
              {syncStatus === 'synced' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Sincronizzato
                </span>
              )}
              {syncStatus === 'syncing' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  In sync...
                </span>
              )}
              {syncStatus === 'offline' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <WifiOff className="w-3 h-3" />
                  Offline
                </span>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Esercizi configurati:</span>
              <p className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">{totalExercises} esercizi</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Allenamenti completati:</span>
              <p className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">{history.length} sessioni</p>
            </div>
          </div>
        </div>

        {/* Sync Info Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2 mb-5">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Cloud className="w-4 h-4 text-emerald-500" />
              Ultima sincronizzazione:
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {formatLastSync(lastSyncTime)}
            </span>
          </div>

          <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/50 flex items-start gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
            <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              I tuoi dati sono persistenti sul server. Anche se cancelli i dati del browser o la cache,
              ti basterà effettuare l'accesso per ritrovare tutto.
            </span>
          </div>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Sincronizzazione in corso...' : 'Sincronizza Adesso'}</span>
          </button>

          {/* Switch Account */}
          <button
            onClick={() => {
              onClose();
              onOpenAuth();
            }}
            className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700/60 transition cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>Accedi con un Altro Account</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center justify-center gap-2 border border-rose-500/20 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnetti da questo dispositivo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
