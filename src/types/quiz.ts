import { MuscleData } from './muscle';

export type QuizState =
  | 'idle'
  | 'showing_card'
  | 'checking'
  | 'correct_feedback'
  | 'wrong_feedback'
  | 'complete';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface QuizCard {
  muscle: MuscleData;
  requiredAnswers: string[]; // answers the user must type
  hintTexts: {
    charCount: string;
    choseong: string;
  }[];
}

export interface AnswerResult {
  muscleId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  isClose: boolean;
  hintUsed: boolean;
  responseTimeMs: number;
}

export interface QuizSessionSummary {
  totalCards: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  duration: number;
}
