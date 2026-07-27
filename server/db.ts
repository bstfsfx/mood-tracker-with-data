import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../shared/schema";
import path from "node:path";
import fs from "node:fs";

const dataDir = process.env.DATA_DIR || ".";
const dbPath = path.join(dataDir, "data.db");
if (dataDir !== "." && !fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// Auto-create tables on startup
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS mood_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    mood_score INTEGER NOT NULL,
    energy_score INTEGER NOT NULL,
    anxiety_score INTEGER NOT NULL,
    sleep_score INTEGER NOT NULL,
    anxiety_markers TEXT NOT NULL DEFAULT '[]',
    notes TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT 'sage',
    icon TEXT NOT NULL DEFAULT 'check-circle',
    target_per_week INTEGER NOT NULL DEFAULT 7,
    active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS habit_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ai_routine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    check_in_time TEXT NOT NULL DEFAULT '09:00',
    style TEXT NOT NULL DEFAULT 'supportive',
    custom_prompt TEXT NOT NULL DEFAULT '',
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS safety_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mood_threshold INTEGER NOT NULL DEFAULT 2,
    sustained_days INTEGER NOT NULL DEFAULT 7,
    anxiety_threshold INTEGER NOT NULL DEFAULT 4,
    anxiety_marker_days INTEGER NOT NULL DEFAULT 3,
    crisis_contact_name TEXT NOT NULL DEFAULT '',
    crisis_contact_phone TEXT NOT NULL DEFAULT '',
    enabled INTEGER NOT NULL DEFAULT 1,
    last_alert_date TEXT
  );
`);
