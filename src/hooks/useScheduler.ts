import { useCallback, useEffect, useState } from 'react';
import { QuizCard } from '../types/quiz';
import { MUSCLES } from '../data/muscles';
import {
  getDueCards,
  getLockedMuscleIds,
  getNewCardsSeenToday,
  getProgress,
  getReviewedTodayCount,
  unlockCards,
} from '../db/progressRepository';
import { getSettings } from '../db/settingsRepository';
import { extractChoseong, getCharCountHint, getInitialLettersHint } from '../lib/hangulUtils';
import { useDatabase } from './useDatabase';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function buildQuizCard(muscleId: string, latinMode: boolean = false): Promise<QuizCard | null> {
  const muscle = MUSCLES.find((m) => m.id === muscleId);
  if (!muscle) return null;

  const requiredAnswers = latinMode
    ? [muscle.names.latinEnglish]
    : [muscle.names.koreanAnatomical];

  const hintTexts = requiredAnswers.map((answer) => ({
    charCount: getCharCountHint(answer),
    choseong: latinMode ? getInitialLettersHint(answer) : extractChoseong(answer),
  }));

  const progress = await getProgress(muscleId);
  const meta = progress
    ? {
        masteryLevel: progress.masteryLevel,
        lastReviewedAt: progress.lastReviewedAt,
        totalReviews: progress.totalReviews,
        totalCorrect: progress.totalCorrect,
      }
    : undefined;

  return { muscle, requiredAnswers, hintTexts, meta };
}

export function useScheduler() {
  const { isReady } = useDatabase();
  const [dueCount, setDueCount] = useState(0);
  const [newCardsRemaining, setNewCardsRemaining] = useState(0);
  const [studiedToday, setStudiedToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isReady) return;
    setLoading(true);
    try {
      const [due, settings, newSeen, locked, reviewed] = await Promise.all([
        getDueCards(), getSettings(), getNewCardsSeenToday(), getLockedMuscleIds(), getReviewedTodayCount(),
      ]);
      const newRemaining = Math.max(0, settings.dailyNewLimit - newSeen);

      setDueCount(due.length);
      setNewCardsRemaining(Math.min(newRemaining, locked.length));
      setStudiedToday(reviewed);
    } catch (err) {
      console.error('Scheduler refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, [isReady]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const buildQuizDeck = useCallback(
    async (maxCards: number = 20): Promise<QuizCard[]> => {
      const now = new Date();
      const [due, settings, newSeen] = await Promise.all([
        getDueCards(now), getSettings(), getNewCardsSeenToday(now),
      ]);
      const newAllowance = Math.max(0, settings.dailyNewLimit - newSeen);

      const cards: QuizCard[] = [];

      // 1. Due review cards first (sorted by most overdue)
      for (const progress of due) {
        if (cards.length >= maxCards) break;
        const card = await buildQuizCard(progress.muscleId, settings.latinMode);
        if (card) cards.push(card);
      }

      // 2. Unlock new cards up to daily allowance
      if (cards.length < maxCards && newAllowance > 0) {
        const locked = await getLockedMuscleIds();
        const toUnlock = locked.slice(0, Math.min(newAllowance, maxCards - cards.length));
        if (toUnlock.length > 0) {
          await unlockCards(toUnlock);
          for (const muscleId of toUnlock) {
            const card = await buildQuizCard(muscleId, settings.latinMode);
            if (card) cards.push(card);
          }
        }
      }

      return shuffle(cards);
    },
    [],
  );

  const buildCardsForMuscleIds = useCallback(
    async (muscleIds: string[]): Promise<QuizCard[]> => {
      const settings = await getSettings();
      const cards: QuizCard[] = [];
      for (const id of muscleIds) {
        const card = await buildQuizCard(id, settings.latinMode);
        if (card) cards.push(card);
      }
      return shuffle(cards);
    },
    [],
  );

  return { dueCount, newCardsRemaining, studiedToday, loading, refresh, buildQuizDeck, buildCardsForMuscleIds };
}
