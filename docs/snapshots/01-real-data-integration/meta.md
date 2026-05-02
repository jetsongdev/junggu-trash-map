---
index: 01
slug: real-data-integration
date: 2026-04-28
phase: "Phase 0+1 — 부트스트랩 + 실데이터 통합"
git_sha: 10ac013
viewport: 390x844
---

# 01 — 실데이터 통합 직후

첫 스냅샷. PoC 부트스트랩과 표준데이터 1차 통합이 끝난 시점.

## 보이는 것
- 헤더: 🗑️ 중구 휴지통 지도 + PROTO 배지
- 필터 칩: 전체 / 일반 / 재활용 (3개)
- 통계: 📍 59 / 전체 59개
- 지도: 중구 중심 OSM, 휴지통 마커 59개 (보라색 56개 = 일반+재활용 혼합, 파랑 3개 = 일반만, 초록 0)

## 무엇이 끝났나
- Next.js 16 + Bun + Tailwind v4 + Leaflet 기반 PoC
- `BinType = '일반' | '재활용'`, `TrashBin.types: BinType[]` 그룹 모델
- `scripts/transform.ts`로 표준데이터 CSV → 좌표별 그룹화 JSON 변환
- 117 raw rows → 59 마커 (중복 좌표 56개 그룹핑)
- BinMarker `divIcon` 캐시 (3종) + React.memo
- 빌드/브라우저 검증 완료

## 다음 것
`docs/tasks.md`의 Phase 2 (UX 다듬기) — 내 위치 / PWA / 클러스터링 / URL 쿼리스트링 필터 등.
