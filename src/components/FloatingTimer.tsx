import React from 'react';
import { Play, Pause, Maximize2, X } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

export const FloatingTimer: React.FC = () => {
  const { timer, pauseTimer, resumeTimer, stopTimer, isTimerModalOpen, setIsTimerModalOpen } = useWorkout();

  if (!timer.isActive || isTimerModalOpen) return null;

  const minutes = Math.floor(timer.remainingSeconds / 60);
  const seconds = timer.remainingSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const progress = timer.totalDuration > 0 ? timer.remainingSeconds / timer.totalDuration : 0;
  const strokeDashoffset = 100 * (1 - progress);

  return (
    <div className="fixed bottom-6 left-0 right-0 z-40 w-full px-4 flex justify-center pointer-events-none select-none">
      <div className="w-full max-w-md flex items-center justify-between p-3.5 px-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 rounded-3xl shadow-2xl shadow-slate-400/20 dark:shadow-black/60 transition-colors duration-200 pointer-events-auto animate-slide-up">
        {/* Left: Ring + Time (tappable to expand) */}
        <div
          onClick={() => setIsTimerModalOpen(true)}
          className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
        >
          {/* Mini progress circle with precision centered text */}
          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 40 40">
              <circle
                cx="20"
                cy="20"
                r="16"
                className="text-slate-200 dark:text-slate-800 stroke-current"
                strokeWidth="3.5"
                fill="transparent"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke={timer.remainingSeconds <= 5 ? '#f43f5e' : '#10b981'}
                strokeWidth="4"
                strokeDasharray="100"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 text-center leading-none select-none">
                {timer.remainingSeconds}s
              </span>
            </div>
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-lg font-bold tracking-tight ${
                  timer.remainingSeconds <= 5 ? 'text-rose-500 dark:text-rose-400 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formattedTime}
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Riposo
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 truncate font-medium">
              {timer.exerciseName || 'Recupero'}
            </p>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <button
            onClick={timer.isPaused ? resumeTimer : pauseTimer}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 active:scale-95 transition cursor-pointer"
            title={timer.isPaused ? 'Riprendi' : 'Pausa'}
          >
            {timer.isPaused ? (
              <Play className="w-3.5 h-3.5 fill-current text-emerald-600 dark:text-emerald-400 ml-0.5" />
            ) : (
              <Pause className="w-3.5 h-3.5 fill-current text-slate-600 dark:text-slate-300" />
            )}
          </button>

          <button
            onClick={() => setIsTimerModalOpen(true)}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 active:scale-95 transition cursor-pointer"
            title="Espandi Timer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={stopTimer}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center border border-slate-200 dark:border-slate-700/60 active:scale-95 transition cursor-pointer"
            title="Ferma"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
