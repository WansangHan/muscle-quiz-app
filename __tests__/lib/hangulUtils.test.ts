import { extractChoseong, getCharCount, getCharCountHint } from '../../src/lib/hangulUtils';

describe('hangulUtils', () => {
  describe('extractChoseong', () => {
    it('한글 단어의 초성을 추출한다', () => {
      expect(extractChoseong('대흉근')).toBe('ㄷㅎㄱ');
      expect(extractChoseong('승모근')).toBe('ㅅㅁㄱ');
      expect(extractChoseong('삼각근')).toBe('ㅅㄱㄱ');
    });

    it('Phase 1 근육 초성 추출', () => {
      expect(extractChoseong('큰가슴근')).toBe('ㅋㄱㅅㄱ');
      expect(extractChoseong('등세모근')).toBe('ㄷㅅㅁㄱ');
      expect(extractChoseong('넓은등근')).toBe('ㄴㅇㄷㄱ');
      expect(extractChoseong('어깨세모근')).toBe('ㅇㄲㅅㅁㄱ');
      expect(extractChoseong('위팔두갈래근')).toBe('ㅇㅍㄷㄱㄹㄱ');
    });

    it('비한글 문자는 그대로 유지', () => {
      expect(extractChoseong('ABC')).toBe('ABC');
      expect(extractChoseong('123')).toBe('123');
    });

    it('빈 문자열 처리', () => {
      expect(extractChoseong('')).toBe('');
    });
  });

  describe('getCharCount', () => {
    it('공백 제외 글자 수 반환', () => {
      expect(getCharCount('대흉근')).toBe(3);
      expect(getCharCount('큰 가슴근')).toBe(4);
    });
  });

  describe('getCharCountHint', () => {
    it('글자 위치를 언더스코어로 표시', () => {
      expect(getCharCountHint('대흉근')).toBe('___');
      expect(getCharCountHint('큰 가슴근')).toBe('_ ___');
    });
  });
});
