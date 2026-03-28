# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npx expo start              # Start dev server (interactive platform selection)
npx expo start --web        # Web only (uses MemoryDB, port 8081)
npx expo start --ios        # iOS simulator
npx expo start --android    # Android emulator

# Testing
npm test                    # Jest unit tests (sm2, answerChecker, hangulUtils)
npm run test:e2e            # Playwright E2E tests (starts web server automatically)
npx jest __tests__/lib/sm2.test.ts  # Run single test file

# Type checking
node ./node_modules/typescript/bin/tsc --noEmit
```

## Architecture

React Native (Expo) muscle name quiz app with SM-2 spaced repetition. Korean-first UI.

### Data Flow
`App.tsx` → `DatabaseProvider` (init DB + migrations + seed) → `NavigationContainer` → `RootNavigator` (4 bottom tabs)

### Navigation Structure
- **HomeTab** (Stack): HomeScreen → QuizScreen
- **BrowseTab** (Stack): BodyRegionScreen → MuscleListScreen → MuscleDetailScreen
- **Statistics**: StatisticsScreen
- **Settings**: SettingsScreen

### Database Layer (`src/db/`)
- **Native (iOS/Android)**: `expo-sqlite` with WAL mode, file `muscle-quiz.db`
- **Web**: `MemoryDatabase` fallback (in-memory, regex-based SQL parser, non-persistent)
- Both implement `Database` interface in `src/db/types.ts`
- Platform detection in `src/db/client.ts` via `Platform.OS === 'web'`
- Repository pattern: one file per table (`muscleRepository`, `progressRepository`, `sessionRepository`, `settingsRepository`, `streakRepository`)
- Versioned migrations in `src/db/migrations.ts` with `_meta` table tracking schema version

### Quiz Engine (`src/hooks/useQuizEngine.ts`)
State machine: `showing_card` → `checking` → `correct_feedback`/`wrong_feedback` → `complete`. Supports multi-answer cards (intermediate/advanced difficulty asks for multiple names sequentially per muscle). Wrong answers auto-advance after 3 seconds.

### SM-2 Algorithm (`src/lib/sm2.ts`)
Pure function `calculateNextReview()`. 5 mastery levels (0-4) with promotion thresholds at streak 3/5/7/9. Bonus factor `min(1.0 + streak*0.1, 2.0)` applied to interval. Wrong answer = demote 1 level, reset streak, reschedule 12h. Interval tables in `src/constants/quiz.ts`.

### Scheduler (`src/hooks/useScheduler.ts`)
Builds quiz decks: due review cards first (sorted by overdue-ness), then unlocks new cards up to daily limit. Generates hints (character count + Korean initial consonants/초성) per answer.

### Korean Language Utils (`src/lib/`)
- `hangulUtils.ts`: Choseong extraction using Unicode math `(code - 0xAC00) / 588`
- `answerChecker.ts`: NFC normalization + whitespace removal + Levenshtein distance ≤ 1 for typo tolerance

### Image Mapping (`src/data/muscles.ts`)
45 muscles with static `require()` calls (Metro bundler requirement). Image map `Record<string, number>` at top of file, each muscle references `images.muscle_id`. To replace an image, overwrite the PNG at `assets/images/muscles/{muscle_id}.png`.

## Key Constraints

- All `require()` for images must be static string literals (Metro bundler resolves at compile time)
- `MemoryDatabase` uses loose equality (`==`) for comparisons since SQL literal values may be stored as different types than query parameters
- Repository queries must use `?` parameter placeholders (not inline literals) to work with both SQLite and MemoryDB
- Muscle data is defined in `src/data/muscles.ts` and seeded into SQLite via `src/data/seed.ts` on first launch
- Image sources: 저작권 문제 없는 이미지 (CC BY, CC BY-SA, CC0, Public Domain 등). 출처 제한 없음. Attribution in `assets/images/muscles/_attributions.json`

## Custom Commands

### `/fetch-muscle-image`

근육 이미지 검색/검증/교체 커맨드. Claude의 멀티모달 비전으로 이미지 품질을 자동 검증.

```bash
/fetch-muscle-image audit           # 전체 45개 이미지 검증 리포트
/fetch-muscle-image piriformis      # 특정 근육 이미지 검색 및 교체
```

검증 기준:
1. **NO_TEXT**: 이미지에 정답 텍스트/라벨이 없어야 함
2. **IDENTIFIABLE**: 특정 근육이 명확히 구분되어야 함
3. **QUALITY**: 해상도/품질이 적절해야 함

교체 시 저작권 문제 없는 이미지면 출처 무관 (CC BY/CC BY-SA/CC0/Public Domain). `_attributions.json`에 이미지별 출처/라이선스/검증 기록 자동 저장.
