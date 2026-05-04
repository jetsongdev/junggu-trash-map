---
name: walking-speed-slider
title: "🚶 보행 속도 슬라이더 — 2~7 km/h 0.5 step (cycle 칩 → 슬라이더)"
index: 21
date: 2026-05-04
phase: P2.9
git_sha: b9bbbc3dd435d4db5aedd027c51c86ca2bb2c506
viewport: 390x844
---

## 이 시점에 보이는 것

- 칩 row의 "🚶 4km/h" 칩이 emerald 활성 상태 (슬라이더 panel 열림)
- 칩 아래 슬라이더 panel: 🚶 + native range slider (accent emerald) + "4 km/h" 우측 표시
- MIN 2 / MAX 7 / STEP 0.5 — 노약자(2km/h)부터 가벼운 러닝(7km/h)까지 커버
- 슬라이더 변경 시 통계 바의 ETA가 즉시 업데이트 ("약 1분 39초")

## 끝난 것

- `WalkingSpeed` 타입을 number(km/h)로 전환, preset string은 backwards-compat union
- `MIN_KMH=2`, `MAX_KMH=7`, `STEP_KMH=0.5`, `DEFAULT_KMH=4` 상수
- `speedToKmh` / `clampKmh` / `getSpeedDisplay` / `formatKmh` 추가 (eta.ts 14개 신규 테스트)
- `etaSeconds`는 숫자/preset 모두 받음 (기존 9개 테스트 그대로 통과)
- URL share `speed` 파라미터: 숫자 우선, legacy preset 호환 (`slow`→3, `normal`→4, `fast`→5). 범위 밖 거부 (url-share.ts 7개 신규 테스트)
- localStorage: 숫자 형식 저장, 레거시 preset 자동 마이그레이션
- UI: 칩 클릭 → 슬라이더 panel 토글, 이모지는 임계 자동 (🐢 <3.5, 🚶 3.5~4.5, 🏃 ≥4.5)
- vitest 80개 통과 (59 → 73 → 80)

## 다음 것

- iPad/갤럭시 사용자 검증 후 main 머지
- 다음 후보: P2.14 즐겨찾기 / I.3 Lighthouse CI (별도 chore/i.3 브랜치 진행 중)
