import React, { useState } from 'react';
import { PlusCircle, X, Plus, Minus } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({ isOpen, onClose }) => {
  const { currentDayId, addExercise } = useWorkout();

  const [name, setName] = useState('');
  const [setsCount, setSetsCount] = useState(4);
  const [targetReps, setTargetReps] = useState('10');
  const [restSeconds, setRestSeconds] = useState(90);
  const [notes, setNotes] = useState('');
  const [machineSetting, setMachineSetting] = useState('');

  if (!isOpen) return null;

  const restPresets = [
    { label: '60s (1m)', val: 60 },
    { label: '90s (1.5m)', val: 90 },
    { label: '120s (2m)', val: 120 },
    { label: '150s (2.5m)', val: 150 },
    { label: '180s (3m)', val: 180 },
  ];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const sets = Array.from({ length: setsCount }, (_, i) => ({
      id: `set-${Date.now()}-${i + 1}`,
      setNumber: i + 1,
      targetReps,
      actualReps: parseInt(targetReps, 10) || 10,
      weightKg: 0,
      completed: false,
    }));

    const parsedSetting = machineSetting.trim() === '' ? undefined : parseFloat(machineSetting.trim());

    addExercise(currentDayId, {
      name: name.trim(),
      category: 'chest',
      defaultRestSeconds: restSeconds,
      notes: notes.trim(),
      machineSetting: parsedSetting !== undefined && !Number.isNaN(parsedSetting) ? parsedSetting : undefined,
      sets,
    });

    setName('');
    setNotes('');
    setMachineSetting('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Aggiungi Esercizio</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Nuovo esercizio alla scheda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Nome Esercizio
            </label>
            <input
              type="text"
              required
              placeholder="es. Panca inclinata manubri"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Serie
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
                Reps Target
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

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Tempo di Riposo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {restPresets.map((p) => (
                <button
                  type="button"
                  key={p.val}
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Impostazione Macchina (opzionale)
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Posizione sedile / perno
              </span>
            </div>
            <input
              type="number"
              step="any"
              placeholder="es. 4"
              value={machineSetting}
              onChange={(e) => setMachineSetting(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm font-semibold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Note (opzionale)
            </label>
            <input
              type="text"
              placeholder="es. Movimento controllato"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              Aggiungi alla Scheda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
