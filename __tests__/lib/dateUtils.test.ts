import { todayStart, toISOString, isToday, addDays, formatDate, isPastDue } from '../../src/lib/dateUtils';

describe('dateUtils', () => {
  describe('todayStart', () => {
    it('시/분/초/밀리초가 0으로 설정됨', () => {
      const result = todayStart();
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('오늘 날짜를 반환', () => {
      const now = new Date();
      const result = todayStart();
      expect(result.getFullYear()).toBe(now.getFullYear());
      expect(result.getMonth()).toBe(now.getMonth());
      expect(result.getDate()).toBe(now.getDate());
    });
  });

  describe('toISOString', () => {
    it('ISO 8601 형식 문자열 반환', () => {
      const date = new Date('2026-03-29T10:00:00Z');
      expect(toISOString(date)).toBe('2026-03-29T10:00:00.000Z');
    });
  });

  describe('isToday', () => {
    it('오늘 날짜이면 true', () => {
      expect(isToday(new Date().toISOString())).toBe(true);
    });

    it('어제 날짜이면 false', () => {
      const yesterday = addDays(new Date(), -1);
      expect(isToday(yesterday.toISOString())).toBe(false);
    });

    it('내일 날짜이면 false', () => {
      const tomorrow = addDays(new Date(), 1);
      expect(isToday(tomorrow.toISOString())).toBe(false);
    });
  });

  describe('addDays', () => {
    const base = new Date('2026-03-29T10:00:00Z');

    it('양수 일 추가', () => {
      expect(addDays(base, 3).toISOString()).toBe('2026-04-01T10:00:00.000Z');
    });

    it('음수 일(빼기)', () => {
      expect(addDays(base, -2).toISOString()).toBe('2026-03-27T10:00:00.000Z');
    });

    it('소수점 일(0.5 = 12시간)', () => {
      expect(addDays(base, 0.5).toISOString()).toBe('2026-03-29T22:00:00.000Z');
    });
  });

  describe('formatDate', () => {
    it('YYYY-MM-DD 형식', () => {
      expect(formatDate(new Date(2026, 2, 5))).toBe('2026-03-05');
    });

    it('한 자리 월/일에 0 패���', () => {
      expect(formatDate(new Date(2026, 0, 9))).toBe('2026-01-09');
    });
  });

  describe('isPastDue', () => {
    it('과거 시각이면 true', () => {
      expect(isPastDue('2020-01-01T00:00:00Z')).toBe(true);
    });

    it('미래 시각이면 false', () => {
      expect(isPastDue('2099-12-31T23:59:59Z')).toBe(false);
    });

    it('기준 시각과 같으면 true (<=)', () => {
      const now = new Date('2026-03-29T10:00:00Z');
      expect(isPastDue('2026-03-29T10:00:00Z', now)).toBe(true);
    });
  });
});
