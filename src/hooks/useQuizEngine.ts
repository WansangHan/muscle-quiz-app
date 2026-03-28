import { useCallback, useEffect, useRef, useState } from 'react';
import { QuizCard, QuizState, AnswerResult, QuizSessionSummary } from '../types/quiz';
import { checkAnswer } from '../lib/answerChecker';
import { calculateNextReview } from '../lib/sm2';
import { toISOString } from '../lib/dateUtils';
import { getProgress, upsertProgress } from '../db/progressRepository';
import { createSession, finishSession, saveAnswer } from '../db/sessionRepository';
import { incrementDailyStats } from '../db/streakRepository';
import { WRONG_ANSWER_DISPLAY_MS } from '../constants/quiz';

interface QuizEngineState {
  state: QuizState;
  currentIndex: number;
  cards: QuizCard[];
  results: AnswerResult[];
  currentHintLevel: number;
  currentAnswerIndex: number;
  isClose: boolean;
}

export function useQuizEngine(initialCards: QuizCard[]) {
  const [engine, setEngine] = useState<QuizEngineState>({
    state: initialCards.length > 0 ? 'showing_card' : 'complete',
    currentIndex: 0,
    cards: initialCards,
    results: [],
    currentHintLevel: 0,
    currentAnswerIndex: 0,
    isClose: false,
  });

  const cardStartTime = useRef<number>(Date.now());
  const sessionIdRef = useRef<number | null>(null);
  const cardCorrectAll = useRef<boolean>(true);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Init session in effect, not during render
  useEffect(() => {
    if (sessionIdRef.current === null && initialCards.length > 0) {
      createSession('beginner').then((id) => {
        sessionIdRef.current = id;
      });
    }
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, [initialCards]);

  const currentCard = engine.cards[engine.currentIndex] ?? null;
  const currentRequiredAnswer = currentCard?.requiredAnswers[engine.currentAnswerIndex] ?? null;
  const totalAnswersForCard = currentCard?.requiredAnswers.length ?? 1;

  const advanceToNext = useCallback(() => {
    cardCorrectAll.current = true;
    cardStartTime.current = Date.now();
    setEngine((prev) => {
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.cards.length) {
        if (sessionIdRef.current) {
          const correct = prev.results.filter((r) => r.isCorrect).length;
          const wrong = prev.results.length - correct;
          finishSession(sessionIdRef.current, prev.cards.length, correct, wrong);
        }
        return { ...prev, state: 'complete' as QuizState, currentIndex: nextIndex };
      }
      return {
        ...prev,
        state: 'showing_card' as QuizState,
        currentIndex: nextIndex,
        currentAnswerIndex: 0,
        currentHintLevel: 0,
        isClose: false,
      };
    });
  }, []);

  const submitAnswer = useCallback(
    async (userInput: string) => {
      if (engine.state !== 'showing_card' || !currentCard || !currentRequiredAnswer) return;

      setEngine((prev) => ({ ...prev, state: 'checking' }));

      const result = checkAnswer(userInput, [currentRequiredAnswer]);
      const responseTimeMs = Date.now() - cardStartTime.current;

      if (result.isClose) {
        setEngine((prev) => ({ ...prev, state: 'showing_card', isClose: true }));
        return;
      }

      if (sessionIdRef.current) {
        await saveAnswer({
          sessionId: sessionIdRef.current,
          muscleId: currentCard.muscle.id,
          userAnswer: userInput,
          correctAnswer: currentRequiredAnswer,
          isCorrect: result.isCorrect,
          hintUsed: engine.currentHintLevel > 0,
          responseTimeMs,
        });
      }

      if (!result.isCorrect) {
        cardCorrectAll.current = false;
      }

      const isLastAnswer = engine.currentAnswerIndex >= totalAnswersForCard - 1;

      if (!isLastAnswer && result.isCorrect) {
        setEngine((prev) => ({
          ...prev,
          state: 'showing_card',
          currentAnswerIndex: prev.currentAnswerIndex + 1,
          currentHintLevel: 0,
          isClose: false,
        }));
        cardStartTime.current = Date.now();
        return;
      }

      const isCardCorrect = result.isCorrect && cardCorrectAll.current;

      const progress = await getProgress(currentCard.muscle.id);
      const sm2Result = calculateNextReview({
        isCorrect: isCardCorrect,
        currentLevel: progress?.masteryLevel ?? 0,
        currentStreak: progress?.streak ?? 0,
        currentInterval: progress?.intervalDays ?? 0,
      });

      // Parallelize independent DB writes
      await Promise.all([
        upsertProgress({
          muscleId: currentCard.muscle.id,
          masteryLevel: sm2Result.nextLevel,
          streak: sm2Result.nextStreak,
          intervalDays: sm2Result.nextInterval,
          nextReviewAt: toISOString(sm2Result.nextReviewAt),
          isCorrect: isCardCorrect,
        }),
        incrementDailyStats(new Date(), isCardCorrect, progress?.totalReviews === 0),
      ]);

      const answerResult: AnswerResult = {
        muscleId: currentCard.muscle.id,
        userAnswer: userInput,
        correctAnswer: currentRequiredAnswer,
        isCorrect: isCardCorrect,
        isClose: false,
        hintUsed: engine.currentHintLevel > 0,
        responseTimeMs,
      };

      setEngine((prev) => ({
        ...prev,
        state: isCardCorrect ? 'correct_feedback' : 'wrong_feedback',
        results: [...prev.results, answerResult],
        isClose: false,
      }));

      if (!isCardCorrect) {
        feedbackTimerRef.current = setTimeout(() => {
          advanceToNext();
        }, WRONG_ANSWER_DISPLAY_MS);
      }
    },
    [engine.state, engine.currentHintLevel, engine.currentAnswerIndex, currentCard, currentRequiredAnswer, totalAnswersForCard, advanceToNext],
  );

  const nextCard = useCallback(() => {
    if (engine.state === 'correct_feedback') {
      advanceToNext();
    }
  }, [engine.state, advanceToNext]);

  const useHint = useCallback(() => {
    setEngine((prev) => ({
      ...prev,
      currentHintLevel: Math.min(prev.currentHintLevel + 1, 2),
    }));
  }, []);

  const getSummary = useCallback((): QuizSessionSummary => {
    const correctCount = engine.results.filter((r) => r.isCorrect).length;
    return {
      totalCards: engine.results.length,
      correctCount,
      wrongCount: engine.results.length - correctCount,
      accuracy: engine.results.length > 0 ? correctCount / engine.results.length : 0,
      duration: 0,
    };
  }, [engine.results]);

  return {
    state: engine.state,
    currentIndex: engine.currentIndex,
    currentCard,
    currentAnswerIndex: engine.currentAnswerIndex,
    totalAnswersForCard,
    totalCards: engine.cards.length,
    results: engine.results,
    hintLevel: engine.currentHintLevel,
    isClose: engine.isClose,
    submitAnswer,
    nextCard,
    useHint,
    getSummary,
  };
}
