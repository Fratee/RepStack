// SQLite database manager using Node.js built-in node:sqlite
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'gym.db');

let dbInstance = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new DatabaseSync(DB_FILE);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_state (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      workouts_json TEXT NOT NULL,
      history_json TEXT NOT NULL,
      settings_json TEXT NOT NULL,
      active_session_json TEXT,
      current_day_id TEXT DEFAULT 'day1',
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS history_records (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day_id TEXT NOT NULL,
      day_title TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      duration_seconds INTEGER NOT NULL,
      total_sets INTEGER NOT NULL,
      completed_sets INTEGER NOT NULL,
      total_volume_kg INTEGER NOT NULL,
      summary_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_history_user_id ON history_records(user_id);
  `);

  dbInstance = db;
  return dbInstance;
}

// User operations
export function getUserByUsername(username) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username.trim()) || null;
}

export function getUserById(id) {
  const db = getDb();
  const stmt = db.prepare('SELECT id, username, display_name, created_at FROM users WHERE id = ?');
  return stmt.get(Number(id)) || null;
}

export function createUser(username, displayName, passwordHash, passwordSalt) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO users (username, display_name, password_hash, password_salt, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const now = Date.now();
  const result = stmt.run(username.trim(), displayName.trim(), passwordHash, passwordSalt, now);
  return {
    id: Number(result.lastInsertRowid),
    username: username.trim(),
    displayName: displayName.trim(),
    createdAt: now,
  };
}

// Session operations
export function createSession(token, userId, expiresAt) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(token, Number(userId), expiresAt, Date.now());
}

export function getSession(token) {
  const db = getDb();
  const now = Date.now();
  const stmt = db.prepare(`
    SELECT s.token, s.expires_at, u.id AS user_id, u.username, u.display_name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > ?
  `);
  return stmt.get(token, now) || null;
}

export function deleteSession(token) {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  stmt.run(token);
}

export function deleteUserSessions(userId) {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM sessions WHERE user_id = ?');
  stmt.run(Number(userId));
}

// User state operations
export function getUserState(userId) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM user_state WHERE user_id = ?');
  const row = stmt.get(Number(userId));
  if (!row) return null;

  try {
    return {
      userId: row.user_id,
      workouts: JSON.parse(row.workouts_json || '[]'),
      history: JSON.parse(row.history_json || '[]'),
      settings: JSON.parse(row.settings_json || '{}'),
      activeSession: row.active_session_json ? JSON.parse(row.active_session_json) : null,
      currentDayId: row.current_day_id || 'day1',
      updatedAt: row.updated_at,
    };
  } catch (err) {
    console.error('Failed to parse user state JSON:', err);
    return null;
  }
}

export function saveUserState(userId, { workouts, history, settings, activeSession, currentDayId }) {
  const db = getDb();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO user_state (user_id, workouts_json, history_json, settings_json, active_session_json, current_day_id, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      workouts_json = excluded.workouts_json,
      history_json = excluded.history_json,
      settings_json = excluded.settings_json,
      active_session_json = excluded.active_session_json,
      current_day_id = excluded.current_day_id,
      updated_at = excluded.updated_at
  `);

  stmt.run(
    Number(userId),
    JSON.stringify(workouts || []),
    JSON.stringify(history || []),
    JSON.stringify(settings || {}),
    activeSession ? JSON.stringify(activeSession) : null,
    currentDayId || 'day1',
    now
  );

  return { success: true, updatedAt: now };
}

// History records operations
export function addHistoryRecord(userId, record) {
  const db = getDb();
  const now = Date.now();
  const recordId = record.id || `hist-${now}-${Math.random().toString(36).substring(2, 8)}`;

  const stmt = db.prepare(`
    INSERT INTO history_records (
      id, user_id, day_id, day_title, start_time, end_time,
      duration_seconds, total_sets, completed_sets, total_volume_kg,
      summary_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      day_id = excluded.day_id,
      day_title = excluded.day_title,
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      duration_seconds = excluded.duration_seconds,
      total_sets = excluded.total_sets,
      completed_sets = excluded.completed_sets,
      total_volume_kg = excluded.total_volume_kg,
      summary_json = excluded.summary_json
  `);

  stmt.run(
    recordId,
    Number(userId),
    record.dayId || '',
    record.dayTitle || '',
    record.startTime || now,
    record.endTime || now,
    record.durationSeconds || 0,
    record.totalSets || 0,
    record.completedSets || 0,
    record.totalVolumeKg || 0,
    JSON.stringify(record.exercisesSummary || []),
    now
  );

  return recordId;
}

export function deleteHistoryRecord(userId, recordId) {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM history_records WHERE user_id = ? AND id = ?');
  stmt.run(Number(userId), recordId);
}

export function clearHistoryRecords(userId) {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM history_records WHERE user_id = ?');
  stmt.run(Number(userId));
}

export function getStats() {
  const db = getDb();
  const usersCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const historyCount = db.prepare('SELECT COUNT(*) AS c FROM history_records').get().c;
  const activeSessions = db.prepare('SELECT COUNT(*) AS c FROM sessions WHERE expires_at > ?').get(Date.now()).c;
  return { usersCount, historyCount, activeSessions };
}
