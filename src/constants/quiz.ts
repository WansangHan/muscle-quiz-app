// SM-2 간격 테이블 (일 단위)
// INTERVALS[level][successIndex] where successIndex = min(streak, 2)
export const MASTERY_INTERVALS: number[][] = [
  [0, 0, 0],        // Level 0: 즉시
  [0.5, 1, 3],      // Level 1: 12h, 1d, 3d
  [3, 7, 14],       // Level 2: 3d, 7d, 14d
  [7, 14, 30],      // Level 3: 7d, 14d, 30d
  [30, 60, 120],    // Level 4: 30d, 60d, 120d
];

// streak >= PROMOTION_THRESHOLDS[level] 이면 레벨업
export const PROMOTION_THRESHOLDS = [3, 5, 7, 9];

export const MAX_BONUS_FACTOR = 2.0;
export const BONUS_INCREMENT = 0.1;

export const WRONG_ANSWER_INTERVAL = 0.5; // 12시간 (일 단위)
export const WRONG_ANSWER_DISPLAY_MS = 3000;
export const CORRECT_ANSWER_DISPLAY_MS = 1200;

export const DEFAULT_DAILY_NEW_LIMIT = 10;
export const DEFAULT_QUIZ_BATCH_SIZE = 20;
