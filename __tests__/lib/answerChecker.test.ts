import { checkAnswer } from '../../src/lib/answerChecker';

describe('answerChecker', () => {
  const answers = ['대흉근', 'Pectoralis Major'];

  describe('정확한 정답', () => {
    it('한글 정답 일치', () => {
      const result = checkAnswer('대흉근', answers);
      expect(result.isCorrect).toBe(true);
    });

    it('영문 정답 대소문자 무시', () => {
      const result = checkAnswer('pectoralis major', answers);
      expect(result.isCorrect).toBe(true);
    });

    it('공백 무시', () => {
      const result = checkAnswer('pectoralismajor', answers);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('유사 답 (Levenshtein 1)', () => {
    it('한글 1글자 오타는 isClose', () => {
      const result = checkAnswer('대흉근', ['대흉근']);
      expect(result.isCorrect).toBe(true);

      const close = checkAnswer('대흉금', ['대흉근']);
      expect(close.isClose).toBe(true);
      expect(close.isCorrect).toBe(false);
    });

    it('영문 1글자 오타는 isClose', () => {
      const result = checkAnswer('Pectoralis Mejor', answers);
      expect(result.isClose).toBe(true);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('오답', () => {
    it('전혀 다른 답', () => {
      const result = checkAnswer('광배근', answers);
      expect(result.isCorrect).toBe(false);
      expect(result.isClose).toBe(false);
    });

    it('빈 입력', () => {
      const result = checkAnswer('', answers);
      expect(result.isCorrect).toBe(false);
      expect(result.isClose).toBe(false);
    });

    it('공백만 입력', () => {
      const result = checkAnswer('   ', answers);
      expect(result.isCorrect).toBe(false);
      expect(result.isClose).toBe(false);
    });
  });
});
