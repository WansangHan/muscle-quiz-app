import { Database } from './types';

type Migration = (db: Database) => Promise<void>;

const migrations: Migration[] = [
  // Version 1: Initial schema
  async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS muscles (
        id TEXT PRIMARY KEY,
        korean_common TEXT NOT NULL,
        korean_anatomical TEXT NOT NULL,
        latin_english TEXT NOT NULL,
        body_region TEXT NOT NULL,
        muscle_group TEXT NOT NULL,
        difficulty INTEGER NOT NULL DEFAULT 1,
        image_asset TEXT NOT NULL,
        related_muscles TEXT,
        tags TEXT
      );

      CREATE TABLE IF NOT EXISTS user_progress (
        muscle_id TEXT PRIMARY KEY REFERENCES muscles(id),
        mastery_level INTEGER NOT NULL DEFAULT 0,
        streak INTEGER NOT NULL DEFAULT 0,
        ease_factor REAL NOT NULL DEFAULT 2.5,
        interval_days REAL NOT NULL DEFAULT 0,
        next_review_at TEXT NOT NULL,
        last_reviewed_at TEXT,
        total_reviews INTEGER NOT NULL DEFAULT 0,
        total_correct INTEGER NOT NULL DEFAULT 0,
        is_unlocked INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS quiz_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        total_cards INTEGER NOT NULL DEFAULT 0,
        correct_count INTEGER NOT NULL DEFAULT 0,
        wrong_count INTEGER NOT NULL DEFAULT 0,
        difficulty TEXT NOT NULL DEFAULT 'beginner'
      );

      CREATE TABLE IF NOT EXISTS session_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER REFERENCES quiz_sessions(id),
        muscle_id TEXT REFERENCES muscles(id),
        user_answer TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        is_correct INTEGER NOT NULL,
        hint_used INTEGER NOT NULL DEFAULT 0,
        response_time_ms INTEGER,
        answered_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS user_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS daily_stats (
        date TEXT PRIMARY KEY,
        reviews_done INTEGER NOT NULL DEFAULT 0,
        correct_count INTEGER NOT NULL DEFAULT 0,
        new_cards_seen INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS _meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  },
  // Version 2: Migrate difficulty setting to latinMode
  async (db) => {
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM user_settings WHERE key = 'difficulty'"
    );
    if (row) {
      const latinMode = (row.value === 'intermediate' || row.value === 'advanced') ? '1' : '0';
      await db.runAsync(
        "INSERT OR REPLACE INTO user_settings (key, value) VALUES ('latin_mode', ?)",
        latinMode
      );
      await db.runAsync(
        "DELETE FROM user_settings WHERE key = 'difficulty'"
      );
    }
  },
];

export async function runMigrations(db: Database): Promise<void> {
  // Ensure _meta table exists
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM _meta WHERE key = 'schema_version'"
  );
  const currentVersion = row ? parseInt(row.value, 10) : 0;

  for (let i = currentVersion; i < migrations.length; i++) {
    await migrations[i](db);
  }

  if (currentVersion === 0) {
    await db.runAsync(
      "INSERT INTO _meta (key, value) VALUES ('schema_version', ?)",
      String(migrations.length)
    );
  } else if (currentVersion < migrations.length) {
    await db.runAsync(
      "UPDATE _meta SET value = ? WHERE key = 'schema_version'",
      String(migrations.length)
    );
  }
}
