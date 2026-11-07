import React, { useState, useEffect } from 'react';
import { Watch, Bell, CheckCircle2, AlertTriangle, Smartphone, X, Volume2, ShieldAlert } from 'lucide-react';
import {
  getNotificationDiagnostics,
  requestNotificationPermission,
  testWatchNotification,
  type NotificationDiagnostics,
} from '../utils/notifications';

interface WatchGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WatchGuideModal: React.FC<WatchGuideModalProps> = ({ isOpen, onClose }) => {
  const [diag, setDiag] = useState<NotificationDiagnostics>(getNotificationDiagnostics());
  const [testSent, setTestSent] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDiag(getNotificationDiagnostics());
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    const updated = getNotificationDiagnostics();
    setDiag(updated);

    if (res.granted) {
      setFeedback({ success: true, message: 'Notifiche autorizzate con successo!' });
    } else {
      setFeedback({
        success: false,
        message: res.message || updated.actionableHint || 'Autorizzazione non concessa.',
      });
    }
  };

  const handleTestNotification = async () => {
    setTestSent(true);
    const result = await testWatchNotification();
    setDiag(getNotificationDiagnostics());
    setFeedback(result);
    setTimeout(() => {
      setTestSent(false);
    }, 4500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Watch className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notifiche Smartwatch & Timer</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Apple Watch, Galaxy Watch, Wear OS, Garmin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission Banner */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  diag.permission === 'granted'
                    ? 'bg-emerald-500 dark:bg-emerald-400 shadow-lg shadow-emerald-400/50'
                    : diag.permission === 'denied'
                    ? 'bg-rose-500'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                  Stato notifiche:{' '}
                  {diag.permission === 'granted' ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Attive ✓</span>
                  ) : diag.permission === 'denied' ? (
                    <span className="text-rose-600 dark:text-rose-400 font-bold">Bloccate nel browser</span>
                  ) : (
                    <span className="text-amber-500 dark:text-amber-400 font-bold">Da autorizzare</span>
                  )}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {diag.statusMessage}
                </span>
              </div>
            </div>

            {diag.permission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer shrink-0 ml-2"
              >
                Abilita Ora
              </button>
            )}
          </div>

          {/* Actionable Hint if denied or insecure */}
          {diag.actionableHint && diag.permission !== 'granted' && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{diag.actionableHint}</span>
            </div>
          )}
        </div>

        {/* Test Notification Button */}
        <div className="mt-4">
          <button
            onClick={handleTestNotification}
            disabled={testSent}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-95 active:scale-[0.98] transition cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {testSent ? 'Invio in corso...' : 'Invia Notifica di Prova allo Smartwatch'}
          </button>

          {feedback && (
            <div
              className={`mt-2.5 p-3 rounded-2xl text-xs flex items-start gap-2 leading-relaxed ${
                feedback.success
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300'
              }`}
            >
              {feedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Come abilitare e vedere il timer sul tuo orologio
          </h4>

          {/* Browser Unblock Tip */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🔒 Se il browser non mostra il popup di consenso:</span>
            </p>
            <p>
              Tocca l'icona delle impostazioni del sito o del lucchetto a sinistra della barra degli indirizzi (URL) del browser, trova la voce <strong>Notifiche</strong> e impostala su <strong>Consenti</strong>.
            </p>
          </div>

          {/* Apple Watch */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium text-sm">
              <Watch className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Apple Watch (iPhone)</span>
            </div>
            <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal pl-4 leading-relaxed">
              <li>
                <strong>Installa l'app su iPhone</strong>: tocca Condividi e <em>"Aggiungi alla schermata Home"</em> (Apple sblocca le notifiche solo per le PWA installate).
              </li>
              <li>Apri l'app <strong>Watch</strong> sul tuo iPhone &gt; <strong>Notifiche</strong>.</li>
              <li>
                Scorri fino a <em>Duplica avvisi da iPhone</em> e attiva <strong>RepStack</strong> (o <strong>Safari</strong>).
              </li>
              <li>Quando scade il recupero, l'Apple Watch vibrerà al polso mostrandoti la prossima serie!</li>
            </ol>
          </div>

          {/* Wear OS / Galaxy Watch */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium text-sm">
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Galaxy Watch / Wear OS / Garmin (Android)</span>
            </div>
            <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal pl-4 leading-relaxed">
              <li>Apri l'app <strong>Galaxy Wearable</strong> o <strong>Wear OS</strong> sul telefono.</li>
              <li>Vai su <strong>Notifiche orologio</strong> &gt; <strong>Notifiche app</strong>.</li>
              <li>Attiva la spunta su <strong>RepStack</strong> o <strong>Chrome</strong>.</li>
              <li>Le notifiche del timer con vibrazione compariranno istantaneamente sul display del tuo orologio!</li>
            </ol>
          </div>

          {/* Tip */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex gap-2.5 items-start">
            <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong>Suono sempre attivo:</strong> Anche se le notifiche fossero disattivate, il telefono suonerà un segnale acustico a 3-2-1 secondi e una campana di fine riposo ad alto volume!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-sm transition cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
