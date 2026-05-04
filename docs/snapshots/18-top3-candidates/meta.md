---
name: top3-candidates
title: "🥇🥈🥉 가까운/경유 휴지통 Top-3 후보 시각화"
index: 18
date: 2026-05-04
phase: P2.10
git_sha: 71b260d46c92fb2c0fe6b4720181fca3402e2f99
viewport: 390x844
---

## 이 시점에 보이는 것

- 사용자 위치(파란 점) 주변 휴지통 3개가 rank별 크기·투명도로 동시 표시
  - 1등(가장 가까운): 100% opacity, 원래 크기 + 주황 ring
  - 2등: opacity 55%, 24px
  - 3등: opacity 35%, 20px
- 통계 바: 1등 기준 "가까운 통 155m · 약 2분 19초" 유지

## 끝난 것

- P2.10: `findTopNearest` / `findTopDetours` geo.ts에 추가 (기존 함수 시그니처 유지)
- `BinMarker`에 `rank?: 1 | 2 | 3` prop — RANK_STYLE 테이블로 opacity/scale 처리
- 목적지 없으면 nearest top-3, 있으면 detour top-3 (extra 오름차순)
- 인터랙션 없음 (읽기 전용 시각 표시만)
- vitest 59개 전부 통과 유지

## 다음 것

- Preview 검수 후 main 머지
- P2.14 즐겨찾기 / I.3 Lighthouse CI / P2.13 방향 화살표
