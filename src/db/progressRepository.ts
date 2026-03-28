import { getDb } from './client';
import { UserProgress, MasteryLevel } from '../types/progress';
import { toISOString, formatDate } from '../lib/dateUtils';

interface ProgressRow {
  muscle_id: string;
  mastery_level: number;
  streak: number;
  ease_factor: number;
  interval_days: number;
  next_review_at: string;
  last_reviewed_at: string | null;
  total_reviews: number;
  total_correct: number;
  is_unlocked: number;
  updated_at: string;
}

function rowToProgress(row: ProgressRow): UserProgress {
  return {
    muscleId: row.muscle_id,
    masteryLevel: row.mastery_level as MasteryLevel,
    streak: row.streak,
    easeFactor: row.ease_factor,
    intervalDays: row.interval_days,
    nextReviewAt: row.next_review_at,
    lastReviewedAt: row.last_reviewed_at,
    totalReviews: row.total_reviews,
    totalCorrect: row.total_correct,
    isUnlocked: row.is_unlocked === 1,
    updatedAt: row.updated_at,
  };
}

export async function getAllProgress(): Promise<UserProgress[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ProgressRow>('SELECT * FROM user_progress');
  return rows.map(rowToProgress);
}

export async function getProgress(muscleId: string): Promise<UserProgress | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ProgressRow>(
    'SELECT * FROM user_progress WHERE muscle_id = ?',
    muscleId,
  );
  return row ? rowToProgress(row) : null;
}

export async function getDueCards(now: Date = new Date()): Promise<UserProgress[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ProgressRow>(
    `SELECT * FROM user_progress
     WHERE is_unlocked = 1 AND next_review_at <= ?
     ORDER BY next_review_at ASC`,
    toISOString(now),
  );
  return rows.map(rowToProgress);
}

export async function getNewCardsSeenToday(today: Date = new Date()): Promise<number> {
  const db = await getDb();
  const dateStr = formatDate(today);
  const startOfDay = `${dateStr}T00:00:00`;
  const endOfDay = `${dateStr}T23:59:59`;
  const row = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM user_progress
     WHERE is_unlocked = ? AND updated_at >= ? AND updated_at <= ? AND total_reviews = ?`,
    1,
    startOfDay,
    endOfDay,
    1,
  );
  return row?.cnt ?? 0;
}

export async function getUnlockedCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM user_progress WHERE is_unlocked = ?',
    1,
  );
  return row?.cnt ?? 0;
}

export async function getLockedMuscleIds(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ muscle_id: string }>(
    'SELECT muscle_id FROM user_progress WHERE is_unlocked = ? ORDER BY muscle_id',
    0,
  );
  return rows.map((r) => r.muscle_id);
}

export async function unlockCards(muscleIds: string[]): Promise<void> {
  if (muscleIds.length === 0) return;
  const db = await getDb();
  const now = toISOString(new Date());
  for (const id of muscleIds) {
    await db.runAsync(
      `UPDATE user_progress SET is_unlocked = 1, next_review_at = ?, updated_at = ?
       WHERE muscle_id = ?`,
      now,
      now,
      id,
    );
  }
}

export async function upsertProgress(progress: {
  muscleId: string;
  masteryLevel: MasteryLevel;
  streak: number;
  intervalDays: number;
  nextReviewAt: string;
  isCorrect: boolean;
}): Promise<void> {
  const db = await getDb();
  const now = toISOString(new Date());
  await db.runAsync(
    `UPDATE user_progress SET
       mastery_level = ?,
       streak = ?,
       interval_days = ?,
       next_review_at = ?,
       last_reviewed_at = ?,
       total_reviews = total_reviews + 1,
       total_correct = total_correct + ?,
       updated_at = ?
     WHERE muscle_id = ?`,
    progress.masteryLevel,
    progress.streak,
    progress.intervalDays,
    progress.nextReviewAt,
    now,
    progress.isCorrect ? 1 : 0,
    now,
    progress.muscleId,
  );
}
