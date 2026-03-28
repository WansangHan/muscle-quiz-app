# fetch-muscle-image

근육 퀴즈앱의 이미지를 검색, 검증, 교체하는 커맨드입니다.

## 사용법

- `/fetch-muscle-image audit` — 전체 45개 이미지 검증 리포트
- `/fetch-muscle-image fix-all` — audit 실행 후 FAIL 이미지 전체 자동 교체
- `/fetch-muscle-image {muscle_id}` — 특정 근육 이미지 검색 및 교체

인자: $ARGUMENTS

## 실행 규칙

### 모드 판별

- `$ARGUMENTS`가 `audit`이면 **Audit 모드**
- `$ARGUMENTS`가 `fix-all`이면 **일괄 교체 모드**
- 그 외에는 muscle_id로 간주하여 **교체 모드** 실행.

---

## Audit 모드

전체 45개 근육 이미지를 시각적으로 검증합니다.

### 절차

1. `src/data/muscles.ts`에서 전체 muscle_id 목록을 읽는다.
2. 각 이미지 파일 `assets/images/muscles/{muscle_id}.png`를 `Read` 도구로 읽는다 (Claude는 멀티모달이므로 이미지를 시각적으로 분석 가능).
3. 각 이미지에 대해 아래 **검증 체크리스트**를 적용한다.
4. 결과를 테이블 형태로 출력한다.

**병렬 처리**: 한 번에 5개씩 `Agent` (subagent)를 사용하여 병렬로 검증할 수 있다. 각 subagent에게 이미지 파일 경로와 검증 체크리스트를 전달한다.

### 검증 체크리스트

각 이미지에 대해 3가지를 확인:

1. **텍스트 라벨 없음 (NO_TEXT)**
   - 이미지 안에 근육 이름, 해부학 라벨, 주석 텍스트가 보이면 **FAIL**
   - 작은 출처 워터마크는 허용
   - 판단 기준: 퀴즈에서 이 이미지를 보고 정답을 텍스트로 읽을 수 있으면 FAIL

2. **근육 식별 가능 (IDENTIFIABLE)**
   - 특정 근육이 색상, 하이라이트, 화살표 등으로 명확히 구분되면 **PASS**
   - 여러 근육이 동시에 표시되어 어떤 근육을 가리키는지 모호하면 **FAIL**
   - 전체 해부도에서 특정 부위가 강조되지 않으면 **FAIL**

3. **이미지 품질 (QUALITY)**
   - 해상도가 너무 낮거나, 심하게 잘렸거나, 알아보기 어려우면 **FAIL**
   - 단색 플레이스홀더이면 **FAIL**

### 출력 형식

```
| # | muscle_id | NO_TEXT | IDENTIFIABLE | QUALITY | 결과 | 비고 |
|---|-----------|--------|--------------|---------|------|------|
| 1 | deltoid | PASS | PASS | PASS | OK | |
| 2 | piriformis | PASS | FAIL | PASS | FAIL | 어떤 근육인지 모호 |
| 3 | diaphragm | FAIL | PASS | PASS | FAIL | 텍스트 라벨 다수 |
```

마지막에 요약: `PASS: N개 / FAIL: M개 — FAIL 목록: [...]`

---

## 일괄 교체 모드 (fix-all)

Audit을 수행한 뒤 FAIL인 이미지를 전부 자동으로 교체합니다.

### 절차

1. **Audit 단계**: 위 Audit 모드와 동일하게 전체 45개 이미지를 검증하여 FAIL 목록을 수집한다.
2. **사용자 확인**: FAIL 목록과 실패 사유를 테이블로 출력하고, "N개 이미지를 자동 교체합니다. 진행할까요?" 라고 확인을 받는다.
3. **병렬 교체**: 사용자가 승인하면, FAIL 이미지들을 3~5개씩 `Agent` (subagent)로 **병렬** 처리한다. 각 Agent에게 아래 정보를 전달:
   - muscle_id, latinEnglish 이름
   - 실패 사유 (텍스트 라벨 / 식별 불가 / 품질 부족)
   - 교체 모드의 Phase B~E 전체 절차

   각 Agent는 독립적으로 다중 소스 검색 → 라이선스 필터 → 다운로드 → 시각 검증 → 교체까지 수행한다.

4. **자동 선택 규칙** (개별 교체 모드와의 차이점):
   - 검증 체크리스트 3개 항목(NO_TEXT, IDENTIFIABLE, QUALITY) 모두 PASS인 첫 번째 후보를 자동 선택한다.
   - 사용자에게 후보를 제시하고 선택을 기다리지 **않는다** (일괄 처리이므로).
   - 단, 적합한 후보가 하나도 없는 경우는 해당 muscle_id를 "교체 실패" 목록에 추가하고 건너뛴다.

5. **결과 리포트**: 모든 교체가 끝나면 최종 결과를 출력한다:
   ```
   ## 일괄 교체 결과

   | # | muscle_id | 상태 | 새 이미지 출처 | 비고 |
   |---|-----------|------|---------------|------|
   | 1 | piriformis | 교체 완료 | File:Piriformis_muscle.png | CC BY-SA 4.0 |
   | 2 | diaphragm | 교체 실패 | - | 적합한 후보 없음 |

   교체 완료: N개 / 교체 실패: M개
   교체 실패 목록은 `/fetch-muscle-image {muscle_id}`로 개별 교체를 시도하세요.
   ```

6. **Attribution 업데이트**: 교체된 이미지는 `_attributions.json`에 자동 반영 (교체 모드 Phase E와 동일).

---

