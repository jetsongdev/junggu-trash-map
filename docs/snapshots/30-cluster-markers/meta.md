---
index: 30
slug: cluster-markers
date: 2026-05-06
phase: "Phase 3 — P3.1b"
git_sha: 2a3a6820a8c4201f3523f63dfad3280ac3657465
viewport: 390x844
---

# 30 — P3.1b markercluster

802 bins 7개 자치구 분량을 줌 아웃 상태에서 한꺼번에 렌더하던 구조를 `leaflet.markercluster`로 묶었다. 25구 다 채워질 미래까지 견디는 인프라이자, P3.2 push에서 ratchet down된 Lighthouse perf(0.65→0.62)를 회복시킬 후보다.

## 보이는 것
- 자치구별 cluster bubble — 마포(8개 표시), 구로(7), 성북(8), 서초(5), 노원(5), 중랑(2)이 각각 묶여 둥근 초록 카운트로 표시
- 중구 영역(지도 중앙)은 줌이 break(=15) 통과해 개별 마커가 그대로 — 보라 혼합 마커 1개 + 일반/재활용 마커 가시
- 줌 ≥15부터 Top-3 dimming/route line/distance line/highlight ring 같은 decoration overlay가 켜지는 옵션 C 적용
- 통계 바: `802 / 전체 802개` + 자치구 brakedown (마포 198 · 구로 188 · 노원 128 · 성북 119 · 서초 83 · 중구 59 · 중랑 27)

## 무엇이 끝났나
- 네이티브 `leaflet.markercluster` + `useEffect` + `L.markerClusterGroup()` 패턴 (react-leaflet 5 / React 19 호환 wrapper 부재 우회)
- `src/lib/marker-cluster-layer.ts` — 레이어 add/remove + popup React root mount/unmount 분리, SSR 가드
- `src/lib/map-cluster.ts` — `CLUSTER_BREAK_ZOOM=15`, `shouldClusterMarkers`, `shouldDimNonHighlightMarker` 순수 함수
- `BinMarker.tsx` `getBinMarkerIcon` export → cluster layer가 같은 divIcon 캐시 재사용
- `Map.tsx` `ZoomLevelTracker` + `highlightRanks` `useMemo` 안정화 (zoom/pan 시 cluster 재마운트 방지)
- vitest 145개 통과, `bun run build` 성공

## 다음 것
- preview 검수 (HTTPS GPS 동작 + 다크 타일에서 cluster 가독성)
- Lighthouse 점수 회복 라운드 (현재 perf 0.62 임계 위태, cluster 도입으로 회복 기대)
- Phase 3 잔여: P3.3 자치구 자동 감지 진입 가이드 UI
