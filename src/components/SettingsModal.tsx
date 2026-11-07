import React, { useRef, useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  Volume2,
  Vibrate,
  Sun,
  Moon,
  Timer,
  RotateCcw,
  Download,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Cloud,
  User,
  RefreshCw,
  Palette,
  Check,
} from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { ACCENT_COLORS } from '../utils/accentColors';
import {
  getNotificationDiagnostics,
  requestNotificationPermission,
  testWatchNotification,
  clearAppCacheAndReload,
  type NotificationDiagnostics,
} from '../utils/notifications';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWatchGuide: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenWatchGuide,
}) => {
  const {
    settings,
    updateSettings,
    resetToDefaultWorkouts,
    workouts,
    history,
    user,
    setIsAuthModalOpen,
    setIsAccountModalOpen,
    syncWithServer,
  } = useWorkout();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [diag, setDiag] = useState<NotificationDiagnostics>(getNotificationDiagnostics());
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDiag(getNotificationDiagnostics());
      setNotificationMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isDarkMode = settings.theme === 'dark';

  const handleToggleNotifications = async (checked: boolean) => {
    if (checked) {
      const res = await requestNotificationPermission();
      const updatedDiag = getNotificationDiagnostics();
      setDiag(updatedDiag);

      if (res.granted) {
        updateSettings({ notificationsEnabled: true });
        setNotificationMsg({ type: 'success', text: 'Notifiche abilitate con successo!' });
      } else {
        updateSettings({ notificationsEnabled: false });
        setNotificationMsg({
          type: 'error',
          text: res.message || updatedDiag.actionableHint || 'Permesso notifiche non concesso nel browser.',
        });
      }
    } else {
      updateSettings({ notificationsEnabled: false });
      setNotificationMsg(null);
    }
  };

  const handleTestNotice = async () => {
    setIsTesting(true);
    const res = await testWatchNotification();
    setDiag(getNotificationDiagnostics());
    setNotificationMsg({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    setTimeout(() => {
      setIsTesting(false);
    }, 4000);
  };

  const handleExportData = () => {
    const data = {
      workouts,
      history,
      settings,
      version: 1,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymtimer-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.workouts) {
          localStorage.setItem('gym_workouts_v1', JSON.stringify(parsed.workouts));
        }
        if (parsed.history) {
          localStorage.setItem('gym_history_v1', JSON.stringify(parsed.history));
        }
        if (parsed.settings) {
          localStorage.setItem('gym_settings_v1', JSON.stringify(parsed.settings));
        }
        window.location.reload();
      } catch {
        alert('File non valido. Assicurati che sia un backup JSON esportato da GymTimer.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Impostazioni</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Preferenze timer, tema e notifiche</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings List */}
        <div className="mt-5 space-y-4">
          {/* ACCOUNT & SERVER SYNC (CLOUD BACKUP) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-50 to-slate-50 dark:from-emerald-950/20 dark:via-slate-800/40 dark:to-slate-800/40 border border-emerald-500/30 dark:border-emerald-500/20">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Account & Server Sync</span>
                    {user && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                        Attivo
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user
                      ? `Connesso come @${user.username}`
                      : 'Salvataggio su SQLite: mai più dati persi'}
                  </p>
                </div>
              </div>
            </div>

            {user ? (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setIsAccountModalOpen(true);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Gestisci Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => syncWithServer()}
                  className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="Sincronizza subito con il server"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sincronizza</span>
                </button>
              </div>
            ) : (
              <div className="pt-1">
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2.5 leading-relaxed">
                  I tuoi allenamenti, carichi e storico rimarranno sempre memorizzati sul server anche se svuoti la cache del browser o cambi dispositivo.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Accedi o Crea Account</span>
                </button>
              </div>
            )}
          </div>

          {/* THEME SWITCHER (WHITE / DARK MODE) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-indigo-500/10 flex items-center justify-center text-amber-500 dark:text-indigo-400">
                  {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Tema dell'App</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isDarkMode ? 'Modalità Scura attiva' : 'Modalità Chiara (Bianca) attiva'}
                  </p>
                </div>
              </div>
            </div>

            {/* Segmented Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/70 dark:bg-slate-950/60 rounded-xl border border-slate-300/60 dark:border-slate-800">
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'light' })}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  !isDarkMode
                    ? 'bg-white text-slate-900 shadow-md shadow-slate-300/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Sun className={`w-3.5 h-3.5 ${!isDarkMode ? 'text-amber-500' : ''}`} />
                <span>Chiaro</span>
              </button>

              <button
                type="button"
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-800 text-white shadow-md shadow-black/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Moon className={`w-3.5 h-3.5 ${isDarkMode ? 'text-indigo-400' : ''}`} />
                <span>Scuro</span>
              </button>
            </div>
          </div>

          {/* Accent Color Customization */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Colore di Accento</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Personalizza bottoni, progressi e dettagli dell'interfaccia
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {ACCENT_COLORS.map((c) => {
                const isSelected = (settings.accentColor || 'emerald') === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => updateSettings({ accentColor: c.id })}
                    className={`p-2.5 rounded-2xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-sm ring-2 ring-emerald-500/30'
                        : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-7 h-7 rounded-full shadow-sm flex items-center justify-center text-white"
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate max-w-full">
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smartwatch / Browser Notifications with Live Diagnostics */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-teal-500 dark:text-teal-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifiche Smartwatch & Telefono</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Avvisi timer al polso e a schermo bloccato</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.notificationsEnabled && diag.permission === 'granted'}
                onChange={(e) => handleToggleNotifications(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Real Permission Badge */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Permesso Browser:</span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  diag.permission === 'granted'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : diag.permission === 'denied'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-amber-500'
                }`}
              >
                {diag.permission === 'granted' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {diag.permission === 'denied' && <AlertTriangle className="w-3.5 h-3.5" />}
                {diag.permission === 'granted'
                  ? 'Consentito ✓'
                  : diag.permission === 'denied'
                  ? 'Bloccato 🔒'
                  : 'Da autorizzare'}
              </span>
            </div>

            {/* Diagnostic Message / Error / Hint */}
            {diag.actionableHint && diag.permission !== 'granted' && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
                {diag.actionableHint}
              </div>
            )}

            {notificationMsg && (
              <div
                className={`p-2.5 rounded-xl text-xs leading-relaxed flex items-start gap-1.5 ${
                  notificationMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300'
                }`}
              >
                {notificationMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{notificationMsg.text}</span>
              </div>
            )}

            {/* Actions: Request or Test */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {diag.permission !== 'granted' ? (
                <button
                  type="button"
                  onClick={() => handleToggleNotifications(true)}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Abilita Ora
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTestNotice}
                  disabled={isTesting}
                  className="w-full py-2 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
                >
                  {isTesting ? 'Invio in corso...' : 'Invia Notifica Test'}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWatchGuide();
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Guida Watch</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Auto-start timer */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Timer automatico</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Avvia il riposo quando spunti una serie</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoStartTimer}
              onChange={(e) => updateSettings({ autoStartTimer: e.target.checked })}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          {/* Sound enabled */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-cyan-500 dark:text-cyan-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Suoni e Segnali Acustici</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Beep a 3-2-1s e campana di fine riposo</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          {/* Vibration */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Vibrate className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Vibrazione</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Feedback tattile al tocco e termine timer</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.vibrationEnabled}
              onChange={(e) => updateSettings({ vibrationEnabled: e.target.checked })}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          {/* Keep screen awake (WakeLock) */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Sun className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Schermo sempre attivo</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Evita che il telefono vada in standby durante l'allenamento</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.wakeLockEnabled}
              onChange={(e) => updateSettings({ wakeLockEnabled: e.target.checked })}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Data Management & Reset */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Dati & Ripristino
          </h4>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportData}
              className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Esporta Dati</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importa Dati</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>

          <button
            onClick={async () => {
              if (
                window.confirm(
                  'Vuoi cancellare la cache del browser e ricaricare l\'applicazione per ottenere la versione più recente?'
                )
              ) {
                await clearAppCacheAndReload();
              }
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700/80 transition cursor-pointer"
            title="Svuota la cache del Service Worker e ricarica i file aggiornati"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-500" />
            <span>Svuota Cache PWA & Ricarica Ultima Versione</span>
          </button>

          <button
            onClick={() => {
              if (
                window.confirm(
                  'Vuoi ripristinare la scheda originale Giorno 1 e Giorno 2 esattamente come impostata?'
                )
              ) {
                resetToDefaultWorkouts();
                onClose();
              }
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 border border-rose-500/20 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ripristina Scheda Originale (Giorno 1 & 2)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
