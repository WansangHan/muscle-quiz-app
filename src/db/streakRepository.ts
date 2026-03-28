import { getDb } from './client';
import { formatDate } from '../lib/dateUtils';

export async function incrementDailyStats(
  date: Date,
  isCorrect: boolean,
  isNewCard: boolean,
): Promise<void> {
  const db = await getDb();
  const dateStr = formatDate(date);

  // Upsert: insert if missing, then update in one step
  await db.runAsync(
    'INSERT OR IGNORE INTO daily_stats (date, reviews_done, correct_count, new_cards_seen) VALUES (?, ?, ?, ?)',
    dateStr, 0, 0, 0,
  );
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Allow streak to start from today OR yesterday (if user hasn't studied today yet)
  let streak = 0;
  let startOffset = 0;

  const todayStr = formatDate(today);
  if (rows[0].date !== todayStr) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (rows[0].date === formatDate(yesterday)) {
      startOffset = 1;
    } else {
      return 0;
    }
  }

  for (let i = 0; i < rows.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i - startOffset);
    if (rows[i].date === formatDate(expectedDate)) {
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
