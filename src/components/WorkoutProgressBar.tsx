import React, { useState, useEffect } from 'react';
import { CheckCircle2, RotateCcw, Flame } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

export const WorkoutProgressBar: React.FC = () => {
  const {
    isWorkoutActive,
    workoutStartTime,
    startWorkout,
    finishWorkout,
    cancelWorkout,
    totalSetsCompletedInDay,
    totalSetsInDay,
  } = useWorkout();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isWorkoutActive || !workoutStartTime) {
      setElapsedSeconds(0);
      return;
    }

    const update = () => {
      setElapsedSeconds(Math.floor((Date.now() - workoutStartTime) / 1000));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isWorkoutActive, workoutStartTime]);

  const formatStopwatch = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = totalSetsInDay > 0 ? Math.round((totalSetsCompletedInDay / totalSetsInDay) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-xl backdrop-blur-md transition-colors duration-200">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Workout Progress info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Progresso Scheda</span>
            {isWorkoutActive && (
              <span className="inline-flex items-center justify-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                {formatStopwatch(elapsedSeconds)}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
            {totalSetsCompletedInDay} di {totalSetsInDay} serie{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">({percentage}%)</span>
          </p>
        </div>

        {/* Action Button: Start or Finish */}
        <div className="flex items-center gap-2">
          {isWorkoutActive ? (
            <>
              <button
                onClick={finishWorkout}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Termina Workout</span>
              </button>

              <button
                onClick={cancelWorkout}
                className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 transition cursor-pointer"
                title="Ricomincia / Annulla"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={startWorkout}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              <Flame className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Inizia Sessione</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-2.5 mt-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-2.5 rounded-full transition-all duration-500 shadow-sm shadow-emerald-500/50"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
