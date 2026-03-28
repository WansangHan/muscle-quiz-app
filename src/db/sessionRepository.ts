import { getDb } from './client';
import { Difficulty } from '../types/quiz';
import { toISOString } from '../lib/dateUtils';

export async function createSession(difficulty: Difficulty): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO quiz_sessions (started_at, difficulty) VALUES (?, ?)',
    toISOString(new Date()),
    difficulty,
  );
  return result.lastInsertRowId;
}

export async function finishSession(
  sessionId: number,
  totalCards: number,
  correctCount: number,
  wrongCount: number,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE quiz_sessions SET
       finished_at = ?, total_cards = ?, correct_count = ?, wrong_count = ?
     WHERE id = ?`,
    toISOString(new Date()),
    totalCards,
    correctCount,
    wrongCount,
    sessionId,
  );
}

export async function saveAnswer(params: {
  sessionId: number;
  muscleId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  hintUsed: boolean;
  responseTimeMs: number;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO session_answers
       (session_id, muscle_id, user_answer, correct_answer, is_correct, hint_used, response_time_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    params.sessionId,
    params.muscleId,
    params.userAnswer,
    params.correctAnswer,
    params.isCorrect ? 1 : 0,
    params.hintUsed ? 1 : 0,
    params.responseTimeMs,
  );
}
