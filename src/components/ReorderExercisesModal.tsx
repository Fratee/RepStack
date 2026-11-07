import React from 'react';
import { Settings, ChevronUp, ChevronDown, X, Check, Dumbbell } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

interface ReorderExercisesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReorderExercisesModal: React.FC<ReorderExercisesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentWorkout, moveExercise } = useWorkout();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[85vh] flex flex-col">
        {/* Header with Cog */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Riordina Esercizi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentWorkout.title} • {currentWorkout.exercises.length} esercizi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Exercises List */}
        <div className="overflow-y-auto py-4 space-y-2.5 flex-1 pr-1">
          {currentWorkout.exercises.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Dumbbell className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Nessun esercizio presente
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Aggiungi prima degli esercizi alla scheda per poterli riordinare.
              </p>
            </div>
          ) : (
            currentWorkout.exercises.map((exercise, index) => {
              const isFirst = index === 0;
              const isLast = index === currentWorkout.exercises.length - 1;

              return (
                <div
                  key={exercise.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between gap-3 transition"
                >
                  {/* Position number & name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {exercise.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {exercise.sets.length} serie × {exercise.sets[0]?.targetReps || '8'} rip
                        {exercise.machineSetting !== undefined &&
                          exercise.machineSetting !== null && (
                            <span className="ml-1.5 text-slate-400">
                              • Macchina: {exercise.machineSetting}
                            </span>
                          )}
                      </p>
                    </div>
                  </div>

                  {/* Move Up / Down Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => moveExercise(currentWorkout.id, index, 'up')}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold transition cursor-pointer active:scale-95 ${
                        isFirst
                          ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 shadow-xs'
                      }`}
                      title="Sposta su"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => moveExercise(currentWorkout.id, index, 'down')}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold transition cursor-pointer active:scale-95 ${
                        isLast
                          ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 shadow-xs'
                      }`}
                      title="Sposta giù"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Fatto</span>
          </button>
        </div>
      </div>
    </div>
  );
};
