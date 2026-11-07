// Smartwatch & Web Notification Manager with Service Worker sync & Wake Lock

import { playRestFinishedChime } from './audio';

let localTimeoutId: number | null = null;
let wakeLockSentinel: unknown = null;

export interface NotificationDiagnostics {
  isSupported: boolean;
  isSecureContext: boolean;
  permission: NotificationPermission | 'unsupported';
  isIOS: boolean;
  isStandalone: boolean;
  hasServiceWorker: boolean;
  statusMessage: string;
  actionableHint?: string;
}

export const getNotificationDiagnostics = (): NotificationDiagnostics => {
  if (typeof window === 'undefined') {
    return {
      isSupported: false,
      isSecureContext: false,
      permission: 'unsupported',
      isIOS: false,
      isStandalone: false,
      hasServiceWorker: false,
      statusMessage: 'Ambiente non supportato',
    };
  }

  const isSecure = window.isSecureContext ?? (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const hasSW = 'serviceWorker' in navigator;
  const hasNotification = 'Notification' in window;

  let permission: NotificationPermission | 'unsupported' = 'unsupported';
  if (hasNotification) {
    try {
      permission = Notification.permission;
    } catch {
      permission = 'unsupported';
    }
  }

  let statusMessage = '';
  let actionableHint: string | undefined = undefined;

  if (!isSecure) {
    statusMessage = 'Connessione non protetta (HTTP)';
    actionableHint =
      'I browser consentono le notifiche solo su HTTPS o localhost. Apri il sito con https:// (es. https://' +
      window.location.host +
      ')';
  } else if (isIOS && !isStandalone && !hasNotification) {
    statusMessage = 'Richiede installazione PWA (iOS)';
    actionableHint =
      'Su iPhone Apple abilita le notifiche solo se aggiungi l\'app alla Schermata Home: tocca Condividi e "Aggiungi alla schermata Home".';
  } else if (!hasNotification) {
    statusMessage = 'Notifiche Web non supportate in questo browser';
    actionableHint = 'Usa Chrome, Safari aggiornato o Edge.';
  } else if (permission === 'granted') {
    statusMessage = 'Notifiche abilitate ✓';
  } else if (permission === 'denied') {
    statusMessage = 'Notifiche bloccate nelle impostazioni del browser';
    actionableHint =
      'Hai bloccato le notifiche per questo sito: tocca l\'icona del lucchetto 🔒 o le impostazioni del sito a sinistra dell\'indirizzo URL e imposta Notifiche su "Consenti".';
  } else {
    statusMessage = 'In attesa di autorizzazione';
    actionableHint = 'Tocca "Abilita Notifiche" e rispondi "Consenti" alla richiesta del browser.';
  }

  return {
    isSupported: hasNotification || (isIOS && !isStandalone),
    isSecureContext: isSecure,
    permission,
    isIOS,
    isStandalone,
    hasServiceWorker: hasSW,
    statusMessage,
    actionableHint,
  };
};

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    return Notification.permission;
  } catch {
    return 'unsupported';
  }
};

/**
 * Request notification permission with dual Promise + Callback support
 */
export const requestNotificationPermission = async (): Promise<{
  granted: boolean;
  status: NotificationPermission | 'unsupported' | 'insecure';
  message?: string;
}> => {
  const diag = getNotificationDiagnostics();

  if (!diag.isSecureContext) {
    return {
      granted: false,
      status: 'insecure',
      message: diag.actionableHint || 'Richiede HTTPS o localhost.',
    };
  }

  if (diag.isIOS && !diag.isStandalone && !diag.isSupported) {
    return {
      granted: false,
      status: 'unsupported',
      message:
        'Su iPhone le notifiche sono consentite da Apple solo aggiungendo l\'app alla Home: tocca Condividi e seleziona "Aggiungi alla schermata Home".',
    };
  }

  if (!isNotificationSupported()) {
    return {
      granted: false,
      status: 'unsupported',
      message: 'Il tuo browser non supporta la Web Notification API.',
    };
  }

  try {
    let result: NotificationPermission = 'default';

    // Check if Notification.requestPermission returns a Promise (modern) or takes a callback (older Safari)
    const req = Notification.requestPermission();
    if (req && typeof req.then === 'function') {
      result = await req;
    } else {
      result = await new Promise<NotificationPermission>((resolve) => {
        Notification.requestPermission((res) => resolve(res));
      });
    }

    if (result === 'granted') {
      triggerHaptic([100, 50, 100]);
      return { granted: true, status: 'granted' };
    }

    if (result === 'denied') {
      return {
        granted: false,
        status: 'denied',
        message:
          'Notifiche bloccate: tocca il lucchetto 🔒 nella barra dell\'URL per reimpostare il permesso su "Consenti".',
      };
    }

    return { granted: false, status: result };
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return {
      granted: false,
      status: 'unsupported',
      message: `Errore durante la richiesta: ${String(err)}`,
    };
  }
};

/**
 * Triggers vibration on mobile device / smart watch if supported
 */
export const triggerHaptic = (pattern: number[] = [100, 50, 100]) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors if blocked by OS
    }
  }
};

/**
 * Register Service Worker & check for updates
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    // Check for updates on every mount so clients get the latest code
    reg.update().catch(() => {});
    return reg;
  } catch (err) {
    console.warn('Service Worker registration failed:', err);
    return null;
  }
};

/**
 * Force clear Service Worker and Cache Storage, then reload
 */
