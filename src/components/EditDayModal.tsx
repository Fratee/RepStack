import React, { useState, useEffect } from 'react';
import { Edit3, Trash2, X, PlusCircle, ChevronUp, ChevronDown } from 'lucide-react';
import type { WorkoutDay } from '../types';
import { useWorkout } from '../context/WorkoutContext';

interface EditDayModalProps {
  day: WorkoutDay | null;
  isOpen: boolean;
  onClose: () => void;
  isCreatingNew?: boolean;
}

export const EditDayModal: React.FC<EditDayModalProps> = ({
  day,
  isOpen,
  onClose,
  isCreatingNew = false,
}) => {
  const { workouts, updateWorkoutDay, addWorkoutDay, deleteWorkoutDay, moveExercise } = useWorkout();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');

  useEffect(() => {
    if (day && !isCreatingNew) {
      setTitle(day.title);
      setSubtitle(day.subtitle || '');
    } else if (isCreatingNew) {
      setTitle(`Giorno ${workouts.length + 1}`);
      setSubtitle('');
    }
  }, [day, isCreatingNew, workouts.length, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isCreatingNew) {
      addWorkoutDay(title.trim(), subtitle.trim());
    } else if (day) {
      updateWorkoutDay(day.id, {
        title: title.trim(),
        subtitle: subtitle.trim(),
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (!day || workouts.length <= 1) return;
    if (
      window.confirm(
        `Sei sicuro di voler eliminare "${day.title}"? Tutti gli esercizi associati verranno rimossi.`
      )
    ) {
      deleteWorkoutDay(day.id);
      onClose();
    }
  };

  const exercises = day?.exercises || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {isCreatingNew ? <PlusCircle className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {isCreatingNew ? 'Aggiungi Nuovo Giorno' : 'Modifica Scheda Giorno'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isCreatingNew
                  ? 'Crea una nuova scheda di allenamento'
                  : 'Personalizza titolo, focus e ordine degli esercizi'}
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

        {/* Form fields & Exercises ordering */}
        <form onSubmit={handleSave} className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
          {/* Day Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Titolo Giorno
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Giorno 1, Push Day, Gambe & Spalle"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Subtitle / Focus */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Sottotitolo / Focus muscolare (opzionale)
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="es. Gambe, Dorso & Petto"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Exercises Ordering section */}
          {!isCreatingNew && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Ordine degli Esercizi ({exercises.length})
                </label>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Usa le frecce per ordinare
                </span>
              </div>

              {exercises.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  Nessun esercizio presente in questa scheda.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {exercises.map((exercise, index) => {
                    const isFirst = index === 0;
                    const isLast = index === exercises.length - 1;

                    return (
                      <div
                        key={exercise.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {exercise.name}
                            </h5>
                            <p className="text-[10px] text-slate-400 truncate">
                              {exercise.sets.length} serie × {exercise.sets[0]?.targetReps || '8'} rip
                              {exercise.machineSetting !== undefined &&
                                exercise.machineSetting !== null && (
                                  <span className="ml-1 text-slate-400">
                                    • Macch: {exercise.machineSetting}
                                  </span>
                                )}
                            </p>
                          </div>
                        </div>

                        {/* Arrows */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => day && moveExercise(day.id, index, 'up')}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer active:scale-95 ${
                              isFirst
                                ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 shadow-xs'
                            }`}
                            title="Sposta su"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => day && moveExercise(day.id, index, 'down')}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer active:scale-95 ${
                              isLast
                                ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 shadow-xs'
                            }`}
                            title="Sposta giù"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            {!isCreatingNew && workouts.length > 1 ? (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                title="Elimina Giorno"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                {isCreatingNew ? 'Crea Giorno' : 'Salva'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
