import { MuscleData } from './muscle';
import { MasteryLevel } from './progress';

export { QuizState } from '../constants/quizState';

export interface QuizCardMeta {
  masteryLevel: MasteryLevel;
  lastReviewedAt: string | null;
  totalReviews: number;
  totalCorrect: number;
}

export interface QuizCard {
  muscle: MuscleData;
  requiredAnswers: string[]; // answers the user must type
  hintTexts: {
    charCount: string;
    choseong: string;
  }[];
  meta?: QuizCardMeta;
}

export interface AnswerResult {
  muscleId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  isClose: boolean;
  hintUsed: boolean;
  responseTimeMs: number;
  previousLevel: MasteryLevel;
  newLevel: MasteryLevel;
  newStreak: number;
  promotionThreshold: number;
  didLevelUp: boolean;
}

export interface MasteryChange {
  muscleName: string;
  oldLevel: MasteryLevel;
  newLevel: MasteryLevel;
}

export interface QuizSessionSummary {
  totalCards: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  duration: number;
  levelUps: number;
  masteryChanges: MasteryChange[];
}
