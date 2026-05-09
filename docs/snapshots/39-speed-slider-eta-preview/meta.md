---
index: 39
slug: speed-slider-eta-preview
date: 2026-05-09
phase: "Phase 2 보강 (P2.9 후속, 보행 속도 슬라이더; P2.22+P2.23 HUD 재배치 후)"
git_sha: 48a9836 (dirty, pre-rebase onto 083fba8 / v0.16.0)
viewport: 390x844
---

# 39 — 보행 속도 슬라이더 ETA 인라인 프리뷰

속도 슬라이더 panel 우측 라벨에 km/h 아래 한 줄로 ETA를 띄워, 슬라이더를 끌면서 시간이 어떻게 변하는지 즉시 보이도록 한 변경. 기존엔 ETA가 통계 바(stats bar)에만 있어 슬라이더 조작 중에 시선을 아래로 옮겨야 했음 — 작은 패턴 변경이지만 보행 속도 결정 흐름의 인지 비용이 줄어듦.

## 보이는 것
- `screenshot.png` — 명동성당을 출발지로 지정한 상태. 슬라이더 우측: 위 `4 km/h` 에메랄드 + 아래 `가까운 통 약 2분 16초` 회색. `aria-live="polite"`로 슬라이더 이동 시 스크린리더 announce.
- `screenshot-no-candidate.png` — 슬라이더만 열고 GPS·목적지 모두 미설정. ETA 줄 비표시 → panel height 안정 (기존 layout과 동일).
- 후보 우선순위는 stats bar와 동일 — `bestRouteCandidate` (출발+목적지 모두 set) > `bestNearestCandidate` (출발만, 또는 GPS만) > nothing.

## 무엇이 끝났나
- `src/app/page.tsx` 슬라이더 panel 우측 라벨을 `km/h` 단일 → `km/h` + ETA 한 줄 stack으로 변경
- `min-w-[64px]` → `min-w-[88px]`로 ETA 라벨 폭 확보
- 새 logic 0개 — `etaSeconds`/`formatEta` 재사용 (기존 vitest 커버 유지, 147 tests pass)
- 워크트리 `bun install` 누락 함정 1회 디펜스 (build fail → install → build pass)

## 다음 것
- P2.18 통계바 정보 분리 (에러 토스트 분리)
- P2.21 슬라이더 첫 토글 시 "통상 보행 4 km/h" 안내 — 이번 ETA 프리뷰와 인접
- P3.3 자치구 선택 UI
