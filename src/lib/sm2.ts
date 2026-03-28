import { MasteryLevel, SM2Input, SM2Output } from '../types/progress';
import {
  MASTERY_INTERVALS,
  PROMOTION_THRESHOLDS,
  MAX_BONUS_FACTOR,
  BONUS_INCREMENT,
  WRONG_ANSWER_INTERVAL,
} from '../constants/quiz';

export function calculateNextReview(input: SM2Input, now: Date = new Date()): SM2Output {
  const { isCorrect, currentLevel, currentStreak, currentInterval } = input;

  if (!isCorrect) {
    const nextLevel = Math.max(0, currentLevel - 1) as MasteryLevel;
    const nextReviewAt = new Date(now.getTime() + WRONG_ANSWER_INTERVAL * 24 * 60 * 60 * 1000);
    return {
      nextLevel,
      nextStreak: 0,
      nextInterval: WRONG_ANSWER_INTERVAL,
      nextReviewAt,
    };
  }

  const nextStreak = currentStreak + 1;

  // 승급 판정
  let nextLevel = currentLevel;
  if (currentLevel < 4 && nextStreak >= PROMOTION_THRESHOLDS[currentLevel]) {
    nextLevel = (currentLevel + 1) as MasteryLevel;
  }

  // 간격 계산
  const successIndex = Math.min(nextStreak - 1, 2);
  const baseInterval = MASTERY_INTERVALS[nextLevel][successIndex];

  // 보정계수
  const bonusFactor = Math.min(1.0 + nextStreak * BONUS_INCREMENT, MAX_BONUS_FACTOR);
  const nextInterval = Math.round(baseInterval * bonusFactor * 10) / 10;

  const nextReviewAt = new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000);

  return {
    nextLevel,
    nextStreak,
    nextInterval,
    nextReviewAt,
  };
}
