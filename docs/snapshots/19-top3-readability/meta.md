---
name: top3-readability
title: "🔵🔵🔵 Top-3 후보 가독성 개선 — 선 3개 연결 + 비후보 희미하게"
index: 19
date: 2026-05-04
phase: P2.10
git_sha: c102702e5c8903902f24de4d7ef5939bcff313a2
viewport: 390x844
---

## 이 시점에 보이는 것

- 사용자 위치(파란 점) 설정 시 Top-3 후보만 선명하게, 나머지 마커는 opacity 0.25로 희미하게
- rank 1 → 굵고 밝은 파란 선 (weight 3, opacity 0.85)
- rank 2 → 중간 파란 선 (weight 2, opacity 0.6)
- rank 3 → 연한 파란 선 (weight 1.5, opacity 0.4)
- rank 1 마커에 주황 ring 유지, rank 2·3은 크기만 작게 (75% / 62.5%), opacity 모두 1
- 통계 바: "가까운 통 111m · 약 1분 39초 (명동 성당 앞(명동길 79))"

## 끝난 것

- P2.10 가독성 개선:
  - `RANK_STYLE` opacity 1로 통일 (rank 구분은 크기만)
  - `BinMarker`에 `dimmed` prop 추가 → highlights 있을 때 비후보 opacity 0.25
  - `Map.tsx`: rank 1·2·3 각각 `DistanceLine` 연결 (rank별 색·굵기 그라데이션)
  - 목적지 있을 때 rank 1은 RouteLine, rank 2·3은 DistanceLine

## 다음 것

- Preview 검수 후 main 머지
- P2.14 즐겨찾기 / I.3 Lighthouse CI / P2.13 방향 화살표
