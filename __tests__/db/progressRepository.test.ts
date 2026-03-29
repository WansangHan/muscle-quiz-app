import { MemoryDatabase } from '../../src/db/memoryDb';
import { runMigrations } from '../../src/db/migrations';

let db: MemoryDatabase;

jest.mock('../../src/db/client', () => ({
  getDb: jest.fn(),
}));

import { getDb } from '../../src/db/client';
import {
  getAllProgress,
  getProgress,
  getDueCards,
  getNewCardsSeenToday,
  getReviewedTodayCount,
  getUnlockedCount,
  getLockedMuscleIds,
  unlockCards,
  upsertProgress,
  getMasteryDistribution,
  getNearPromotionCount,
} from '../../src/db/progressRepository';

async function insertMuscle(id: string) {
  await db.runAsync(
    `INSERT INTO muscles (id, korean_common, korean_anatomical, latin_english, body_region, muscle_group, difficulty, image_asset)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id, '테스트', '테스트', 'Test', 'chest', 'group', 1, 'img',
  );
  await db.runAsync(
    `INSERT INTO user_progress (muscle_id, mastery_level, streak, ease_factor, interval_days, next_review_at, is_unlocked)
     VALUES (?, 0, 0, 2.5, 0, ?, 0)`,
    id, '2026-03-29T00:00:00.000Z',
  );
}

beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-03-29T10:00:00.000Z'));
  db = new MemoryDatabase();
  await runMigrations(db);
  (getDb as jest.Mock).mockResolvedValue(db);
  await insertMuscle('m1');
  await insertMuscle('m2');
});

afterEach(() => {
  jest.useRealTimers();
});

describe('progressRepository', () => {
  describe('getAllProgress / getProgress', () => {
    it('전체 progress 반환', async () => {
      const all = await getAllProgress();
      expect(all).toHaveLength(2);
    });

    it('특정 muscle progress 반환', async () => {
      const p = await getProgress('m1');
      expect(p).not.toBeNull();
      expect(p!.muscleId).toBe('m1');
      expect(p!.masteryLevel).toBe(0);
    });

    it('존재하지 않는 muscle은 null', async () => {
      expect(await getProgress('nonexistent')).toBeNull();
    });
  });

  describe('unlockCards / getLockedMuscleIds / getUnlockedCount', () => {
    it('초기 상태: 모두 잠김', async () => {
      const locked = await getLockedMuscleIds();
      expect(locked).toHaveLength(2);
      expect(await getUnlockedCount()).toBe(0);
    });

    it('unlock 후 상태 변경', async () => {
      await unlockCards(['m1']);
      expect(await getUnlockedCount()).toBe(1);
      const locked = await getLockedMuscleIds();
      expect(locked).toEqual(['m2']);
    });
  });

  describe('getDueCards', () => {
    it('잠긴 카드는 due에 포함되지 않음', async () => {
      const due = await getDueCards(new Date('2026-03-30T00:00:00Z'));
      expect(due).toHaveLength(0);
    });

    it('unlock + 과거 next_review_at → due에 포함', async () => {
      await unlockCards(['m1']);
      const due = await getDueCards(new Date('2026-03-30T00:00:00Z'));
      expect(due).toHaveLength(1);
      expect(due[0].muscleId).toBe('m1');
    });

    it('미래 next_review_at → due에 미포함', async () => {
      await unlockCards(['m1']);
      const due = await getDueCards(new Date('2026-03-28T00:00:00Z'));
      expect(due).toHaveLength(0);
    });
  });

  describe('upsertProgress', () => {
    it('progress 업데이트 반영', async () => {
      await upsertProgress({
        muscleId: 'm1',
        masteryLevel: 1,
        streak: 3,
        intervalDays: 1,
        nextReviewAt: '2026-04-01T00:00:00.000Z',
        isCorrect: true,
      });
      const p = await getProgress('m1');
      expect(p!.masteryLevel).toBe(1);
      expect(p!.streak).toBe(3);
      expect(p!.totalReviews).toBe(1);
      expect(p!.totalCorrect).toBe(1);
      expect(p!.lastReviewedAt).not.toBeNull();
    });

    it('오답 시 totalCorrect 미증가', async () => {
      await upsertProgress({
        muscleId: 'm1',
        masteryLevel: 0,
        streak: 0,
        intervalDays: 0.5,
        nextReviewAt: '2026-03-29T12:00:00.000Z',
        isCorrect: false,
      });
      const p = await getProgress('m1');
      expect(p!.totalReviews).toBe(1);
      expect(p!.totalCorrect).toBe(0);
    });

    it('연속 정답 시 totalReviews/totalCorrect 누적', async () => {
      for (let i = 0; i < 3; i++) {
        await upsertProgress({
          muscleId: 'm1',
          masteryLevel: 0,
          streak: i + 1,
          intervalDays: 0,
          nextReviewAt: '2026-03-29T00:00:00.000Z',
          isCorrect: true,
        });
      }
      const p = await getProgress('m1');
      expect(p!.totalReviews).toBe(3);
      expect(p!.totalCorrect).toBe(3);
    });
  });

  describe('getReviewedTodayCount', () => {
    it('리뷰한 카드 수를 정확히 반환', async () => {
      expect(await getReviewedTodayCount()).toBe(0);

      await upsertProgress({
        muscleId: 'm1',
        masteryLevel: 0,
        streak: 1,
        intervalDays: 0,
        nextReviewAt: '2026-03-29T12:00:00.000Z',
        isCorrect: true,
      });
      expect(await getReviewedTodayCount()).toBe(1);
    });
  });

  describe('getMasteryDistribution', () => {
    it('잠긴 카드는 분포에 포함되지 않음', async () => {
      const dist = await getMasteryDistribution();
      expect(dist).toEqual({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 });
    });

    it('레벨별 카운트 정확히 반환', async () => {
      await unlockCards(['m1', 'm2']);
      await upsertProgress({
        muscleId: 'm1',
        masteryLevel: 2,
        streak: 5,
        intervalDays: 3,
        nextReviewAt: '2026-04-01T00:00:00.000Z',
        isCorrect: true,
      });
      const dist = await getMasteryDistribution();
      expect(dist[0]).toBe(1); // m2 is level 0
      expect(dist[2]).toBe(1); // m1 is level 2
      expect(dist[1]).toBe(0);
      expect(dist[3]).toBe(0);
      expect(dist[4]).toBe(0);
    });
  });

  describe('getNearPromotionCount', () => {
    it('잠긴 카드는 포함되지 않음', async () => {
      expect(await getNearPromotionCount()).toBe(0);
    });

    it('레벨업 직전 카드(streak >= threshold - 1) 카운트', async () => {
      await unlockCards(['m1', 'm2']);
      // m1: level 0, streak 2 → threshold 3, 2 >= 3-1 → near promotion
      await upsertProgress({
        muscleId: 'm1',
        masteryLevel: 0,
        streak: 2,
        intervalDays: 0,
        nextReviewAt: '2026-03-29T12:00:00.000Z',
        isCorrect: true,
      });
      // m2: level 0, streak 0 → not near promotion
      expect(await getNearPromotionCount()).toBe(1);
    });

    it('완전숙달(level 4)은 제외', async () => {
      await unlockCards(['m1']);
      await upsertProgress({
        muscleId: 'm1',
        masteryLevel: 4,
        streak: 10,
        intervalDays: 30,
        nextReviewAt: '2026-05-01T00:00:00.000Z',
        isCorrect: true,
      });
      expect(await getNearPromotionCount()).toBe(0);
    });
  });

  describe('getNewCardsSeenToday', () => {
    it('오늘 처음 unlock+리뷰한 카드 수', async () => {
      await unlockCards(['m1']);

      // unlock만으로는 newCardsSeen이 아님 (total_reviews = 0)
      expect(await getNewCardsSeenToday()).toBe(0);

      // 1번 리뷰 → total_reviews = 1 & updated_at = today
      await upsertProgress({
        muscleId: 'm1',
        masteryLevel: 0,
        streak: 1,
        intervalDays: 0,
        nextReviewAt: '2026-03-29T12:00:00.000Z',
        isCorrect: true,
      });
      expect(await getNewCardsSeenToday()).toBe(1);
    });
  });
});
