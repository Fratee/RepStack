import React, { useState } from 'react';
import { Timer, Play, X, Plus, Minus } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

interface QuickTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickTimerModal: React.FC<QuickTimerModalProps> = ({ isOpen, onClose }) => {
  const { startTimer, setIsTimerModalOpen } = useWorkout();
  const [selectedSeconds, setSelectedSeconds] = useState(90);

  if (!isOpen) return null;

  const presets = [
    { label: '30s', val: 30 },
    { label: '45s', val: 45 },
    { label: '1 min', val: 60 },
    { label: '1.5 min', val: 90 },
    { label: '2 min', val: 120 },
    { label: '2.5 min', val: 150 },
    { label: '3 min', val: 180 },
    { label: '4 min', val: 240 },
  ];

  const handleStart = (sec: number) => {
    startTimer(sec, 'Recupero Personalizzato');
    setIsTimerModalOpen(true);
    onClose();
  };

  const minutes = Math.floor(selectedSeconds / 60);
  const seconds = selectedSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Timer Rapido</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Duration Display with Steppers */}
        <div className="flex flex-col items-center my-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedSeconds((prev) => Math.max(10, prev - 15))}
              className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold active:scale-95 transition cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-mono text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {formattedTime}
            </span>
            <button
              onClick={() => setSelectedSeconds((prev) => prev + 15)}
              className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase font-semibold tracking-wider">
            Tempo di recupero
          </span>
        </div>

        {/* Preset Pills */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {presets.map((p) => (
            <button
              key={p.val}
              onClick={() => setSelectedSeconds(p.val)}
              className={`py-2 px-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedSeconds === p.val
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Launch Button */}
        <button
          onClick={() => handleStart(selectedSeconds)}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Avvia Timer ({formattedTime})</span>
        </button>
      </div>
    </div>
  );
};
