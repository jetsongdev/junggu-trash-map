---
index: 29
slug: light-mode-polish
date: 2026-05-05
phase: "I.5"
git_sha: f07f526 (clean)
viewport: 390x844
---

# 29 — 라이트 모드 일관 전환

I.5 라운드. 그동안 다크 first 하드코딩이 누적되어 있던 chrome 표면들을 양 테마 모두에서 일관 콘트라스트로 정비. Tailwind v4 `@custom-variant dark (.dark *)` 도입으로 클래스 기반 dark 분기.

## 캡처

### `light.png` — 라이트 모드 default
- 헤더·필터 섹션·칩(비활성/활성 12종)·통계바·breakdown·데이터 출처 핀 모두 light-coherent
- 비활성 칩: `bg-neutral-100 text-neutral-700 ring-neutral-200` (이전: 다크 하드코딩 → 라이트 타일 위에서 부유)
- "전체" 활성 칩: `bg-neutral-900 text-white` (라이트 섹션 대비 강조)
- 마커·violet 윤곽: 라이트 타일 위 그대로 가독

### `dark.png` — 다크 모드 default
- 라이트 토글 후 → 다크. 모든 표면이 `dark:` variant로 분기되어 동일 토포에서 다크 chrome 적용
- "전체" 활성 칩: `dark:bg-white dark:text-neutral-900` (다크 섹션 대비 강조)
- 비활성 칩: `dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700` (기존 동등)
- 데이터 출처 핀: `dark:bg-neutral-900/80 dark:text-neutral-400` (기존 동등)

### `light-search.png` — 라이트 모드 검색 드롭다운
- 입력: `bg-white text-neutral-900 border-neutral-200 placeholder:text-neutral-500`
- 드롭다운 컨테이너: `bg-white ring-neutral-200`
- 결과 항목: `text-neutral-900 hover:bg-neutral-100`, 핀 이모지 `text-neutral-500`
- 이전: 다크 하드코딩 → 라이트 타일 위에서 콘트라스트 부족

### `light-routes.png` — 라이트 모드 Top-N 거리선 + highlight ring
- URL `?origin=37.5639,126.998&theme=light` 로 origin 고정 진입 → 가까운 통 3개 자동 강조
- Top-N rank 1: sky-600 `#0284c7` 굵기 3 (이전 sky-500 `#0ea5e9` → 라이트 타일 위에서 더 진하게)
- Top-N rank 2: sky-500 `#0ea5e9` 굵기 2 / rank 3: sky-400 `#38bdf8` 굵기 1.5 — 모두 한 단계 darker로 lift
- highlight-ring: orange `#f97316` 윤곽 + yellow `#fde047` fill — 라이트 타일에도 강한 콘트라스트 유지

### `dark-routes.png` — 다크 모드 Top-N 거리선 회귀 가드
- 다크 타일에선 기존 sky-500/300/200 lighter 스케일 유지 (CartoDB Dark Matter 위에서 pop)
- 라이트와 다크가 별개 `DISTANCE_LINE_STYLE` Record를 갖도록 `Record<TileTheme, Record<rank, ...>>`로 분기 (Map.tsx 134~147)

## 무엇이 끝났나

- **globals.css** — `@custom-variant dark (&:where(.dark, .dark *))` 추가 (Tailwind v4 클래스 기반 dark mode). 기존 `@media (prefers-color-scheme: dark)` body fallback은 첫 페인트 flash용으로 유지 (root div가 viewport 덮으므로 정상 렌더 시 비가시).
- **page.tsx** — root div에 tileTheme === 'dark'일 때 `dark` 클래스 부착. 기존 `themeChrome` 인라인 객체 제거하고 `dark:` variant로 통일. inactiveChip / 헤더 / 섹션 / 속도 슬라이더 panel / 통계 텍스트 6종 / breakdown / 로딩 오버레이 / toast 비강조 / 데이터 출처 핀 9개 표면 모두 라이트 분기 추가.
- **FilterChips.tsx** — `INACTIVE` 상수 + "전체" 활성 칩에 `dark:` variant.
- **LocateButton.tsx** — 비활성 분기에 라이트 톤.
- **SearchBox.tsx** — 입력·드롭다운 컨테이너·결과 항목·핀 이모지 라이트 분기.
- **Map.tsx** — `DISTANCE_LINE_STYLE`을 `Record<TileTheme, Record<rank, ...>>`로 변경. 라이트는 sky-600/500/400 (한 단계 darker), 다크는 기존 sky-500/300/200 유지. `DistanceLine`에 `tileTheme` prop 추가, 두 호출 사이트(나만 보기 / 경유 모드) 모두 전달.

## 트리거 일관성

`tileTheme` state가 단일 SoT. 진입 시 우선순위 — URL `theme=` → localStorage → `prefers-color-scheme: dark` 매치 시 'dark' 아니면 'light' (page.tsx 150-163). 명시 토글은 즉시 localStorage write. 시스템 자동 감지와 사용자 명시 토글이 같은 state를 통해 한 표면에 도달.

## 다음 것

- **P2.18** 통계바 정보 분리 — 에러는 빨간 토스트, 통계바는 성공 상태만
- **P3.1b** markercluster — 802 bins 시점에서 본격 효과
- **I.6** a11y 라운드 — 색맹 친화 패턴 (P2.20 보강)
