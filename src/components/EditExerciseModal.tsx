import React, { useState } from 'react';
import { Edit3, Trash2, X, Plus, Minus } from 'lucide-react';
import type { Exercise, WorkoutSet } from '../types';
import { useWorkout } from '../context/WorkoutContext';

interface EditExerciseModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditExerciseModal: React.FC<EditExerciseModalProps> = ({ exercise, isOpen, onClose }) => {
  const { currentDayId, updateExercise, deleteExercise } = useWorkout();

  if (!isOpen || !exercise) return null;

  const [name, setName] = useState(exercise.name);
  const [restSeconds, setRestSeconds] = useState(exercise.defaultRestSeconds);
  const [setsCount, setSetsCount] = useState(exercise.sets.length);
  const [targetReps, setTargetReps] = useState(exercise.sets[0]?.targetReps || '10');
  const [notes, setNotes] = useState(exercise.notes || '');
  const [machineSetting, setMachineSetting] = useState<string>(
    exercise.machineSetting !== undefined && exercise.machineSetting !== null
      ? String(exercise.machineSetting)
      : ''
  );

  const restPresets = [
    { label: '45s', val: 45 },
    { label: '60s (1m)', val: 60 },
    { label: '90s (1.5m)', val: 90 },
    { label: '120s (2m)', val: 120 },
    { label: '150s (2.5m)', val: 150 },
    { label: '180s (3m)', val: 180 },
  ];

  const handleSave = () => {
    let updatedSets: WorkoutSet[] = [...exercise.sets];

    if (setsCount > exercise.sets.length) {
      const additional = Array.from({ length: setsCount - exercise.sets.length }, (_, i) => {
        const setNum = exercise.sets.length + i + 1;
        const lastWeight = exercise.sets[exercise.sets.length - 1]?.weightKg || 0;
        return {
          id: `set-${Date.now()}-${setNum}`,
          setNumber: setNum,
          targetReps,
          actualReps: parseInt(targetReps, 10) || 10,
          weightKg: lastWeight,
          completed: false,
        };
      });
      updatedSets = [...updatedSets, ...additional];
    } else if (setsCount < exercise.sets.length) {
      updatedSets = updatedSets.slice(0, setsCount);
    }

    updatedSets = updatedSets.map((s) => ({
      ...s,
      targetReps,
    }));

    const parsedSetting = machineSetting.trim() === '' ? undefined : parseFloat(machineSetting.trim());

    updateExercise(currentDayId, {
      ...exercise,
      name,
      defaultRestSeconds: restSeconds,
      notes,
      machineSetting: parsedSetting !== undefined && !Number.isNaN(parsedSetting) ? parsedSetting : undefined,
      sets: updatedSets,
    });

    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Vuoi rimuovere "${exercise.name}" dalla scheda?`)) {
      deleteExercise(currentDayId, exercise.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Modifica Esercizio</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Personalizza serie, ripetizioni e riposo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form fields */}
        <div className="mt-5 space-y-4">
          {/* Exercise Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Nome Esercizio
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Sets and Reps count */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Numero di Serie
              </label>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 h-11">
                <button
                  type="button"
                  onClick={() => setSetsCount((c) => Math.max(1, c - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold cursor-pointer active:scale-95 transition"
                  title="-1 serie"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-bold text-base text-slate-900 dark:text-white">{setsCount}</span>
                <button
                  type="button"
                  onClick={() => setSetsCount((c) => Math.min(10, c + 1))}
                  className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold cursor-pointer active:scale-95 transition"
                  title="+1 serie"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Ripetizioni Target
              </label>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 h-11">
                <button
                  type="button"
                  onClick={() => {
                    const match = targetReps.match(/\d+/);
                    const current = match ? parseInt(match[0], 10) : 10;
                    setTargetReps(String(Math.max(1, current - 1)));
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold cursor-pointer active:scale-95 transition"
                  title="-1 rip"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  value={targetReps}
                  onChange={(e) => setTargetReps(e.target.value)}
                  className="w-16 bg-transparent text-center font-mono font-bold text-base text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const match = targetReps.match(/\d+/);
                    const current = match ? parseInt(match[0], 10) : 10;
                    setTargetReps(String(current + 1));
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold cursor-pointer active:scale-95 transition"
                  title="+1 rip"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Default Rest Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Tempo di Riposo Predefinito
            </label>
            <div className="grid grid-cols-3 gap-2">
              {restPresets.map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setRestSeconds(p.val)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    restSeconds === p.val
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Machine Setting (optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Impostazione Macchina
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="any"
                value={machineSetting}
                onChange={(e) => setMachineSetting(e.target.value)}
                placeholder="sedile 5, perno 3"
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm font-semibold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              {machineSetting !== '' && (
                <button
                  type="button"
                  onClick={() => setMachineSetting('')}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs text-slate-500 dark:text-slate-400 font-medium transition cursor-pointer"
                  title="Azzera impostazione macchina"
                >
                  Rimuovi
                </button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Note
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="es. Presa larga, 2 min di riposo"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 resize-y min-h-[72px]"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleDelete}
            className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition cursor-pointer"
            title="Elimina Esercizio"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition cursor-pointer"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              Salva Modifiche
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
