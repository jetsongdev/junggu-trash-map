---
name: head-up-mode
title: "🧭 헤드업 모드 — 지도 자체가 사용자 시선 방향으로 회전 + cone 일관성"
index: 20
date: 2026-05-04
phase: P2.13
git_sha: 4828d588e603d881293f5c3d16ea717c2c679aa4
viewport: 390x844
---

## 이 시점에 보이는 것

- 🧭 방향 칩이 violet 활성 상태 (head-up 모드)
- 지도 전체가 사용자 시선 방향으로 회전 (alpha=315 → heading 45° → bearing -45°)
- 거리 라벨·도로 이름이 따라 회전
- 휴지통 마커들은 직립 유지 (`leaflet-rotate`의 `_norotatePane` 처리 + counter-rotate 직접 안 걸기)
- 사용자 dot 주변에 부채꼴 cone이 viewport 위쪽을 가리킴 — head-up에서도 시선 메타포 일관
- Top-3 후보 강조(주황 ring + 점선 3개) 그대로 유지

## 끝난 것

- P2.13 cone (deviceorientation) + 🧭 토글 칩 (off / cone / head-up 3-state)
- P2.13b head-up 모드 (`leaflet-rotate@0.2.8` 통합, `window.L` 셋업 분리, `BearingController`)
- markerPane double-rotation 버그 수정 (Codex stop-gate가 잡음)
- heading 4겹 디펜스: 두 이벤트 listen + content filter / `screen.orientation.angle` 보정 / 60ms throttle / EMA wrap-around 스무딩
- 이벤트 source `'on…' in window` silent-fail 함정 회피 (Codex stop-gate가 잡음)
- 헤드업 모드에서도 cone 표시 — 회전각 = `userHeading + (mapBearing ?? 0)`로 보정해 viewport 위쪽 가리키게
- TIL 6건 누적 (`docs/til/`): divIcon transform:scale, top3 dim non-candidates, deviceorientation iOS/Android quirks, leaflet-rotate window.L bootstrap, marker double-rotation, heading jitter 4겹 디펜스
- iPad mini 7 + 갤럭시 Whale 사용자 검증 완료

## 다음 것

- main 머지
- 다음 후보: P2.14 즐겨찾기 / I.3 Lighthouse CI / P2.9 보행 속도 슬라이더
