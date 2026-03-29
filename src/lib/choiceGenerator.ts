import { MUSCLES } from '../data/muscles';
import { MuscleData } from '../types/muscle';
import { shuffle } from './arrayUtils';
import { getAnswerName } from './muscleUtils';

const TOTAL_CHOICES = 4;

/**
 * 정답 1개 + 오답 3개로 구성된 4지선다 선택지를 생성한다.
 * 오답 우선순위: 같은 bodyRegion → relatedMuscles → 전체 랜덤
 */
export function generateChoices(
  correctMuscle: MuscleData,
  latinMode: boolean,
): string[] {
  const correctAnswer = getAnswerName(correctMuscle, latinMode);
  const distractorPool: MuscleData[] = [];
  const used = new Set<string>([correctMuscle.id]);

  // 1순위: 같은 bodyRegion
  const sameRegion = MUSCLES.filter(
    (m) => m.bodyRegion === correctMuscle.bodyRegion && m.id !== correctMuscle.id,
  );
  for (const m of shuffle(sameRegion)) {
    if (!used.has(m.id)) {
      distractorPool.push(m);
      used.add(m.id);
    }
  }

  // 2순위: relatedMuscles
  for (const relId of correctMuscle.relatedMuscles) {
    if (!used.has(relId)) {
      const m = MUSCLES.find((mu) => mu.id === relId);
      if (m) {
        distractorPool.push(m);
        used.add(m.id);
      }
    }
  }

  // 3순위: 나머지 전체에서 랜덤
  if (distractorPool.length < TOTAL_CHOICES - 1) {
    const remaining = MUSCLES.filter((m) => !used.has(m.id));
    for (const m of shuffle(remaining)) {
      distractorPool.push(m);
      used.add(m.id);
      if (distractorPool.length >= TOTAL_CHOICES - 1) break;
    }
  }

  const distractors = distractorPool
    .slice(0, TOTAL_CHOICES - 1)
    .map((m) => getAnswerName(m, latinMode));

  return shuffle([correctAnswer, ...distractors]);
}
