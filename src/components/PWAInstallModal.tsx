import React from 'react';
import { Download, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
  isIOS: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  isIOS,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Download className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Installa RepStack</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">App nativa PWA per telefono e smartwatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Benefits */}
        <div className="my-5 space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span>Notifiche con vibrazione sincronizzate su Apple Watch & smartwatch</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span>Funziona al 100% offline, anche nei sotterranei della palestra</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span>Esperienza a schermo intero senza barre del browser</span>
          </div>
        </div>

        {/* Instructions */}
        {isIOS ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <p className="text-xs font-semibold text-slate-900 dark:text-white">Come installare su iPhone (Safari):</p>
            <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 list-decimal pl-4">
              <li className="flex items-center gap-2">
                <span>1. Tocca l'icona <strong>Condividi</strong> in basso</span>
                <Share className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 inline ml-1" />
              </li>
              <li className="flex items-center gap-2">
                <span>2. Scorri e scegli <strong>"Aggiungi alla schermata Home"</strong></span>
                <PlusSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 inline ml-1" />
              </li>
              <li>
                <span>3. Tocca <strong>Aggiungi</strong> in alto a destra. Fatto!</span>
              </li>
            </ol>
          </div>
        ) : (
          <button
            onClick={onInstall}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Installa Ora come App</span>
          </button>
        )}

        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
