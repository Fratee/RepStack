import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Dumbbell, X, Check, Plus, Minus } from 'lucide-react';
import { playWheelTickSound, playSetDoneSound } from '../utils/audio';
import { triggerHaptic } from '../utils/notifications';

interface WeightSpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  setNumber: number;
  totalSets: number;
  initialWeight: number;
  onSave: (newWeight: number, applyToFollowing: boolean) => void;
}

const ITEM_HEIGHT = 48; // Height in px for each number in drum wheel
const MAX_WEIGHT = 350;

export const WeightSpinModal: React.FC<WeightSpinModalProps> = ({
  isOpen,
  onClose,
  exerciseName,
  setNumber,
  totalSets,
  initialWeight,
  onSave,
}) => {
  // Current integer weight and optional fractional 0.5kg
  const [selectedWeight, setSelectedWeight] = useState<number>(Math.floor(initialWeight) || 0);
  const [hasHalfKg, setHasHalfKg] = useState<boolean>(initialWeight % 1 !== 0);
  const [applyToFollowing, setApplyToFollowing] = useState<boolean>(true);

  // 3D Drum roller ref
  const drumContainerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const lastTickWeight = useRef<number>(selectedWeight);

  // Generate 0 to 350 array of integers (1 kg increments)
  const weightNumbers = useMemo(() => {
    return Array.from({ length: MAX_WEIGHT + 1 }, (_, i) => i);
  }, []);

  // Sync initial weight when modal opens - immediate and exact
  useEffect(() => {
    if (isOpen) {
      const whole = Math.max(0, Math.min(MAX_WEIGHT, Math.floor(initialWeight) || 0));
      setSelectedWeight(whole);
      setHasHalfKg(initialWeight % 1 !== 0);
      lastTickWeight.current = whole;

      // Position drum immediately to current weight on mount
      requestAnimationFrame(() => {
        if (drumContainerRef.current) {
          isProgrammaticScroll.current = true;
          drumContainerRef.current.scrollTop = whole * ITEM_HEIGHT;
          setTimeout(() => {
            isProgrammaticScroll.current = false;
          }, 60);
        }
      });
    }
  }, [isOpen, initialWeight]);

  const totalEffectiveWeight = selectedWeight + (hasHalfKg ? 0.5 : 0);

  // Trigger feedback when weight changes
  const notifyTick = useCallback(() => {
    playWheelTickSound();
    triggerHaptic([12]);
  }, []);

  // Update weight programmatically starting ALWAYS from the CURRENT position
  const changeWeightBy = useCallback(
    (delta: number) => {
      // 1. Read current active value from the drum wheel position, fallback to selectedWeight
      let currentBase = selectedWeight;
      if (drumContainerRef.current) {
        const scrolledIndex = Math.round(drumContainerRef.current.scrollTop / ITEM_HEIGHT);
        if (!isNaN(scrolledIndex) && scrolledIndex >= 0 && scrolledIndex <= MAX_WEIGHT) {
          currentBase = scrolledIndex;
        }
      }

      const next = Math.max(0, Math.min(MAX_WEIGHT, currentBase + delta));
      lastTickWeight.current = next;
      setSelectedWeight(next);
      notifyTick();

      if (drumContainerRef.current) {
        isProgrammaticScroll.current = true;
        drumContainerRef.current.scrollTop = next * ITEM_HEIGHT;
        setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 60);
      }
    },
    [selectedWeight, notifyTick]
  );

  const setWeightDirectly = useCallback(
    (target: number) => {
      const clamped = Math.max(0, Math.min(MAX_WEIGHT, Math.floor(target)));
      lastTickWeight.current = clamped;
      setSelectedWeight(clamped);
      notifyTick();
      if (drumContainerRef.current) {
        isProgrammaticScroll.current = true;
        drumContainerRef.current.scrollTop = clamped * ITEM_HEIGHT;
        setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 60);
      }
    },
    [notifyTick]
  );

  // Handle 3D Drum Wheel Scroll
  const handleDrumScroll = () => {
    if (!drumContainerRef.current || isProgrammaticScroll.current) return;
    const scrollTop = drumContainerRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(MAX_WEIGHT, index));

    if (clamped !== lastTickWeight.current) {
      lastTickWeight.current = clamped;
      setSelectedWeight(clamped);
      notifyTick();
    }
  };

  const handleSave = () => {
    playSetDoneSound();
    triggerHaptic([80, 50, 100]);
    onSave(totalEffectiveWeight, applyToFollowing);
    onClose();
  };

  if (!isOpen) return null;

  // Preset plate weights common in gyms
  const presets = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-900 dark:text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                Seleziona Peso
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[190px]">
                {exerciseName} • Serie {setNumber}/{totalSets}
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

        {/* Big Weight Display */}
        <div className="my-3 text-center flex flex-col items-center">
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="font-mono text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalEffectiveWeight}
            </span>
            <span className="font-bold text-xl text-emerald-600 dark:text-emerald-400">kg</span>
          </div>

          {/* Micro plate .5 kg toggle */}
          <button
            type="button"
            onClick={() => {
              notifyTick();
              setHasHalfKg((prev) => !prev);
            }}
            className={`mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full transition cursor-pointer border ${
              hasHalfKg
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            {hasHalfKg ? '+0.5 kg Attivo ✓' : '+0.5 kg (Micro-carico)'}
          </button>
        </div>

        {/* 3D DRUM CYLINDER WHEEL (1 KG INCREMENTS) */}
        <div className="relative h-48 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center my-2 shadow-inner">
          {/* Highlight selector lens lines (Razor sharp, NO BLUR) */}
          <div
            className="absolute inset-x-3 border-y-2 border-emerald-500 pointer-events-none bg-emerald-500/10 dark:bg-emerald-500/15 z-10 rounded-xl shadow-xs flex items-center justify-end pr-4"
            style={{ height: `${ITEM_HEIGHT}px` }}
          >
            <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              kg
            </span>
          </div>

          {/* Top & Bottom subtle fade gradients (restricted to edges only) */}
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-slate-50 dark:from-slate-950 to-transparent pointer-events-none z-20" />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent pointer-events-none z-20" />

          {/* Scrollable drum column with snap */}
          <div
            ref={drumContainerRef}
            onScroll={handleDrumScroll}
            className="w-full h-full overflow-y-auto no-scrollbar py-[72px] scroll-smooth"
            style={{
              scrollSnapType: 'y mandatory',
            }}
          >
            {weightNumbers.map((kg) => {
              const isSelected = kg === selectedWeight;
              return (
                <div
                  key={kg}
                  onClick={() => setWeightDirectly(kg)}
                  className={`flex items-center justify-center font-mono cursor-pointer transition-colors duration-150 select-none ${
                    isSelected
                      ? 'text-3xl font-black text-slate-900 dark:text-white'
                      : 'text-xl font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                  style={{
                    height: `${ITEM_HEIGHT}px`,
                    scrollSnapAlign: 'center',
                  }}
                >
                  <span>{kg}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 1 KG STEPPING BUTTONS (-1 kg / +1 kg) */}
        <div className="grid grid-cols-4 gap-2 my-2">
          <button
            type="button"
            onClick={() => changeWeightBy(-5)}
            className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 active:scale-95 transition cursor-pointer"
          >
            -5
          </button>
          <button
            type="button"
            onClick={() => changeWeightBy(-1)}
            className="py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black text-sm border border-slate-300 dark:border-slate-700 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1"
          >
            <Minus className="w-3.5 h-3.5" />
            <span>1 kg</span>
          </button>
          <button
            type="button"
            onClick={() => changeWeightBy(1)}
            className="py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black text-sm border border-slate-300 dark:border-slate-700 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-500" />
            <span>1 kg</span>
          </button>
          <button
            type="button"
            onClick={() => changeWeightBy(5)}
            className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 active:scale-95 transition cursor-pointer"
          >
            +5
          </button>
        </div>

        {/* Presets Horizontal Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mb-2">
          {presets.map((kg) => (
            <button
              key={kg}
              type="button"
              onClick={() => setWeightDirectly(kg)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition cursor-pointer ${
                selectedWeight === kg
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {kg === 0 ? 'Libero' : `${kg}kg`}
            </button>
          ))}
        </div>

        {/* Apply to Following Sets checkbox */}
        <label className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={applyToFollowing}
            onChange={(e) => setApplyToFollowing(e.target.checked)}
            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
          />
          <span>Applica anche a tutte le serie successive</span>
        </label>

        {/* Confirm Action Button */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Conferma {totalEffectiveWeight} kg</span>
        </button>
      </div>
    </div>
  );
};
