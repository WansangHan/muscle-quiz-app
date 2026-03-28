import { getDb } from './client';
import { UserSettings, DEFAULT_SETTINGS } from '../types/settings';
import { Difficulty } from '../types/quiz';

export async function getSettings(): Promise<UserSettings> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM user_settings',
  );

  const map = new Map(rows.map((r) => [r.key, r.value]));

  return {
    difficulty: (map.get('difficulty') as Difficulty) ?? DEFAULT_SETTINGS.difficulty,
    dailyNewLimit: parseInt(map.get('daily_new_limit') ?? String(DEFAULT_SETTINGS.dailyNewLimit), 10),
    notificationEnabled: map.get('notification_enabled') === '1',
    notificationTime: map.get('notification_time') ?? DEFAULT_SETTINGS.notificationTime,
  };
}

export async function updateSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)',
    key,
    value,
  );
}
