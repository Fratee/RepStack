import React from 'react';
import { History, Calendar, Clock, Dumbbell, Trash2, X, Trophy } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const { history, deleteHistoryItem, clearHistory } = useWorkout();

  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    return `${mins} min`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Cronologia Allenamenti</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{history.length} sessioni completate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto py-4 space-y-3 flex-1 min-h-[200px]">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nessun allenamento completato ancora</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Completa una sessione premendo "Termina Workout" per vederla registrata qui con volume e statistiche!
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{item.dayTitle}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                        {item.completedSets}/{item.totalSets} serie
                      </span>
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        {formatDate(item.endTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        {formatDuration(item.durationSeconds)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteHistoryItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Volume & details */}
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Dumbbell className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    <span>
                      Volume totale:{' '}
                      <strong className="text-slate-900 dark:text-white font-mono">{item.totalVolumeKg.toLocaleString()} kg</strong>
                    </span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400">{item.exercisesSummary.length} esercizi</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
            <button
              onClick={clearHistory}
              className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400/80 dark:hover:text-rose-400 transition"
            >
              Cancella tutta la cronologia
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs transition"
            >
              Chiudi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
