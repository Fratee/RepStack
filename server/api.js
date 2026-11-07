// REST API router for user accounts & state synchronization
import {
  getUserByUsername,
  createUser,
  getUserState,
  saveUserState,
  addHistoryRecord,
  deleteHistoryRecord,
  clearHistoryRecords,
  getStats,
} from './db.js';
import {
  generateSalt,
  hashPassword,
  verifyPassword,
  issueSession,
  authenticateRequest,
  revokeSession,
} from './auth.js';

// Helper to read JSON request body
export async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Protect against gigantic payloads (10MB max)
      if (body.length > 10 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error(`Invalid JSON body: ${err.message}`));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

// Helper to send JSON responses
export function sendJson(res, statusCode, data, extraHeaders = {}) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...extraHeaders,
  });
  res.end(payload);
}

// Handle CORS preflight
export function handleOptions(req, res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  });
  res.end();
}

/**
 * Main API request handler
 */
export async function handleApiRequest(req, res) {
  if (req.method === 'OPTIONS') {
    handleOptions(req, res);
    return true;
  }

  // Parse path & query
  const parsedUrl = new URL(req.url, 'http://localhost');
  const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';

  // 1. Healthcheck
  if (req.method === 'GET' && pathname === '/api/health') {
    const stats = getStats();
    sendJson(res, 200, {
      status: 'ok',
      service: 'GymTimer Pro Server',
      timestamp: Date.now(),
      stats,
    });
    return true;
  }

  // 2. Auth: Register
  if (req.method === 'POST' && pathname === '/api/auth/register') {
    try {
      const body = await readJsonBody(req);
      const username = String(body.username || '').trim();
      const password = String(body.password || '');
      const displayName = String(body.displayName || username).trim();

      if (!username || username.length < 3) {
        sendJson(res, 400, { success: false, error: 'Il nome utente deve avere almeno 3 caratteri.' });
        return true;
      }
      if (!/^[a-zA-Z0-9_\-\.]+$/.test(username)) {
        sendJson(res, 400, { success: false, error: 'Il nome utente può contenere solo lettere, numeri, trattini e punti.' });
        return true;
      }
      if (!password || password.length < 4) {
        sendJson(res, 400, { success: false, error: 'La password deve avere almeno 4 caratteri.' });
        return true;
      }

      const existing = getUserByUsername(username);
      if (existing) {
        sendJson(res, 409, { success: false, error: 'Nome utente già registrato. Scegline un altro o accedi.' });
        return true;
      }

      const salt = generateSalt();
      const passwordHash = hashPassword(password, salt);
      const user = createUser(username, displayName, passwordHash, salt);

      // Initialize state: save initial workouts, history and settings if passed from guest client
      const initialWorkouts = Array.isArray(body.initialWorkouts) ? body.initialWorkouts : [];
      const initialHistory = Array.isArray(body.initialHistory) ? body.initialHistory : [];
      const initialSettings = body.initialSettings && typeof body.initialSettings === 'object' ? body.initialSettings : {};
      const initialDayId = body.initialDayId || 'day1';

      saveUserState(user.id, {
        workouts: initialWorkouts,
        history: initialHistory,
        settings: initialSettings,
        activeSession: null,
        currentDayId: initialDayId,
      });

      // Also populate history records table
      for (const item of initialHistory) {
        try {
          addHistoryRecord(user.id, item);
        } catch (e) {
          console.warn('Could not backfill history item:', e);
        }
      }

      const { token, expiresAt } = issueSession(user.id);
      const state = getUserState(user.id);

      // Set cookie for browser convenience (expires in 90 days)
      const cookieHeader = `gym_token=${token}; Path=/; Max-Age=${90 * 24 * 3600}; SameSite=Lax`;

      sendJson(
        res,
        201,
        {
          success: true,
          token,
          expiresAt,
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
          },
          state,
        },
        { 'Set-Cookie': cookieHeader }
      );
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      sendJson(res, 500, { success: false, error: 'Errore interno del server durante la registrazione.' });
      return true;
    }
  }

  // 3. Auth: Login
  if (req.method === 'POST' && pathname === '/api/auth/login') {
    try {
      const body = await readJsonBody(req);
      const username = String(body.username || '').trim();
      const password = String(body.password || '');

      if (!username || !password) {
        sendJson(res, 400, { success: false, error: 'Inserisci nome utente e password.' });
        return true;
      }

      const userRow = getUserByUsername(username);
      if (!userRow) {
        sendJson(res, 401, { success: false, error: 'Nome utente o password non validi.' });
        return true;
      }

      const isMatch = verifyPassword(password, userRow.password_salt, userRow.password_hash);
      if (!isMatch) {
        sendJson(res, 401, { success: false, error: 'Nome utente o password non validi.' });
        return true;
      }

      const { token, expiresAt } = issueSession(userRow.id);
      const state = getUserState(userRow.id);

      const cookieHeader = `gym_token=${token}; Path=/; Max-Age=${90 * 24 * 3600}; SameSite=Lax`;

      sendJson(
        res,
        200,
        {
          success: true,
          token,
          expiresAt,
          user: {
            id: userRow.id,
            username: userRow.username,
            displayName: userRow.display_name,
          },
          state,
        },
        { 'Set-Cookie': cookieHeader }
      );
      return true;
    } catch (err) {
      console.error('Login error:', err);
      sendJson(res, 500, { success: false, error: 'Errore durante il login.' });
      return true;
    }
  }

  // 4. Auth: Me
  if (req.method === 'GET' && pathname === '/api/auth/me') {
    const auth = authenticateRequest(req);
    if (!auth) {
      sendJson(res, 401, { success: false, error: 'Non autorizzato o sessione scaduta.' });
      return true;
    }

    sendJson(res, 200, {
      success: true,
      user: auth.user,
    });
    return true;
  }

  // 5. Auth: Logout
  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    const auth = authenticateRequest(req);
    if (auth && auth.token) {
      revokeSession(auth.token);
    }
    const clearCookie = `gym_token=; Path=/; Max-Age=0; SameSite=Lax`;
    sendJson(res, 200, { success: true }, { 'Set-Cookie': clearCookie });
    return true;
  }

  // Protected routes below: require authenticated user
  const auth = authenticateRequest(req);
  if (!auth) {
    sendJson(res, 401, { success: false, error: 'Sessione non valida. Accedi per salvare i dati sul server.' });
    return true;
  }

  // 6. Get State
  if (req.method === 'GET' && pathname === '/api/state') {
    const state = getUserState(auth.user.id);
    sendJson(res, 200, {
      success: true,
      state: state || {
        workouts: [],
        history: [],
        settings: {},
        activeSession: null,
        currentDayId: 'day1',
        updatedAt: Date.now(),
      },
    });
    return true;
  }

  // 7. Sync State (Full state push/save)
  if (req.method === 'POST' && pathname === '/api/state/sync') {
    try {
      const body = await readJsonBody(req);
      const { workouts, history, settings, activeSession, currentDayId } = body;

      const result = saveUserState(auth.user.id, {
        workouts: Array.isArray(workouts) ? workouts : [],
        history: Array.isArray(history) ? history : [],
        settings: settings || {},
        activeSession: activeSession || null,
        currentDayId: currentDayId || 'day1',
      });

      // Synchronize history records table
      if (Array.isArray(history)) {
        for (const item of history) {
          try {
            addHistoryRecord(auth.user.id, item);
          } catch (e) {
            console.warn('Could not sync history item:', e);
          }
        }
      }

      sendJson(res, 200, {
        success: true,
        updatedAt: result.updatedAt,
      });
      return true;
    } catch (err) {
      console.error('State sync error:', err);
      sendJson(res, 500, { success: false, error: 'Errore durante la sincronizzazione dello stato.' });
      return true;
    }
  }

  // 8. Add single history workout item
  if (req.method === 'POST' && pathname === '/api/history/add') {
    try {
      const body = await readJsonBody(req);
      const record = body.workout || body;

      const recordId = addHistoryRecord(auth.user.id, record);

      // Also update user_state history array
      const currentState = getUserState(auth.user.id) || {
        workouts: [],
        history: [],
        settings: {},
        activeSession: null,
        currentDayId: 'day1',
      };

      const updatedHistory = [record, ...(currentState.history || []).filter((h) => h.id !== record.id)];
      saveUserState(auth.user.id, {
        ...currentState,
        history: updatedHistory,
      });

      sendJson(res, 201, {
        success: true,
        id: recordId,
      });
      return true;
    } catch (err) {
      console.error('Add history item error:', err);
      sendJson(res, 500, { success: false, error: 'Errore durante il salvataggio della sessione.' });
      return true;
    }
  }

  // 9. Delete single history item
  if (req.method === 'DELETE' && pathname.startsWith('/api/history/')) {
    const idToDelete = pathname.replace('/api/history/', '').trim();
    if (idToDelete) {
      deleteHistoryRecord(auth.user.id, idToDelete);

      const currentState = getUserState(auth.user.id);
      if (currentState && Array.isArray(currentState.history)) {
        const nextHistory = currentState.history.filter((h) => h.id !== idToDelete);
        saveUserState(auth.user.id, {
          ...currentState,
          history: nextHistory,
        });
      }

      sendJson(res, 200, { success: true, deletedId: idToDelete });
      return true;
    }
  }

  // 10. Clear all history
  if (req.method === 'DELETE' && pathname === '/api/history') {
    clearHistoryRecords(auth.user.id);
    const currentState = getUserState(auth.user.id);
    if (currentState) {
      saveUserState(auth.user.id, {
        ...currentState,
        history: [],
      });
    }
    sendJson(res, 200, { success: true, message: 'Cronologia eliminata' });
    return true;
  }

  // If endpoint starts with /api/ but is unknown
  sendJson(res, 404, { success: false, error: `Endpoint API non trovato: ${pathname}` });
  return true;
}
