import { Database } from '../db/types';
import { MUSCLES } from './muscles';
import { DEFAULT_SETTINGS } from '../types/settings';
import { toISOString } from '../lib/dateUtils';

export async function seedDatabase(db: Database): Promise<void> {
  const count = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM muscles'
  );
  if (count && count.cnt > 0) return;

  // Wrap all inserts in a transaction for dramatically faster first-launch
  await db.execAsync('BEGIN TRANSACTION;');

  try {
    const now = toISOString(new Date());

    for (const muscle of MUSCLES) {
      await db.runAsync(
        `INSERT INTO muscles (id, korean_common, korean_anatomical, latin_english, body_region, muscle_group, difficulty, image_asset, related_muscles, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        muscle.id,
        muscle.names.koreanCommon,
        muscle.names.koreanAnatomical,
        muscle.names.latinEnglish,
        muscle.bodyRegion,
        muscle.muscleGroup,
        muscle.difficulty,
        String(muscle.imageAsset),
        JSON.stringify(muscle.relatedMuscles),
        JSON.stringify(muscle.tags),
      );

      await db.runAsync(
        `INSERT INTO user_progress (muscle_id, mastery_level, streak, ease_factor, interval_days, next_review_at, is_unlocked)
         VALUES (?, 0, 0, 2.5, 0, ?, 0)`,
        muscle.id,
        now,
      );
    }

    const settings = DEFAULT_SETTINGS;
    await db.runAsync(
      "INSERT OR IGNORE INTO user_settings (key, value) VALUES ('latin_mode', ?)",
      settings.latinMode ? '1' : '0',
    );
    await db.runAsync(
      "INSERT OR IGNORE INTO user_settings (key, value) VALUES ('daily_new_limit', ?)",
      String(settings.dailyNewLimit),
    );
    await db.runAsync(
      "INSERT OR IGNORE INTO user_settings (key, value) VALUES ('notification_enabled', ?)",
      settings.notificationEnabled ? '1' : '0',
    );
    await db.runAsync(
      "INSERT OR IGNORE INTO user_settings (key, value) VALUES ('notification_time', ?)",
      settings.notificationTime,
    );

    await db.execAsync('COMMIT;');
  } catch (err) {
    await db.execAsync('ROLLBACK;');
    throw err;
  }
}
