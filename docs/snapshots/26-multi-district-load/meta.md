---
index: 26
slug: multi-district-load
date: 2026-05-05
phase: "P3.2"
git_sha: e8f131a (dirty)
viewport: 390x844
---

# 26 — 다구 로드 (P3.1a + P3.2 완료 시점)

P3.1 (자치구 단위 정적 JSON + GeoJSON 폴리곤) 결정 직후 P3.2 데이터 적재까지 한 번에 묶어 마감한 시점. 이 한 장이 "한 자치구 PoC → 서울 다구 지도"로 넘어간 분기점이다. 첫 페인트는 그대로 한 구 분량만, 사용자가 지도/UI에 처음 손대는 순간 발행 6개 자치구가 백그라운드(`requestIdleCallback`)로 합류하여 통계 바가 `802 / 전체 802개`로 채워지는 진행감을 가시화.

## 보이는 것
- 통계 바 1행: `📍 802 / 전체 802개` — 활성 자치구 7개 모두 합산
- 통계 바 2행 (신규): `마포구 198 · 구로구 188 · 노원구 128 · 성북구 119 · 서초구 83 · 중구 59 · 중랑구 27` — 마커수 내림차순 breakdown, text-[11px] neutral-500
- 마커: 중구 영역에 혼합(보라) 위주 + 사이사이 일반(파랑)/재활용(초록) 단일 타입
- 칩 row: 전체 / 일반 / 재활용 / 즐겨찾기 / 내 위치 / 직선 / 출발 탭 / 목적지 / 4km/h / 방향 / 라이트 / 공유 — 기존 P2 UI 그대로
- (캡처 시점 토스트는 이미 페이드 아웃 — 토스트는 1.5s 개별 / 3s "전체 7개 자치구 802개 휴지통 로드 완료")

## 무엇이 끝났나
- **P3.1** 데이터 분할 전략 결정 (spec: `docs/superpowers/specs/2026-05-05-p3-1-data-partitioning-design.md`) — 자치구 단위 정적 JSON + 클라이언트 point-in-polygon
- **P3.1a** Foundation — `seoul-manifest.json` / `seoul-districts.geojson` / `districts/<code>.json` 3축 정적 자원 + `point-in-district` / `districts` / `fetchDistrict` 모듈 + page.tsx 부트 시퀀스
- **P3.2** 7개 자치구 데이터 transform (중구·서초·중랑·성북·마포·구로·노원, 802 bins) + `<MapMoveHandler>` panning auto-add + 사용자 인터랙션 게이팅 idle prefetch + 통계 바 구별 breakdown + 자치구 로드 토스트 (개별 + 전체 완료)

## 다음 것
- **P3.1b** markercluster — 802 마커 시점부터 본격 효과 (줌 아웃 시 묶음)
- **P3.1c** 인접 자치구 prefetch — 좌표 기반 인접 구 idle prefetch (현재는 모든 발행 구 일괄)
- **P3.3** 자치구 자동 감지 진입 가이드 UI — 25구 셀렉터, 발행 안 된 18개 구 토스트
- **perf 라운드** — Lighthouse trend X.1 0.75 → P3.1a 0.68 → P3.2 0.72 (gated). 임계 0.62. P3.1b/c 머지 후 임계 ratchet up + 측정 root cause 분석.
