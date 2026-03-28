import { getDb } from './client';
import { formatDate } from '../lib/dateUtils';

export async function recordDailyActivity(date: Date = new Date()): Promise<void> {
  const db = await getDb();
  const dateStr = formatDate(date);
  const existing = await db.getFirstAsync<{ date: string }>(
    'SELECT date FROM daily_stats WHERE date = ?',
    dateStr,
  );
  if (!existing) {
    await db.runAsync(
      'INSERT INTO daily_stats (date, reviews_done, correct_count, new_cards_seen) VALUES (?, ?, ?, ?)',
      dateStr, 0, 0, 0,
    );
  }
}

export async function incrementDailyStats(
  date: Date,
  isCorrect: boolean,
  isNewCard: boolean,
): Promise<void> {
  const db = await getDb();
  const dateStr = formatDate(date);
  await recordDailyActivity(date);
  await db.runAsync(
    `UPDATE daily_stats SET
       reviews_done = reviews_done + 1,
       correct_count = correct_count + ?,
       new_cards_seen = new_cards_seen + ?
     WHERE date = ?`,
    isCorrect ? 1 : 0,
    isNewCard ? 1 : 0,
    dateStr,
  );
}

export async function getCurrentStreak(): Promise<number> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ date: string }>(
    'SELECT date FROM daily_stats WHERE reviews_done > ? ORDER BY date DESC',
    0,
  );

  if (rows.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < rows.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    const expectedStr = formatDate(expectedDate);

    if (rows[i].date === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function getTotalStudyDays(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM daily_stats WHERE reviews_done > ?',
    0,
  );
  return row?.cnt ?? 0;
}
