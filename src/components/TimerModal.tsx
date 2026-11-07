import React from 'react';
import { Play, Pause, Plus, Minus, SkipForward, Minimize2, Watch, X } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

export const TimerModal: React.FC = () => {
  const { timer, pauseTimer, resumeTimer, adjustTimer, stopTimer, isTimerModalOpen, setIsTimerModalOpen } =
    useWorkout();

  if (!isTimerModalOpen || !timer.isActive) return null;

  const minutes = Math.floor(timer.remainingSeconds / 60);
  const seconds = timer.remainingSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const progress = timer.totalDuration > 0 ? timer.remainingSeconds / timer.totalDuration : 0;
  const strokeDashoffset = 880 * (1 - progress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/90 backdrop-blur-xl animate-fade-in select-none transition-colors duration-200">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center transition-colors duration-200">
        {/* Top bar with Minimize & Close */}
        <div className="w-full flex items-center justify-between mb-2">
          <button
            onClick={() => setIsTimerModalOpen(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700/60 transition cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Riduci</span>
          </button>

          <button
            onClick={stopTimer}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 transition cursor-pointer"
            title="Annulla Timer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Exercise info tag */}
        <div className="mb-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
            Riposo in corso
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2 px-2 truncate max-w-xs">
            {timer.exerciseName || 'Recupero'}
          </h2>
          {timer.setNumber && timer.totalSets && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Serie {timer.setNumber} di {timer.totalSets} completata
            </p>
          )}
        </div>

        {/* Circular Countdown Ring (Big Crono) */}
        <div className="relative w-60 h-60 sm:w-64 sm:h-64 flex items-center justify-center my-1">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 300 300">
            {/* Background track */}
            <circle
              cx="150"
              cy="150"
              r="140"
              className="text-slate-200 dark:text-slate-800 stroke-current"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Animated progress circle */}
            <circle
              cx="150"
              cy="150"
              r="140"
              stroke={timer.remainingSeconds <= 5 ? '#f43f5e' : '#10b981'}
              strokeWidth="14"
              strokeDasharray="880"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-300 ease-linear shadow-lg"
              style={{
                filter:
                  timer.remainingSeconds <= 5
                    ? 'drop-shadow(0 0 12px rgba(244,63,94,0.5))'
                    : 'drop-shadow(0 0 12px rgba(16,185,129,0.4))',
              }}
            />
          </svg>

          {/* Central Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className={`font-mono text-5xl font-black tracking-tight leading-none ${
                timer.remainingSeconds <= 5
                  ? 'text-rose-500 dark:text-rose-400 animate-pulse'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {formattedTime}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2 font-semibold">
              {timer.isPaused ? 'In Pausa' : 'Rimanenti'}
            </span>
          </div>
        </div>

        {/* Smartwatch active badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs mt-1 mb-4">
          <Watch className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Notifica orologio attiva al termine</span>
        </div>

        {/* Quick Adjust Buttons: +15s on Left, -15s on Right */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-3">
          <button
            onClick={() => adjustTimer(15)}
            className="py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>+15s</span>
          </button>
          <button
            onClick={() => adjustTimer(-15)}
            className="py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>-15s</span>
          </button>
        </div>

        {/* Main Controls: Pause / Skip */}
        <div className="flex items-center gap-3 w-full max-w-xs">
          <button
            onClick={timer.isPaused ? resumeTimer : pauseTimer}
            className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer ${
              timer.isPaused
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {timer.isPaused ? (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Riprendi</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pausa</span>
              </>
            )}
          </button>

          <button
            onClick={stopTimer}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
          >
            <SkipForward className="w-4 h-4 fill-current" />
            <span>Salta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
