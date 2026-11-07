// Client HTTP API helper with token management & offline resilience
import type { AuthUser, ServerState, CompletedWorkout, WorkoutDay, AppSettings } from '../types';

const TOKEN_KEY = 'gym_auth_token_v1';
const USER_KEY = 'gym_auth_user_v1';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser | null) {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // ignore
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<{
  data?: T;
  error?: string;
  isOffline?: boolean;
  status: number;
}> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(path, {
      ...options,
      headers,
    });

    let json: Record<string, unknown> = {};
    try {
      json = await res.json();
    } catch {
      // not JSON
    }

    if (!res.ok) {
      return {
        status: res.status,
        error: (json.error as string) || `Errore del server (${res.status})`,
      };
    }

    return {
      status: res.status,
      data: json as T,
    };
  } catch (err) {
    const isOffline = !navigator.onLine || (err instanceof TypeError && err.message.includes('fetch'));
    return {
      status: 0,
      isOffline,
      error: isOffline
        ? 'Impossibile connettersi al server. Verifica la connessione Wi-Fi o lo stato del server.'
        : String(err),
    };
  }
}

export const api = {
  // Check health
  async checkHealth() {
    return request<{ status: string; timestamp: number }>('/api/health');
  },

  // Register
  async register(params: {
    username: string;
    password: string;
    displayName?: string;
    initialWorkouts?: WorkoutDay[];
    initialHistory?: CompletedWorkout[];
    initialSettings?: Partial<AppSettings>;
    initialDayId?: string;
  }) {
    const res = await request<{
      success: boolean;
      token: string;
      user: AuthUser;
      state: ServerState;
      error?: string;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (res.data?.token) {
      setStoredToken(res.data.token);
      setStoredUser(res.data.user);
    }

    return res;
  },

  // Login
  async login(username: string, password: string) {
    const res = await request<{
      success: boolean;
      token: string;
      user: AuthUser;
      state: ServerState;
      error?: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (res.data?.token) {
      setStoredToken(res.data.token);
      setStoredUser(res.data.user);
    }

    return res;
  },

  // Get current user
  async getMe() {
    return request<{ success: boolean; user: AuthUser }>('/api/auth/me');
  },

  // Logout
  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken(null);
      setStoredUser(null);
    }
  },

  // Get full state from server
  async getState() {
    return request<{ success: boolean; state: ServerState }>('/api/state');
  },

  // Push full state to server
  async syncState(payload: {
    workouts: WorkoutDay[];
    history: CompletedWorkout[];
    settings: AppSettings;
    activeSession: { isActive: boolean; startTime: number | null; dayId?: string } | null;
    currentDayId: string;
  }) {
    return request<{ success: boolean; updatedAt: number }>('/api/state/sync', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Add completed workout session
  async addHistoryItem(workout: CompletedWorkout) {
    return request<{ success: boolean; id: string }>('/api/history/add', {
      method: 'POST',
      body: JSON.stringify({ workout }),
    });
  },

  // Delete history item
  async deleteHistoryItem(id: string) {
    return request<{ success: boolean; deletedId: string }>(`/api/history/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Clear history
  async clearHistory() {
    return request<{ success: boolean }>('/api/history', {
      method: 'DELETE',
    });
  },
};
