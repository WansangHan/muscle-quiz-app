import { useCallback, useEffect, useState } from 'react';
import { QuizCard, Difficulty } from '../types/quiz';
import { MUSCLES } from '../data/muscles';
import {
  getDueCards,
  getLockedMuscleIds,
  getNewCardsSeenToday,
  unlockCards,
} from '../db/progressRepository';
import { getSettings } from '../db/settingsRepository';
import { extractChoseong, getCharCountHint } from '../lib/hangulUtils';
import { useDatabase } from './useDatabase';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuizCard(muscleId: string, difficulty: Difficulty = 'beginner'): QuizCard | null {
  const muscle = MUSCLES.find((m) => m.id === muscleId);
  if (!muscle) return null;

  let requiredAnswers: string[];
  switch (difficulty) {
    case 'advanced':
      requiredAnswers = [
        muscle.names.koreanCommon,
        muscle.names.koreanAnatomical,
        muscle.names.latinEnglish,
      ];
      break;
    case 'intermediate':
      requiredAnswers = [
        muscle.names.koreanCommon,
        muscle.names.koreanAnatomical,
      ];
      break;
    case 'beginner':
    default:
      requiredAnswers = [muscle.names.koreanCommon];
      break;
  }

  const hintTexts = requiredAnswers.map((answer) => ({
    charCount: getCharCountHint(answer),
    choseong: extractChoseong(answer),
  }));

  return { muscle, requiredAnswers, hintTexts };
}

export function useScheduler() {
  const { isReady } = useDatabase();
  const [dueCount, setDueCount] = useState(0);
  const [newCardsRemaining, setNewCardsRemaining] = useState(0);
  const [totalMastered, setTotalMastered] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isReady) return;
    setLoading(true);
    try {
      const due = await getDueCards();
      const settings = await getSettings();
      const newSeen = await getNewCardsSeenToday();
      const locked = await getLockedMuscleIds();
      const newRemaining = Math.max(0, settings.dailyNewLimit - newSeen);

      setDueCount(due.length);
      setNewCardsRemaining(Math.min(newRemaining, locked.length));
      setTotalMastered(
        due.filter((d) => d.masteryLevel >= 4).length,
      );
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
      const due = await getDueCards(now);
      const settings = await getSettings();
      const newSeen = await getNewCardsSeenToday(now);
      const newAllowance = Math.max(0, settings.dailyNewLimit - newSeen);

      const cards: QuizCard[] = [];

      // 1. Due review cards first (sorted by most overdue)
      for (const progress of due) {
        if (cards.length >= maxCards) break;
        const card = buildQuizCard(progress.muscleId, settings.difficulty);
        if (card) cards.push(card);
      }

      // 2. Unlock new cards up to daily allowance
      if (cards.length < maxCards && newAllowance > 0) {
        const locked = await getLockedMuscleIds();
        const toUnlock = locked.slice(0, Math.min(newAllowance, maxCards - cards.length));
        if (toUnlock.length > 0) {
          await unlockCards(toUnlock);
          for (const muscleId of toUnlock) {
            const card = buildQuizCard(muscleId, settings.difficulty);
            if (card) cards.push(card);
          }
        }
      }

      return shuffle(cards);
    },
    [],
  );

  return { dueCount, newCardsRemaining, totalMastered, loading, refresh, buildQuizDeck };
}