export const clearAppCacheAndReload = async () => {
  if (typeof window === 'undefined') return;
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
      }
    }
  } catch (e) {
    console.warn('Error clearing caches:', e);
  }
  window.location.reload();
};

/**
 * Schedule a rest timer notification on the Service Worker so smartwatches get notified
 */
export const scheduleTimerNotification = async ({
  targetTimestamp,
  durationSeconds,
  exerciseName,
  setNumber,
  totalSets,
}: {
  targetTimestamp: number;
  durationSeconds: number;
  exerciseName?: string;
  setNumber?: number;
  totalSets?: number;
}) => {
  // Clear any existing timer
  cancelTimerNotification();

  const title = `⏰ Riposo Finito! (${Math.floor(durationSeconds / 60)}:${(durationSeconds % 60).toString().padStart(2, '0')})`;
  const setInfo = setNumber && totalSets ? ` (Serie ${setNumber}/${totalSets})` : '';
  const body = exerciseName 
    ? `È ora di spingere su ${exerciseName}${setInfo}! Vai!`
    : `Tempo di riposo scaduto! Prossima serie pronta!`;

  // 1. Post to Service Worker (survives phone screen lock & wakes watch)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_TIMER',
      targetTime: targetTimestamp,
      title,
      body,
      exerciseName,
    });
  }

  // 2. Also register local fallback timeout in case SW messaging was delayed
  const delayMs = Math.max(0, targetTimestamp - Date.now());
  localTimeoutId = window.setTimeout(async () => {
    triggerHaptic([300, 100, 300, 100, 500]);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && reg.showNotification) {
            await reg.showNotification(title, {
              body,
              icon: '/icon-192.png',
              badge: '/badge-72.png',
              tag: 'gym-rest-timer',
              requireInteraction: true,
              data: { time: Date.now() },
            } as NotificationOptions);
            return;
          }
        }
        // Fallback to Window Notification
        new Notification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          tag: 'gym-rest-timer',
        });
      } catch (e) {
        console.warn('Could not display local notification:', e);
      }
    }
  }, delayMs);
};

export const cancelTimerNotification = () => {
  if (localTimeoutId) {
    clearTimeout(localTimeoutId);
    localTimeoutId = null;
  }

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CANCEL_TIMER',
    });
  }
};

/**
 * Send a test notification immediately so the user can verify smart watch vibration
 */
export const testWatchNotification = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  // Always trigger sound & haptics for instant feedback
  playRestFinishedChime();
  triggerHaptic([300, 150, 300, 150, 400]);

  const diag = getNotificationDiagnostics();

  if (!diag.isSecureContext) {
    return {
      success: false,
      message: diag.actionableHint || 'Il browser richiede HTTPS per consentire le notifiche.',
    };
  }

  if (diag.isIOS && !diag.isStandalone && !diag.isSupported) {
    return {
      success: false,
      message: 'Su iPhone le notifiche funzionano dopo aver aggiunto l\'app alla Home Screen (PWA).',
    };
  }

  if (!isNotificationSupported()) {
    return {
      success: false,
      message: 'La Web Notification API non è supportata da questo browser.',
    };
  }

  let perm = Notification.permission;
  if (perm !== 'granted') {
    const req = await requestNotificationPermission();
    if (!req.granted) {
      return {
        success: false,
        message:
          req.message ||
          'Autorizzazione notifiche non concessa. Clicca sull\'icona del lucchetto 🔒 nell\'URL per consentirle.',
      };
    }
    perm = 'granted';
  }

  try {
    if ('serviceWorker' in navigator) {
      let reg: ServiceWorkerRegistration | null | undefined = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await registerServiceWorker();
      }
      if (reg && reg.showNotification) {
        await reg.showNotification('⌚ GymTimer: Test Smartwatch & Telefono', {
          body: 'Perfetto! Riceverai vibrazione e notifica al termine di ogni riposo.',
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          tag: 'gym-test-timer',
        } as NotificationOptions);
        return {
          success: true,
          message: 'Notifica inviata con successo! Controlla orologio e schermo bloccato.',
        };
      }
    }

    new Notification('⌚ GymTimer: Test Smartwatch & Telefono', {
      body: 'Perfetto! Riceverai vibrazione e notifica al termine di ogni riposo.',
      icon: '/icon-192.png',
    });
    return {
      success: true,
      message: 'Notifica inviata! Controlla il tuo orologio o centro notifiche.',
    };
  } catch (err) {
    console.error('Failed to trigger test notification:', err);
    return {
      success: false,
      message: `Errore durante l'invio della notifica: ${String(err)}`,
    };
  }
};

/**
 * Request Screen Wake Lock so phone doesn't sleep during workout
 */
export const setScreenWakeLock = async (enabled: boolean): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return false;
  }

  try {
    if (enabled) {
      const nav = navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } };
      wakeLockSentinel = await nav.wakeLock.request('screen');
      return true;
    } else {
      if (wakeLockSentinel && typeof (wakeLockSentinel as { release: () => Promise<void> }).release === 'function') {
        await (wakeLockSentinel as { release: () => Promise<void> }).release();
        wakeLockSentinel = null;
      }
      return false;
    }
  } catch (err) {
    console.warn('Wake lock error:', err);
    return false;
  }
};
