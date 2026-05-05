---
name: favorites
title: "★ 즐겨찾기 — popup 별 토글 + 칩 필터 (1/59)"
index: 25
date: 2026-05-04
phase: P2.14
git_sha: c48d1004e2b600e1cda1bd3bed652d724e79451b
viewport: 390x844
---

## 이 시점에 보이는 것

- 칩 row에 새 "★ 즐겨찾기 1" 칩 (amber 활성, count badge)
- 통계 바: "📍 1 / 전체 59개" — 필터 적용으로 1개만 표시
- 팝업의 노란 ★ — 즐겨찾기 추가된 마커 (남산 국립극장 정류장)
- 지도에는 즐겨찾기된 마커 1개만 보임 (다른 58개는 필터로 숨김)

## 끝난 것

- `lib/favorites.ts` — Set<string> 기반 load/save/toggle/has/filter 순수 함수
- localStorage 키 `favorites` (comma-separated bin id)
- `BinPopup`에 ☆/★ 토글 버튼 (amber-500 활성, neutral-300 비활성)
- 칩 row "★ 즐겨찾기" 필터 — 켜면 favorites만 보임. 0개일 땐 disabled
- 햅틱 (`HAPTIC.SELECT`) on 토글
- vitest 13개 신규 (98개 통과)

## 다음 것

- iPad/갤럭시 검증 후 main 머지
- (옵션) 최근 사용 휴지통 자동 트래킹 — recents (별도 task)
