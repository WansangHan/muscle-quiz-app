import { MemoryDatabase } from '../../src/db/memoryDb';
import { runMigrations } from '../../src/db/migrations';

let db: MemoryDatabase;

jest.mock('../../src/db/client', () => ({
  getDb: jest.fn(),
}));

import { getDb } from '../../src/db/client';
import { incrementDailyStats, getCurrentStreak, getTotalStudyDays } from '../../src/db/streakRepository';

beforeEach(async () => {
  db = new MemoryDatabase();
  await runMigrations(db);
  (getDb as jest.Mock).mockResolvedValue(db);
});

describe('streakRepository', () => {
  describe('incrementDailyStats', () => {
    it('첫 호출 시 행 생성 + reviews_done = 1', async () => {
      await incrementDailyStats(new Date('2026-03-29'), true, false);
      const row = await db.getFirstAsync<any>(
        'SELECT * FROM daily_stats WHERE date = ?', '2026-03-29',
      );
      expect(row.reviews_done).toBe(1);
      expect(row.correct_count).toBe(1);
      expect(row.new_cards_seen).toBe(0);
    });

    it('같은 날 반복 호출 시 누적', async () => {
      const d = new Date('2026-03-29');
      await incrementDailyStats(d, true, true);
      await incrementDailyStats(d, false, false);
      await incrementDailyStats(d, true, false);

      const row = await db.getFirstAsync<any>(
        'SELECT * FROM daily_stats WHERE date = ?', '2026-03-29',
      );
      expect(row.reviews_done).toBe(3);
      expect(row.correct_count).toBe(2);
      expect(row.new_cards_seen).toBe(1);
    });
  });

  describe('getCurrentStreak', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-03-29T12:00:00'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('데이터 없으면 0', async () => {
      expect(await getCurrentStreak()).toBe(0);
    });

    it('오늘만 학습하면 streak = 1', async () => {
      await incrementDailyStats(new Date('2026-03-29'), true, false);
      expect(await getCurrentStreak()).toBe(1);
    });

    it('연속 3일 학습 → streak = 3', async () => {
      await incrementDailyStats(new Date('2026-03-27'), true, false);
      await incrementDailyStats(new Date('2026-03-28'), true, false);
      await incrementDailyStats(new Date('2026-03-29'), true, false);
      expect(await getCurrentStreak()).toBe(3);
    });

    it('어제까지만 학습해도 streak 유지', async () => {
      await incrementDailyStats(new Date('2026-03-27'), true, false);
      await incrementDailyStats(new Date('2026-03-28'), true, false);
      // 오늘(3/29)은 아직 안 함
      expect(await getCurrentStreak()).toBe(2);
    });

    it('중간에 빠진 날이 있으면 끊김', async () => {
      await incrementDailyStats(new Date('2026-03-26'), true, false);
      // 3/27 빠��
      await incrementDailyStats(new Date('2026-03-28'), true, false);
      await incrementDailyStats(new Date('2026-03-29'), true, false);
      expect(await getCurrentStreak()).toBe(2);
    });

    it('이틀 전이 마지막이면 streak = 0', async () => {
      await incrementDailyStats(new Date('2026-03-27'), true, false);
      // 3/28, 3/29 모두 안 함
      expect(await getCurrentStreak()).toBe(0);
    });
  });

  describe('getTotalStudyDays', () => {
    it('데이터 없으면 0', async () => {
      expect(await getTotalStudyDays()).toBe(0);
    });

    it('학습한 날짜 수 반환', async () => {
      await incrementDailyStats(new Date('2026-03-25'), true, false);
      await incrementDailyStats(new Date('2026-03-27'), true, false);
      await incrementDailyStats(new Date('2026-03-29'), true, false);
      expect(await getTotalStudyDays()).toBe(3);
    });
  });
});
