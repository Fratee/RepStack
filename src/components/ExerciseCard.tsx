import React, { useState } from 'react';
import { Check, Edit3, Clock, Plus, Minus, X } from 'lucide-react';
import type { Exercise } from '../types';
import { useWorkout } from '../context/WorkoutContext';
import { WeightSpinModal } from './WeightSpinModal';

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  onEdit: (exercise: Exercise) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, index, onEdit }) => {
  const {
    toggleSetCompleted,
    updateSet,
    setExerciseSetWeight,
    setExerciseMachineSetting,
    startTimer,
    setIsTimerModalOpen,
  } = useWorkout();

  const [weightModalSet, setWeightModalSet] = useState<{
    id: string;
    setNumber: number;
    weightKg: number;
  } | null>(null);

  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [tempSetting, setTempSetting] = useState<number | undefined>(exercise.machineSetting);

  const completedSetsCount = exercise.sets.filter((s) => s.completed).length;
  const isAllCompleted = completedSetsCount === exercise.sets.length && exercise.sets.length > 0;

  const handleStartTimer = (seconds?: number) => {
    const rest = seconds || exercise.defaultRestSeconds;
    startTimer(rest, exercise.name);
    setIsTimerModalOpen(true);
  };

  const formatRest = (sec: number) => {
    if (sec % 60 === 0) return `${sec / 60}m`;
    return `${Math.floor(sec / 60)}.${(sec % 60) === 30 ? '5' : ''}m`;
  };

  return (
    <div
      className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
        isAllCompleted
          ? 'bg-emerald-500/5 dark:bg-slate-900/60 border-emerald-500/40 dark:border-emerald-500/30 shadow-md shadow-emerald-500/5'
          : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-sm dark:shadow-none'
      }`}
    >
      {/* Exercise Header */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700/60">
              {index + 1}
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                <span className="truncate">{exercise.name}</span>
                {isAllCompleted && (
                  <span className="shrink-0 text-emerald-600 dark:text-emerald-400 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 font-semibold">
                    Completato
                  </span>
                )}
              </h3>
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span>
                  {exercise.sets.length} serie × {exercise.sets[0]?.targetReps || '8'} rip
                </span>
                {exercise.machineSetting !== undefined &&
                  exercise.machineSetting !== null &&
                  !Number.isNaN(exercise.machineSetting) && (
                    <button
                      type="button"
                      onClick={() => {
                        setTempSetting(exercise.machineSetting);
                        setIsMachineModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 font-medium transition cursor-pointer select-none group"
                      title="Impostazione Macchina: tocca per modificare velocemente"
                    >
                      <span className="text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 transition">
                        Macchina:
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition">
                        {exercise.machineSetting}
                      </span>
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Rest Info, Quick Timer & Edit */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/60">
          <button
            type="button"
            onClick={() => handleStartTimer()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold transition cursor-pointer group"
            title={`Avvia timer riposo (${exercise.defaultRestSeconds}s)`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition" />
            <span>
              Recupero:{' '}
              <strong className="font-mono text-slate-900 dark:text-white font-bold">
                {formatRest(exercise.defaultRestSeconds)}
              </strong>{' '}
              ({exercise.defaultRestSeconds}s)
            </span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(exercise)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 transition cursor-pointer"
            title="Modifica esercizio"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sets Table */}
      <div className="px-4 pb-4 space-y-2.5">
        <div className="bg-slate-50/80 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-2 sm:p-3">
          <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 pb-2 border-b border-slate-200 dark:border-slate-800/60">
            <div className="col-span-2 text-center">Set</div>
            <div className="col-span-4 text-center">Peso (Kg)</div>
            <div className="col-span-3 text-center">Reps</div>
            <div className="col-span-3 text-center">Fatto</div>
          </div>

          <div className="divide-y divide-slate-200/80 dark:divide-slate-800/40">
            {exercise.sets.map((set) => (
              <div
                key={set.id}
                className={`grid grid-cols-12 gap-2 items-center py-2 px-1 rounded-xl transition ${
                  set.completed ? 'bg-emerald-500/10 dark:bg-emerald-500/5' : ''
                }`}
              >
                {/* Set number */}
                <div className="col-span-2 text-center font-mono font-bold text-sm text-slate-700 dark:text-slate-300">
                  {set.setNumber}
                </div>

                {/* Weight 3D Wheel Trigger Button */}
                <div className="col-span-4 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      // Start from current set weight; if 0, inherit previous set's weight so user doesn't start from 0
                      let initialVal = set.weightKg || 0;
                      if (initialVal === 0) {
                        const prevWithWeight = exercise.sets
                          .slice(0, set.setNumber - 1)
                          .reverse()
                          .find((s) => (s.weightKg || 0) > 0);
                        if (prevWithWeight && prevWithWeight.weightKg) {
                          initialVal = prevWithWeight.weightKg;
                        } else if (exercise.sets[0]?.weightKg) {
                          initialVal = exercise.sets[0].weightKg;
                        }
                      }

                      setWeightModalSet({
                        id: set.id,
                        setNumber: set.setNumber,
                        weightKg: initialVal,
                      });
                    }}
                    className="w-full max-w-[96px] h-9 px-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl font-mono text-sm font-black text-slate-900 dark:text-white flex items-center justify-center gap-1 shadow-xs hover:shadow-emerald-500/10 active:scale-95 transition cursor-pointer group"
                    title="Tocca per aprire la rotella 3D e impostare il peso"
                  >
                    <span>{set.weightKg || 0}</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition">
                      kg
                    </span>
                  </button>
                </div>

                {/* Reps Stepper & Input */}
                <div className="col-span-3 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      updateSet(exercise.id, set.id, { actualReps: Math.max(1, (set.actualReps || 1) - 1) })
                    }
                    className="w-6 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-400 flex items-center justify-center font-bold text-xs"
                    title="-1 rip"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    value={set.actualReps}
                    onChange={(e) =>
                      updateSet(exercise.id, set.id, { actualReps: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-10 h-8 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-lg text-center font-mono text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateSet(exercise.id, set.id, { actualReps: (set.actualReps || 0) + 1 })
                    }
                    className="w-6 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-400 flex items-center justify-center font-bold text-xs"
                    title="+1 rip"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Completed Checkmark Button */}
                <div className="col-span-3 flex items-center justify-center">
                  <button
                    onClick={() => toggleSetCompleted(exercise.id, set.id)}
                    className={`w-10 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                      set.completed
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 scale-105'
                        : 'bg-slate-100 dark:bg-slate-800/90 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700/60'
                    }`}
                  >
                    <Check className={`w-4 h-4 stroke-[3] ${set.completed ? 'text-slate-950' : ''}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Note below the sets */}
        {exercise.notes && exercise.notes.trim() && (
          <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <span className="font-semibold text-slate-400 dark:text-slate-500 shrink-0 text-[11px] uppercase tracking-wider pt-0.5">
              Note:
            </span>
            <span className="whitespace-pre-line leading-relaxed flex-1 italic text-slate-600 dark:text-slate-300">
              {exercise.notes.trim()}
            </span>
          </div>
        )}
      </div>

      {/* Weight Spinning / Dialing Modal */}
      {weightModalSet && (
        <WeightSpinModal
          isOpen={!!weightModalSet}
          onClose={() => setWeightModalSet(null)}
          exerciseName={exercise.name}
          setNumber={weightModalSet.setNumber}
          totalSets={exercise.sets.length}
          initialWeight={weightModalSet.weightKg}
          onSave={(newWeight, applyToFollowing) => {
            setExerciseSetWeight(exercise.id, weightModalSet.id, newWeight, applyToFollowing);
          }}
        />
      )}

      {/* Quick Machine Setting Modal */}
      {isMachineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="min-w-0 pr-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">Impostazione Macchina</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{exercise.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMachineModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-5 flex flex-col items-center">
              <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-3">
                Posizione / Perno / Sedile
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTempSetting((v) => Math.max(0, (v ?? 1) - 1))}
                  className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-lg active:scale-95 transition cursor-pointer"
                  title="-1"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  step="any"
                  value={tempSetting ?? ''}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setTempSetting(val === '' ? undefined : parseFloat(val));
                  }}
                  className="w-24 h-12 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl text-center font-mono text-2xl font-black text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setTempSetting((v) => (v === undefined ? 1 : v + 1))}
                  className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-lg active:scale-95 transition cursor-pointer"
                  title="+1"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setExerciseMachineSetting(exercise.id, undefined);
                  setIsMachineModalOpen(false);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 hover:text-rose-500 text-xs font-semibold text-slate-500 dark:text-slate-400 transition cursor-pointer"
              >
                Rimuovi
              </button>
              <button
                type="button"
                onClick={() => {
                  setExerciseMachineSetting(exercise.id, tempSetting);
                  setIsMachineModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
