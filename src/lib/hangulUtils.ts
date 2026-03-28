const CHOSEONG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

const HANGUL_BASE = 0xAC00;
const HANGUL_END = 0xD7A3;

function isHangulSyllable(code: number): boolean {
  return code >= HANGUL_BASE && code <= HANGUL_END;
}

export function extractChoseong(str: string): string {
  return Array.from(str)
    .map((char) => {
      const code = char.charCodeAt(0);
      if (isHangulSyllable(code)) {
        const index = Math.floor((code - HANGUL_BASE) / 588);
        return CHOSEONG_LIST[index];
      }
      return char;
    })
    .join('');
}

export function getCharCount(str: string): number {
  return str.replace(/\s/g, '').length;
}

export function getCharCountHint(str: string): string {
  return Array.from(str)
    .map((char) => (char === ' ' ? ' ' : '_'))
    .join('');
}
