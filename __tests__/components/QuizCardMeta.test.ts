import {
  formatReviewInterval,
  formatAccuracy,
  formatDifficultyStars,
} from '../../src/lib/quizMetaUtils';

const NOW = new Date('2026-03-29T12:00:00Z');

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('formatReviewInterval', () => {
  it('null이면 "첫 학습" 반환', () => {
    expect(formatReviewInterval(null)).toBe('첫 학습');
  });

  it('같은 날이면 "오늘 복습" 반환', () => {
    expect(formatReviewInterval('2026-03-29T08:00:00Z')).toBe('오늘 복습');
  });

  it('1일 전이면 "1일 만의 복습" 반환', () => {
    expect(formatReviewInterval('2026-03-28T12:00:00Z')).toBe('1일 만의 복습');
  });

  it('7일 전이면 "7일 만의 복습" 반환', () => {
    expect(formatReviewInterval('2026-03-22T12:00:00Z')).toBe('7일 만의 복습');
  });

  it('30일 전이면 "30일 만의 복습" 반환', () => {
    expect(formatReviewInterval('2026-02-27T12:00:00Z')).toBe('30일 만의 복습');
  });

  it('23시간 전이면 아직 "오늘 복습"', () => {
    expect(formatReviewInterval('2026-03-28T13:30:00Z')).toBe('오늘 복습');
  });
});

describe('formatAccuracy', () => {
  it('리뷰 0회이면 "-" 반환', () => {
    expect(formatAccuracy(0, 0)).toBe('-');
  });

  it('전부 정답이면 "100%" 반환', () => {
    expect(formatAccuracy(10, 10)).toBe('100%');
  });

  it('3/4 정답이면 "75%" 반환', () => {
    expect(formatAccuracy(3, 4)).toBe('75%');
  });

  it('1/3 정답이면 "33%" 반환 (반올림)', () => {
    expect(formatAccuracy(1, 3)).toBe('33%');
  });

  it('2/3 정답이면 "67%" 반환 (반올림)', () => {
    expect(formatAccuracy(2, 3)).toBe('67%');
  });

  it('0/5 정답이면 "0%" 반환', () => {
    expect(formatAccuracy(0, 5)).toBe('0%');
  });
});

describe('formatDifficultyStars', () => {
  it('난이도 1이면 "★☆☆"', () => {
    expect(formatDifficultyStars(1)).toBe('★☆☆');
  });

  it('난이도 2이면 "★★☆"', () => {
    expect(formatDifficultyStars(2)).toBe('★★☆');
  });

  it('난이도 3이면 "★★★"', () => {
    expect(formatDifficultyStars(3)).toBe('★★★');
  });
});
