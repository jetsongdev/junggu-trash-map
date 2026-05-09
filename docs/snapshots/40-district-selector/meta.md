---
index: 40
slug: district-selector
date: 2026-05-09
phase: P3.3
git_sha: 5b1a45c
viewport: 390x844 (mobile, dark)
---

# 40 — P3.3 25구 셀렉터 그리드

우상단 floating stack에 🗺 칩 추가 → 25구 5x5 grid 패널 → 한 탭으로 자치구 이동. populated 7구 / empty 18구 시각 분리.

## 캡처

- `screenshot-default.png` (390×844 dark) — 패널 닫힘 상태. 우상단 stack에 🗺 칩이 필터 위에 배치된 기본 화면.
- `screenshot-opened.png` (390×844 dark) — 🗺 칩 탭 → 5x5 grid 패널 펼쳐짐. populated 7구는 sky 톤 + binCount 숫자(노원128 / 성북119 / 중랑27 / 중구59 / 마포198 / 서초83 / 구로188), empty 18구는 neutral dim + 자치구명만.
- `screenshot-empty-toast.png` (390×844 dark) — empty 자치구(동대문구) 탭 후 `flyTo(centroid, 14)` + 하단 info 토스트 "동대문구는 아직 공공데이터가 발행되지 않았어요" 표시. P3.3-fix1.

## empty-toast 캡처 후기 (P3.3-fix1)

본 세션에서 못 잡은 이유는 코드 문제가 아니라 캡처 도구 타이밍이었음 — `take_screenshot` 내부 폰트 로드 대기(~5s)가 토스트 3s duration보다 길어 캡처 시점에 토스트는 이미 사라진 뒤. P3.3-fix1에서는 코드 수정 없이 Playwright `evaluate`로 `window.setTimeout`을 가로채 `delay === 3000`인 호출만 no-op으로 만들고, 토스트가 사라지지 않는 동안 `browser_take_screenshot` 실행. 다른 timer(map updates 등)는 영향 없도록 3000ms exact match만 무시. 캡처 후 `__origST`로 복원했지만 캡처 직후 페이지를 떠나므로 잔존 영향 없음.

## 동작 요약

- 트리거 칩: `hudIconBtn` 스타일, teal accent. 패널 토글 / Esc / 외부 탭 닫힘
- populated 탭 → `flyToBounds(bbox, { maxZoom: 15 })` → P3.2 panning auto-add가 fetch 자연 트리거
- empty 탭 → `flyTo(centroid, 14)` + info 토스트 (3s) "{name}는 아직 공공데이터가 발행되지 않았어요"
- 현재 viewing district (지도 center 속한 구) 셀에 amber ring 강조

## 코드

- `src/lib/district-grid.ts` — 5x5 layout 상수 + `getDistrictForCell` / `getCellForDistrict` / `getDistrictGridRows` / `boundsForDistrict`
- `src/lib/__tests__/district-grid.test.ts` — 25구 매핑·grid shape·round-trip·범위 밖·bounds 변환 검증 (vitest 6개)
- `src/components/DistrictSelector.tsx` — open state + outside click + Esc + 셀 grid
- `src/app/page.tsx` — 우상단 stack에 마운트, `viewingDistrict` state, populated/empty 핸들러

## 5x5 grid 매핑

```
도봉   노원   강북   성북   중랑
은평   종로   동대문 광진   강동
서대문 중구   용산   성동   송파
마포   영등포 동작   서초   강남
강서   양천   구로   금천   관악
```

25구 / 25칸 / 빈 칸 0. 중랑(row 1)·송파(row 3)이 지리상 한 칸씩 어긋남 — 빈 칸 회피를 우선.

## Verification

- `bun run build` ✓
- `bun run test` ✓ 157 tests (151 + 6 district-grid)
- 다크 테마 panel + grid 색상 정상

## 다음 것

- empty-toast 스냅샷 재캡처 (별도 세션)
- Vercel preview 검수 → PR + main 머지
- I.6 a11y 라운드 / P4.1 타 종류 통 / P2.24 Liquid Glass 등
