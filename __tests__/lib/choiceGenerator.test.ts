import { MuscleData } from '../../src/types/muscle';
import { BodyRegion } from '../../src/constants/bodyRegion';

// Mock MUSCLES data to avoid image require() calls
const MOCK_MUSCLES: MuscleData[] = [
  {
    id: 'pectoralis_major',
    names: { koreanCommon: '큰가슴근', koreanAnatomical: '대흉근', latinEnglish: 'Pectoralis Major' },
    bodyRegion: BodyRegion.Chest,
    muscleGroup: 'chest',
    difficulty: 1,
    imageAsset: 1,
    relatedMuscles: ['pectoralis_minor', 'serratus_anterior'],
    tags: [],
  },
  {
    id: 'pectoralis_minor',
    names: { koreanCommon: '작은가슴근', koreanAnatomical: '소흉근', latinEnglish: 'Pectoralis Minor' },
    bodyRegion: BodyRegion.Chest,
    muscleGroup: 'chest',
    difficulty: 2,
    imageAsset: 2,
    relatedMuscles: ['pectoralis_major'],
    tags: [],
  },
  {
    id: 'serratus_anterior',
    names: { koreanCommon: '앞톱니근', koreanAnatomical: '전거근', latinEnglish: 'Serratus Anterior' },
    bodyRegion: BodyRegion.Chest,
    muscleGroup: 'chest',
    difficulty: 2,
    imageAsset: 3,
    relatedMuscles: ['pectoralis_major'],
    tags: [],
  },
  {
    id: 'biceps_brachii',
    names: { koreanCommon: '위팔두갈래근', koreanAnatomical: '이두근', latinEnglish: 'Biceps Brachii' },
    bodyRegion: BodyRegion.Arm,
    muscleGroup: 'arm',
    difficulty: 1,
    imageAsset: 4,
    relatedMuscles: ['triceps_brachii'],
    tags: [],
  },
  {
    id: 'triceps_brachii',
    names: { koreanCommon: '위팔세갈래근', koreanAnatomical: '삼두근', latinEnglish: 'Triceps Brachii' },
    bodyRegion: BodyRegion.Arm,
    muscleGroup: 'arm',
    difficulty: 1,
    imageAsset: 5,
    relatedMuscles: ['biceps_brachii'],
    tags: [],
  },
  // relatedMuscles가 다른 region에 있는 근육 (2순위 경로 테스트용)
  {
    id: 'deltoid',
    names: { koreanCommon: '어깨세모근', koreanAnatomical: '삼각근', latinEnglish: 'Deltoid' },
    bodyRegion: BodyRegion.Shoulder,
    muscleGroup: 'shoulder',
    difficulty: 1,
    imageAsset: 6,
    relatedMuscles: ['pectoralis_major', 'biceps_brachii'],
    tags: [],
  },
  // 혼자만 있는 region (3순위 전체 랜덤 경로 테스트용)
  {
    id: 'diaphragm',
    names: { koreanCommon: '가로막', koreanAnatomical: '횡격막', latinEnglish: 'Diaphragm' },
    bodyRegion: BodyRegion.Neck,
    muscleGroup: 'neck',
    difficulty: 3,
    imageAsset: 7,
    relatedMuscles: ['nonexistent_muscle'],
    tags: [],
  },
];

jest.mock('../../src/data/muscles', () => ({
  MUSCLES: MOCK_MUSCLES,
}));

// Must import after mock setup
import { generateChoices } from '../../src/lib/choiceGenerator';

describe('generateChoices', () => {
  const chestMuscle = MOCK_MUSCLES[0]; // pectoralis_major (Chest)
  const armMuscle = MOCK_MUSCLES[3]; // biceps_brachii (Arm)
  const shoulderMuscle = MOCK_MUSCLES[5]; // deltoid (Shoulder, relatedMuscles in other regions)
  const loneMuscle = MOCK_MUSCLES[6]; // diaphragm (Neck, alone, nonexistent relatedMuscle)

  it('returns exactly 4 choices', () => {
    const choices = generateChoices(chestMuscle, false);
    expect(choices).toHaveLength(4);
  });

  it('includes the correct answer (Korean)', () => {
    const choices = generateChoices(chestMuscle, false);
    expect(choices).toContain(chestMuscle.names.koreanAnatomical);
  });

  it('includes the correct answer (Latin)', () => {
    const choices = generateChoices(chestMuscle, true);
    expect(choices).toContain(chestMuscle.names.latinEnglish);
  });

  it('has no duplicate choices', () => {
    const choices = generateChoices(chestMuscle, false);
    expect(new Set(choices).size).toBe(choices.length);
  });

  it('prefers same bodyRegion muscles as distractors', () => {
    // chestMuscle has 2 other chest muscles + relatedMuscles overlap
    // Distractors should mostly be from Chest region
    const choices = generateChoices(chestMuscle, false);
    const chestNames = MOCK_MUSCLES
      .filter((m) => m.bodyRegion === BodyRegion.Chest)
      .map((m) => m.names.koreanAnatomical);
    const chestChoices = choices.filter((c) => chestNames.includes(c));
    // All 3 chest muscles should be in choices
    expect(chestChoices.length).toBe(3);
  });

  it('fills from other regions when same region is insufficient', () => {
    // armMuscle has only 1 other arm muscle, needs 2 more from other regions
    const choices = generateChoices(armMuscle, false);
    expect(choices).toHaveLength(4);
    expect(choices).toContain(armMuscle.names.koreanAnatomical);
  });

  it('shuffles choice order (not always same position)', () => {
    const positions = new Set<number>();
    for (let i = 0; i < 30; i++) {
      const choices = generateChoices(chestMuscle, false);
      positions.add(choices.indexOf(chestMuscle.names.koreanAnatomical));
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  it('uses relatedMuscles from other regions as distractors (2순위)', () => {
    // deltoid is alone in Shoulder, but has relatedMuscles in Chest and Arm
    const choices = generateChoices(shoulderMuscle, false);
    expect(choices).toHaveLength(4);
    expect(choices).toContain(shoulderMuscle.names.koreanAnatomical);
    // relatedMuscles (대흉근, 이두근) should appear as distractors
    const relatedNames = ['대흉근', '이두근'];
    const included = relatedNames.filter((n) => choices.includes(n));
    expect(included.length).toBeGreaterThanOrEqual(1);
  });

  it('fills from random pool when same region + relatedMuscles are insufficient (3순위)', () => {
    // diaphragm is alone in Neck, relatedMuscle does not exist in data
    const choices = generateChoices(loneMuscle, false);
    expect(choices).toHaveLength(4);
    expect(choices).toContain(loneMuscle.names.koreanAnatomical);
    // All 3 distractors must come from other regions
    const otherNames = choices.filter((c) => c !== loneMuscle.names.koreanAnatomical);
    expect(otherNames).toHaveLength(3);
  });

  it('handles nonexistent relatedMuscle ids gracefully', () => {
    // diaphragm references 'nonexistent_muscle' which is not in MUSCLES
    expect(() => generateChoices(loneMuscle, false)).not.toThrow();
    const choices = generateChoices(loneMuscle, false);
    expect(choices).toHaveLength(4);
  });
});
