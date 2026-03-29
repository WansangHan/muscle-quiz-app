import { MuscleData } from '../types/muscle';

export function getAnswerName(muscle: MuscleData, latinMode: boolean): string {
  return latinMode ? muscle.names.latinEnglish : muscle.names.koreanAnatomical;
}
