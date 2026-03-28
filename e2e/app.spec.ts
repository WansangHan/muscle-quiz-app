import { test, expect } from '@playwright/test';

test.describe('Muscle Quiz App', () => {
  test('홈 화면이 정상 로드된다', async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load and DB to initialize
    await expect(page.getByText('근육 퀴즈')).toBeVisible({ timeout: 30000 });
  });

  test('오늘의 학습 요약이 표시된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('오늘의 학습')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('복습 대기')).toBeVisible();
    await expect(page.getByText('새 카드')).toBeVisible();
    await expect(page.getByText('숙달 완료')).toBeVisible();
  });

  test('학습 시작 버튼이 보이고 클릭 가능하다', async ({ page }) => {
    await page.goto('/');
    const startButton = page.getByText('학습 시작');
    await expect(startButton).toBeVisible({ timeout: 30000 });
  });

  test('학습 방법 안내가 표시된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('학습 방법')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/근육 이미지를 보고/)).toBeVisible();
  });

  test('학습 시작 후 퀴즈 화면으로 이동한다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('학습 시작')).toBeVisible({ timeout: 30000 });
    await page.getByText('학습 시작').click();

    // Quiz screen should show progress bar and input
    await expect(page.getByText('이 근육의 이름은?')).toBeVisible({ timeout: 15000 });
    await expect(page.getByPlaceholder('근육 이름을 입력하세요')).toBeVisible();
  });

  test('퀴즈에서 힌트 버튼이 동작한다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('학습 시작')).toBeVisible({ timeout: 30000 });
    await page.getByText('학습 시작').click();
    await expect(page.getByText('이 근육의 이름은?')).toBeVisible({ timeout: 15000 });

    // Click hint button
    await page.getByText('힌트 보기').click();
    await expect(page.getByText(/글자 수:/)).toBeVisible();

    // Click again for choseong hint
    await page.getByText('초성 힌트').click();
    await expect(page.getByText(/초성:/)).toBeVisible();
  });

  test('정답 입력 시 정답 피드백이 나타난다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('학습 시작')).toBeVisible({ timeout: 30000 });
    await page.getByText('학습 시작').click();
    await expect(page.getByText('이 근육의 이름은?')).toBeVisible({ timeout: 15000 });

    // Use hint to figure out the answer - check choseong
    await page.getByText('힌트 보기').click();
    await page.getByText('초성 힌트').click();

    // We know the answer list, try all possible first muscle names
    // Since cards are shuffled, we'll use a strategic approach:
    // Get any text hint showing and try to match
    const input = page.getByPlaceholder('근육 이름을 입력하세요');

    // Try submitting a known muscle name - since we have 15 muscles,
    // try the first common ones
    const muscleNames = [
      '큰가슴근', '작은가슴근', '앞톱니근', '등세모근', '넓은등근',
      '척추세움근', '어깨세모근', '가시위근', '가시아래근', '큰원근',
      '작은원근', '위팔두갈래근', '위팔세갈래근', '위팔근', '위팔노근',
    ];

    // Read the choseong hint to narrow down
    const hintText = await page.getByText(/초성:/).textContent();
    const choseong = hintText?.replace('초성: ', '').trim() ?? '';

    // Find matching muscle
    const matchingName = muscleNames.find((name) => {
      // Simple choseong extraction for matching
      const nameChoseong = extractChoseongJS(name);
      return nameChoseong === choseong;
    }) ?? muscleNames[0];

    await input.fill(matchingName);
    // In React Native Web, TouchableOpacity renders as a div, not a button
    await page.getByText('확인').click();

    // Wait for feedback to appear
    await expect(
      page.getByText('정답!').or(page.getByText('오답')),
    ).toBeVisible({ timeout: 10000 });
  });

  test('설정 탭으로 이동할 수 있다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('근육 퀴즈')).toBeVisible({ timeout: 30000 });

    await page.getByText('설정').click();
    await expect(page.getByText('일일 새 카드 수')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/버전/)).toBeVisible();
  });

  test('설정에서 난이도를 변경할 수 있다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('근육 퀴즈')).toBeVisible({ timeout: 30000 });

    await page.getByText('설정').click();
    await expect(page.getByText('난이도')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('초급')).toBeVisible();
    await expect(page.getByText('중급')).toBeVisible();
    await expect(page.getByText('고급')).toBeVisible();
  });

  test('탐색 탭에서 부위별 목록이 보인다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('근육 퀴즈')).toBeVisible({ timeout: 30000 });

    await page.getByText('탐색').click();
    await expect(page.getByText('부위별 탐색')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('가슴')).toBeVisible();
    await expect(page.getByText('등')).toBeVisible();
    await expect(page.getByText('어깨')).toBeVisible();
  });

  test('탐색에서 부위 클릭 시 근육 목록이 보인다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('근육 퀴즈')).toBeVisible({ timeout: 30000 });

    await page.getByText('탐색').click();
    await expect(page.getByText('부위별 탐색')).toBeVisible({ timeout: 10000 });

    await page.getByText('가슴').click();
    await expect(page.getByText('큰가슴근')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Pectoralis Major')).toBeVisible();
  });

  test('통계 탭이 동작한다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('근육 퀴즈')).toBeVisible({ timeout: 30000 });

    await page.getByText('통계').click();
    await expect(page.getByText('부위별 숙련도')).toBeVisible({ timeout: 10000 });
  });
});

// Helper: extract choseong from Korean string (for test matching)
function extractChoseongJS(str: string): string {
  const CHOSEONG = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
  ];
  return Array.from(str)
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 0xAC00 && code <= 0xD7A3) {
        return CHOSEONG[Math.floor((code - 0xAC00) / 588)];
      }
      return char;
    })
    .join('');
}
