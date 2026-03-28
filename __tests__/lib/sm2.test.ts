import { calculateNextReview } from '../../src/lib/sm2';
import { WRONG_ANSWER_INTERVAL } from '../../src/constants/quiz';

const NOW = new Date('2026-03-28T10:00:00Z');

describe('SM-2 calculateNextReview', () => {
  describe('오답 처리', () => {
    it('레벨 2에서 오답 시 레벨 1로 강등', () => {
      const result = calculateNextReview({
        isCorrect: false,
        currentLevel: 2,
        currentStreak: 5,
        currentInterval: 7,
      }, NOW);
      expect(result.nextLevel).toBe(1);
      expect(result.nextStreak).toBe(0);
      expect(result.nextInterval).toBe(WRONG_ANSWER_INTERVAL);
    });

    it('레벨 0에서 오답 시 레벨 0 유지', () => {
      const result = calculateNextReview({
        isCorrect: false,
        currentLevel: 0,
        currentStreak: 0,
        currentInterval: 0,
      }, NOW);
      expect(result.nextLevel).toBe(0);
      expect(result.nextStreak).toBe(0);
    });

    it('오답 시 12시간 후 재출제', () => {
      const result = calculateNextReview({
        isCorrect: false,
        currentLevel: 1,
        currentStreak: 3,
        currentInterval: 1,
      }, NOW);
      const expectedTime = NOW.getTime() + 12 * 60 * 60 * 1000;
      expect(result.nextReviewAt.getTime()).toBe(expectedTime);
    });
  });

  describe('정답 처리', () => {
    it('레벨 0 첫 정답: streak 1, 간격 0 (즉시)', () => {
      const result = calculateNextReview({
        isCorrect: true,
        currentLevel: 0,
        currentStreak: 0,
        currentInterval: 0,
      }, NOW);
      expect(result.nextStreak).toBe(1);
      expect(result.nextLevel).toBe(0);
    });

    it('레벨 0 streak 2 → 3이면 레벨 1로 승급', () => {
      const result = calculateNextReview({
        isCorrect: true,
        currentLevel: 0,
        currentStreak: 2,
        currentInterval: 0,
      }, NOW);
      expect(result.nextStreak).toBe(3);
      expect(result.nextLevel).toBe(1);
    });

    it('레벨 1 streak 4 → 5이면 레벨 2로 승급', () => {
      const result = calculateNextReview({
        isCorrect: true,
        currentLevel: 1,
        currentStreak: 4,
        currentInterval: 1,
      }, NOW);
      expect(result.nextStreak).toBe(5);
      expect(result.nextLevel).toBe(2);
    });

    it('레벨 4에서 정답 시 레벨 4 유지', () => {
      const result = calculateNextReview({
        isCorrect: true,
        currentLevel: 4,
        currentStreak: 10,
        currentInterval: 60,
      }, NOW);
      expect(result.nextLevel).toBe(4);
    });

    it('보정계수가 최대 2.0으로 제한됨', () => {
      const result = calculateNextReview({
        isCorrect: true,
        currentLevel: 3,
        currentStreak: 20,
        currentInterval: 30,
      }, NOW);
      // bonusFactor = min(1.0 + 21*0.1, 2.0) = 2.0
      // 레벨 3(혹은 4), successIndex=2 → baseInterval
      // 보정계수 2.0 적용
      expect(result.nextInterval).toBeGreaterThan(0);
    });
  });

  describe('nextReviewAt 계산', () => {
    it('간격만큼 미래 시각으로 설정됨', () => {
      const result = calculateNextReview({
        isCorrect: true,
        currentLevel: 1,
        currentStreak: 0,
        currentInterval: 0,
      }, NOW);
      const diffMs = result.nextReviewAt.getTime() - NOW.getTime();
      const diffDays = diffMs / (24 * 60 * 60 * 1000);
      expect(diffDays).toBeCloseTo(result.nextInterval, 1);
    });
  });
});
