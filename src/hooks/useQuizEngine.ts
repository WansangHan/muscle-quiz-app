import { useCallback, useRef, useState } from 'react';
import { QuizCard, QuizState, AnswerResult, QuizSessionSummary } from '../types/quiz';
import { checkAnswer } from '../lib/answerChecker';
import { calculateNextReview } from '../lib/sm2';
import { toISOString } from '../lib/dateUtils';
import { getProgress } from '../db/progressRepository';
import { upsertProgress } from '../db/progressRepository';
import { createSession, finishSession, saveAnswer } from '../db/sessionRepository';
import { WRONG_ANSWER_DISPLAY_MS } from '../constants/quiz';

interface QuizEngineState {
  state: QuizState;
  currentIndex: number;
  cards: QuizCard[];
  results: AnswerResult[];
  currentHintLevel: number; // 0=none, 1=charCount, 2=choseong
  isClose: boolean;
  sessionId: number | null;
}

export function useQuizEngine(initialCards: QuizCard[]) {
  const [engine, setEngine] = useState<QuizEngineState>({
    state: initialCards.length > 0 ? 'showing_card' : 'complete',
    currentIndex: 0,
    cards: initialCards,
    results: [],
    currentHintLevel: 0,
    isClose: false,
    sessionId: null,
  });

  const cardStartTime = useRef<number>(Date.now());
  const sessionIdRef = useRef<number | null>(null);

  const initSession = useCallback(async () => {
    if (sessionIdRef.current !== null) return;
    const id = await createSession('beginner');
    sessionIdRef.current = id;
    setEngine((prev) => ({ ...prev, sessionId: id }));
  }, []);

  // Start session on first render
  if (sessionIdRef.current === null && initialCards.length > 0) {
    initSession();
  }

  const currentCard = engine.cards[engine.currentIndex] ?? null;

  const submitAnswer = useCallback(
    async (userInput: string) => {
      if (engine.state !== 'showing_card' || !currentCard) return;

      setEngine((prev) => ({ ...prev, state: 'checking' }));

      const result = checkAnswer(userInput, currentCard.requiredAnswers);
      const responseTimeMs = Date.now() - cardStartTime.current;

      if (result.isClose) {
        setEngine((prev) => ({ ...prev, state: 'showing_card', isClose: true }));
        return;
      }

      const progress = await getProgress(currentCard.muscle.id);
      const sm2Result = calculateNextReview({
        isCorrect: result.isCorrect,
        currentLevel: progress?.masteryLevel ?? 0,
        currentStreak: progress?.streak ?? 0,
        currentInterval: progress?.intervalDays ?? 0,
      });

      await upsertProgress({
        muscleId: currentCard.muscle.id,
        masteryLevel: sm2Result.nextLevel,
        streak: sm2Result.nextStreak,
        intervalDays: sm2Result.nextInterval,
        nextReviewAt: toISOString(sm2Result.nextReviewAt),
        isCorrect: result.isCorrect,
      });

      if (sessionIdRef.current) {
        await saveAnswer({
          sessionId: sessionIdRef.current,
          muscleId: currentCard.muscle.id,
          userAnswer: userInput,
          correctAnswer: currentCard.requiredAnswers[0],
          isCorrect: result.isCorrect,
          hintUsed: engine.currentHintLevel > 0,
          responseTimeMs,
        });
      }

      const answerResult: AnswerResult = {
        muscleId: currentCard.muscle.id,
        userAnswer: userInput,
        correctAnswer: currentCard.requiredAnswers[0],
        isCorrect: result.isCorrect,
        isClose: false,
        hintUsed: engine.currentHintLevel > 0,
        responseTimeMs,
      };

      setEngine((prev) => ({
        ...prev,
        state: result.isCorrect ? 'correct_feedback' : 'wrong_feedback',
        results: [...prev.results, answerResult],
        isClose: false,
      }));

      if (!result.isCorrect) {
        setTimeout(() => {
          advanceToNext();
        }, WRONG_ANSWER_DISPLAY_MS);
      }
    },
    [engine.state, engine.currentHintLevel, currentCard],
  );

  const advanceToNext = useCallback(() => {
    setEngine((prev) => {
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.cards.length) {
        // Finish session
        if (sessionIdRef.current) {
          const correct = prev.results.filter((r) => r.isCorrect).length;
          const wrong = prev.results.filter((r) => !r.isCorrect).length;
          finishSession(sessionIdRef.current, prev.cards.length, correct, wrong);
        }
        return { ...prev, state: 'complete', currentIndex: nextIndex };
      }
      cardStartTime.current = Date.now();
      return {
        ...prev,
        state: 'showing_card',
        currentIndex: nextIndex,
        currentHintLevel: 0,
        isClose: false,
      };
    });
  }, []);

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
    const wrongCount = engine.results.filter((r) => !r.isCorrect).length;
    return {
      totalCards: engine.results.length,
      correctCount,
      wrongCount,
      accuracy: engine.results.length > 0 ? correctCount / engine.results.length : 0,
      duration: 0,
    };
  }, [engine.results]);

  return {
    state: engine.state,
    currentIndex: engine.currentIndex,
    currentCard,
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
