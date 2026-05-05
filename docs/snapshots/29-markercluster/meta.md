---
index: 29
slug: markercluster
date: 2026-05-05
phase: "P3.1b"
git_sha: ad6cb46 (dirty)
viewport: 390x844
---

# 29 — markercluster (P3.1b)

802 bins이 7개 자치구에 펼쳐지면서 줌-아웃 시 화면이 마커로 도배되는 문제를 `leaflet.markercluster`로 해소. 줌 <15에서는 클러스터 카운트 풍선, 줌 ≥15에서는 개별 마커. P3.2가 깐 다구 데이터 위에 시각 노이즈를 정리하는 한 단계.

## 보이는 것
- 지도 곳곳에 노란/초록/연두 풍선으로 묶인 클러스터 (5, 6, 7, 8, 13, 18, ...) — `MarkerCluster.Default.css`의 디폴트 톤
- 시청 인근 작은 보라색 혼합 마커 한 개 — 단일 마커는 클러스터링되지 않고 그대로 노출 (markercluster의 기본 동작)
- 헤더/필터/모드 칩 바·통계 바·breakdown 바는 P2.17 onboarding 상태 그대로 — 시각 회귀 없음
- 캡처 시 `802 / 전체 802개`, 7구 모두 active set에 들어와 있음 (마포 198 / 구로 188 / 노원 128 / 성북 119 / 서초 83 / 중구 59 / 중랑 27)

## 무엇이 끝났나
- `leaflet.markercluster@1.5.3` + `@types/leaflet.markercluster` 의존성 추가
- `app/layout.tsx`에 `MarkerCluster.css` + `MarkerCluster.Default.css` import
- `src/components/MarkerClusterGroup.tsx` — `@react-leaflet/core`의 `createLayerComponent` + `extendContext({ layerContainer })`로 BinMarker 자식이 클러스터 그룹에 attach (LayerGroup과 동일 패턴)
- `Map.tsx`에서 `bins.map(...)` JSX를 `<MarkerClusterGroup disableClusteringAtZoom={15} spiderfyOnMaxZoom={false} showCoverageOnHover={false} chunkedLoading>`으로 감쌈
- HighlightRing/DistanceLine/RouteLine은 그대로 map 직속 — Top-3 dimming, 헤드업 회전, 즐겨찾기는 줌 ≥15에서 개별 마커가 보일 때 그대로 동작
- `bun run build` + `bun run test` (138 tests) 통과
- 시각 검증: 줌 13 → 클러스터 ≥3개 (45개 관측), 줌 ≥17 → 클러스터 0 / 53 개별 마커

## 다음 것
- **P3.1c 인접 자치구 prefetch** — manifest의 `adjacent`를 `requestIdleCallback`으로 백그라운드 fetch
- P3.3 자치구 진입 가이드 UI (25구 셀렉터 + 미발행 18구 토스트)
- Lighthouse perf 추이 모니터링 (markercluster 번들 ~10KB gzip)
