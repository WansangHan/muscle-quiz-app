import { MemoryDatabase } from '../../src/db/memoryDb';
import { runMigrations } from '../../src/db/migrations';

let db: MemoryDatabase;

jest.mock('../../src/db/client', () => ({
  getDb: jest.fn(),
}));

import { getDb } from '../../src/db/client';
import { createSession, finishSession, saveAnswer } from '../../src/db/sessionRepository';

beforeEach(async () => {
  db = new MemoryDatabase();
  await runMigrations(db);
  (getDb as jest.Mock).mockResolvedValue(db);
});

describe('sessionRepository', () => {
  describe('createSession', () => {
    it('세션 ID를 반환', async () => {
      const id = await createSession('standard');
      expect(id).toBeGreaterThan(0);
    });

    it('연속 생성 시 ID 증가', async () => {
      const id1 = await createSession('standard');
      const id2 = await createSession('latin');
      expect(id2).toBeGreaterThan(id1);
    });
  });

  describe('finishSession', () => {
    it('멀티라인 UPDATE로 세션 완료 정보 저장', async () => {
      const id = await createSession('standard');
      await finishSession(id, 10, 8, 2);

      const row = await db.getFirstAsync<any>(
        'SELECT * FROM quiz_sessions WHERE id = ?', id,
      );
      expect(row.total_cards).toBe(10);
      expect(row.correct_count).toBe(8);
      expect(row.wrong_count).toBe(2);
      expect(row.finished_at).toBeTruthy();
    });
  });

  describe('saveAnswer', () => {
    it('답안 저장', async () => {
      const sessionId = await createSession('standard');
      await saveAnswer({
        sessionId,
        muscleId: 'biceps',
        userAnswer: '이두근',
        correctAnswer: '이두근',
        isCorrect: true,
        hintUsed: false,
        responseTimeMs: 1500,
      });

      const rows = await db.getAllAsync<any>(
        'SELECT * FROM session_answers WHERE session_id = ?', sessionId,
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].is_correct).toBe(1);
      expect(rows[0].hint_used).toBe(0);
      expect(rows[0].response_time_ms).toBe(1500);
    });

    it('여러 답안 저장', async () => {
      const sessionId = await createSession('standard');
      await saveAnswer({
        sessionId, muscleId: 'a', userAnswer: 'x', correctAnswer: 'y',
        isCorrect: false, hintUsed: true, responseTimeMs: 3000,
      });
      await saveAnswer({
        sessionId, muscleId: 'b', userAnswer: 'z', correctAnswer: 'z',
        isCorrect: true, hintUsed: false, responseTimeMs: 800,
      });

      const count = await db.getFirstAsync<any>(
        'SELECT COUNT(*) as cnt FROM session_answers WHERE session_id = ?', sessionId,
      );
      expect(count.cnt).toBe(2);
    });
  });
});
