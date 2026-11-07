import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, X, PlusCircle } from 'lucide-react';
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
  const { workouts, updateWorkoutDay, addWorkoutDay, deleteWorkoutDay } = useWorkout();

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {isCreatingNew ? <PlusCircle className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {isCreatingNew ? 'Aggiungi Nuovo Giorno' : 'Modifica Giorno'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isCreatingNew
                  ? 'Crea una nuova scheda di allenamento'
                  : 'Personalizza nome e focus del workout'}
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

        {/* Form fields */}
        <form onSubmit={handleSave} className="mt-5 space-y-4">
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

          {/* Action buttons */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            {!isCreatingNew && workouts.length > 1 ? (
              <button
                type="button"
                onClick={handleDelete}
                className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition cursor-pointer"
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
                {isCreatingNew ? 'Crea Giorno' : 'Salva Modifiche'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
