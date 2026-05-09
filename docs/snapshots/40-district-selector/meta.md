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

## 빠진 것 — empty-toast

`empty-toast` 캡처는 별도 세션으로 미룸. 현재 setup에서 토스트 3s duration이 Playwright `take_screenshot` 내부 폰트 로드 대기(~5s)와 충돌해 캡처 시점에 이미 사라짐. evaluate로 토스트 텍스트 ("동대문구는 아직 공공데이터가 발행되지 않았어요") 노출은 확인됨. 재캡처 옵션:

- 임시로 toast duration 6~10s로 늘려 캡처 후 revert
- setTimeout monkey-patch로 timer 무효화
- 별도 capture mode prop 추가

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
