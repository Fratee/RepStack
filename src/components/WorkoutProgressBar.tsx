import React, { useState, useEffect } from 'react';
import { CheckCircle2, RotateCcw, Flame, X } from 'lucide-react';
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
  const [confirmAction, setConfirmAction] = useState<'finish' | 'cancel' | null>(null);

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
                onClick={() => setConfirmAction('finish')}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Termina Workout</span>
              </button>

              <button
                onClick={() => setConfirmAction('cancel')}
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

      {/* Confirmation Dialog Modal */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setConfirmAction(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {confirmAction === 'finish' ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-4">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Terminare il Workout?
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Hai completato <strong className="text-emerald-600 dark:text-emerald-400">{totalSetsCompletedInDay} di {totalSetsInDay}</strong> serie ({percentage}%).
                  La sessione verrà salvata nella cronologia e le serie completate verranno azzerate.
                </p>
                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={() => {
                      finishWorkout();
                      setConfirmAction(null);
                    }}
                    className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                  >
                    Termina
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-4">
                  <RotateCcw className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Ricominciare l'Allenamento?
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Il timer e tutte le serie completate verranno azzerati come a fine workout. Nessun dato verrà salvato nella cronologia.
                </p>
                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={() => {
                      cancelWorkout();
                      setConfirmAction(null);
                    }}
                    className="flex-1 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    Ricomincia
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
