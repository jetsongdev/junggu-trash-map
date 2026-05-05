---
index: 27
slug: per-district-status
date: 2026-05-05
phase: "P3.2"
git_sha: 050435f (dirty)
viewport: 390x844
---

# 27 — 자치구별 status 오버레이 + theme chrome 정비

P3.2 라운드 후반의 UX 정비가 끝난 시점. 자치구 로드 진행 상황을 ✓/⟳/⏳ 한 줄씩 보여주는 오버레이가 도입되어 "어디까지 들어왔는지"가 한눈에 보이고, page chrome도 시스템 prefers-color-scheme + 사용자 ☀️/🌑 토글에 따라 라이트/다크 양쪽으로 일관 전환된다. snapshot 26 대비 통계 바 breakdown은 동일하지만 로딩 중에 보이는 시각 신호가 압도적으로 풍부해졌다.

## 보이는 것
- 통계 바 1행: `📍 802 / 전체 802개` — 활성 자치구 7개 모두 합산
- 통계 바 2행: `마포구 198 · 구로구 188 · 노원구 128 · 성북구 119 · 서초구 83 · 중구 59 · 중랑구 27` — binCount 내림차순 breakdown, 로드된 구는 `text-neutral-300`/`text-neutral-200`, 미로드는 `text-neutral-600`로 dim
- (이 캡처에선 안 보이지만) 로딩 중에는 화면 중앙에 spinner + `자치구 로드 (N/7)` 헤더 + 7줄 status 리스트
  - ✓ (emerald-400) 로드 완료
  - ⟳ (amber-400 animate-pulse) in-flight
  - ⏳ (neutral-500) 대기
- 좌측 하단: `📊 공공데이터포털 · v2026-05-05` 데이터 출처 + 버전 핀
- 칩 row: 전체 / 일반 / 재활용 / 즐겨찾기 / 내 위치 / 직선 / 출발 탭 / 목적지 / 4km/h / 방향 / 라이트 / 공유

## 무엇이 끝났나
- **P3.2** 7개 자치구 데이터 (총 802 bins) + `<MapMoveHandler>` panning auto-add + 사용자 인터랙션 게이팅 idle prefetch + 5초 setTimeout autoFallback (LH 안전)
- 자치구별 status 리스트 (✓/⟳/⏳ 룩업 테이블 + binCount 내림차순)
- 데이터 출처 + 버전 좌측 하단 핀 (공공데이터포털 링크)
- 자치구 합류 토스트 + 전체 완료 emerald ✅ 토스트
- page chrome 시스템 테마 연동 (헤더·섹션 라이트/다크 conditional)
- `/simplify` 라운드 — `Map` → `MapView` 리네임 + globalThis 한정자 박멸 + STATUS_VIS 룩업 + districtBreakdown 재사용 + loadedPopulatedCount O(N×M)→O(N) 등 8건 정리
- TIL 4건: LH prefetch interaction-gating / deployment_status workflow ref / React setState race / cached prefetch stuck overlay

## 다음 것
- **PR #13 머지** (LH 통과 후 main)
- **P3.1b** markercluster — 마커 802개 시점에 본격 효과 (줌 아웃 시 묶음)
- **P3.1c** 인접 자치구 prefetch — manifest의 `adjacent` idle prefetch
- **P3.3** 자치구 자동 감지 진입 가이드 UI — 25구 셀렉터 + 빈 데이터 구 토스트
- **I.5** 라이트 모드 UI 정비 — 칩·로딩 오버레이·토스트·마커 윤곽까지 라이트 콘트라스트 일관
- **perf 라운드** — Lighthouse trend X.1 0.75 → P3.1a 0.68 → P3.2 0.72 (gated). P3.1b/c 머지 후 임계 ratchet up + 측정 root cause 분석.
