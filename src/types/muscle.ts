import { BodyRegion } from '../constants/bodyRegion';
export { BodyRegion };

export interface MuscleNames {
  koreanCommon: string;
  koreanAnatomical: string;
  latinEnglish: string;
}

export interface MuscleData {
  id: string;
  names: MuscleNames;
  bodyRegion: BodyRegion;
  muscleGroup: string;
  difficulty: 1 | 2 | 3;
  imageAsset: number; // require() returns number in RN
  relatedMuscles: string[];
  tags: string[];
}
