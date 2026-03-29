import { MasteryLevel } from '../constants/masteryLevel';
export { MasteryLevel };

export interface UserProgress {
  muscleId: string;
  masteryLevel: MasteryLevel;
  streak: number;
  easeFactor: number;
  intervalDays: number;
  nextReviewAt: string; // ISO datetime
  lastReviewedAt: string | null;
  totalReviews: number;
  totalCorrect: number;
  isUnlocked: boolean;
  updatedAt: string;
}

export interface SM2Input {
  isCorrect: boolean;
  currentLevel: MasteryLevel;
  currentStreak: number;
  currentInterval: number;
}

export interface SM2Output {
  nextLevel: MasteryLevel;
  nextStreak: number;
  nextInterval: number;
  nextReviewAt: Date;
}