## 교체 모드

특정 muscle_id에 대해 여러 소스에서 적합한 이미지를 검색하고 교체합니다.

### Phase A: 근육 정보 확인

1. `src/data/muscles.ts`에서 해당 muscle_id의 `latinEnglish` 이름을 읽는다.
2. 현재 이미지 `assets/images/muscles/{muscle_id}.png`를 `Read`로 확인하여 현재 상태를 파악한다.

### Phase B: 이미지 검색 (다중 소스)

여러 소스에서 폭넓게 검색한다. **저작권 문제가 없는 이미지라면 출처에 관계없이 사용 가능**.

#### 소스 1: Wikimedia Commons API

`WebFetch`로 호출:
```
https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={latinEnglish}+muscle+anatomy+-Gray&srnamespace=6&srlimit=15&format=json
```

#### 소스 2: 웹 검색 (WebSearch)

`WebSearch`로 다양한 검색어를 시도:
1. `{latinEnglish} muscle anatomy illustration free license`
2. `{latinEnglish} muscle highlighted anatomy diagram`
3. `{latinEnglish} muscle 3D anatomy`

#### 검색어 변형 (결과가 부족하면 순차적으로 추가 시도):
1. `"{latinEnglish} muscle" anatomy highlighted`
2. `"{latinEnglish}" muscular system diagram`
3. `"{latinEnglish}" muscle isolated illustration`

모든 소스의 결과를 합쳐서 다음 단계로 진행한다.

### Phase C: 라이선스 필터링

각 후보에 대해 라이선스를 확인한다.

**Wikimedia Commons 후보**: `WebFetch`로 메타데이터 조회:
```
https://commons.wikimedia.org/w/api.php?action=query&titles={file_title}&prop=imageinfo&iiprop=url|extmetadata|size|mime&iiurlwidth=500&format=json
```

**기타 소스 후보**: 이미지가 게시된 페이지를 `WebFetch`로 방문하여 라이선스 정보를 확인한다.

허용 라이선스:
- `CC BY` (모든 버전)
- `CC BY-SA` (모든 버전)
- `CC0` / `Public Domain`
- 기타 상업적 사용 및 수정이 자유로운 라이선스

필터 조건:
- 위 허용 라이선스 중 하나에 해당
- `mime`이 `image/png`, `image/jpeg`, `image/svg+xml`, `image/webp` 중 하나
- 이미지 너비 >= 300px

통과한 후보만 다음 단계로 진행 (최대 5개).

### Phase D: 후보 다운로드 및 시각 검증

1. `Bash`로 각 후보 썸네일(500px)을 다운로드:
   ```bash
   curl -L -o /tmp/muscle-candidates/{muscle_id}_candidate_{n}.png "{thumburl}"
   ```

2. 각 후보를 `Read`로 읽어 **검증 체크리스트** (위 Audit 모드와 동일) 적용.

3. 후보별 검증 결과를 출력:
   ```
   후보 1: {file_title}
     - NO_TEXT: PASS/FAIL (사유)
     - IDENTIFIABLE: PASS/FAIL (사유)
     - QUALITY: PASS/FAIL (사유)
     - 라이선스: {license} — PASS
     - 결과: ACCEPT / REJECT
   ```

### Phase E: 사용자 확인 및 교체

1. ACCEPT된 후보를 사용자에게 제시하고 선택을 요청한다.
2. 사용자가 선택하면:
   - 원본 해상도 이미지를 다운로드
   - `sips`로 적절한 크기로 리사이즈 (너비 800px 이하):
     ```bash
     sips --resampleWidth 800 /tmp/muscle-candidates/{file} --out assets/images/muscles/{muscle_id}.png
     ```
   - PNG가 아닌 경우 `sips`로 변환:
     ```bash
     sips -s format png {input} --out assets/images/muscles/{muscle_id}.png
     ```
3. `assets/images/muscles/_attributions.json`의 `images` 객체에 해당 근육 정보 추가/업데이트:
   ```json
   "{muscle_id}": {
     "source": "{출처 사이트명 또는 'Wikimedia Commons'}",
     "fileName": "{원본 파일명}",
     "author": "{저작자}",
     "license": "{license}",
     "licenseUrl": "{license url}",
     "sourceUrl": "{이미지 원본 페이지 URL}",
     "verified": true,
     "verifiedDate": "{today's date}",
     "checks": { "noTextLabels": true, "muscleIdentifiable": true, "licenseValid": true }
   }
   ```
4. 교체 완료 메시지를 출력한다.

### 후보가 없는 경우

모든 후보가 REJECT되거나 검색 결과가 없으면:
- "적합한 이미지를 찾지 못했습니다. 다른 검색어를 시도하거나 수동으로 이미지를 찾아주세요." 출력
- 대안 검색어를 제안

---

## 주의사항

- 이미지 교체 시 파일명은 기존과 동일하게 유지 (`{muscle_id}.png`). `src/data/muscles.ts`의 `require()` 경로가 변경되지 않아야 함.
- 사용자 확인 없이 이미지를 덮어쓰지 않는다 (fix-all 모드에서는 최초 1회 확인 후 자동 진행).
- **저작권 문제가 없는 이미지라면 출처에 관계없이 사용 가능**. Wikimedia Commons에 한정하지 않는다.
- Gray's Anatomy 도판은 텍스트 라벨이 많으므로 검색 시 `-Gray` 키워드로 제외를 시도한다.
- SVG, JPEG, WebP 등 PNG가 아닌 포맷은 다운로드 후 `sips`로 PNG 변환하여 사용한다.
