# 📸 Snapshots

앱이 시간에 따라 어떻게 진화했는지 시각 기록. 큰 단위 작업(Phase, 주요 기능 추가, UX 개편)이 끝날 때마다 한 장씩 누적.

## 인덱스

| # | 날짜 | 제목 | 폴더 |
|---|------|------|------|
| 01 | 2026-04-28 | 실데이터 통합 직후 (Phase 0+1) | [01-real-data-integration](./01-real-data-integration/) |
| 02 | 2026-05-01 | 리팩터 후 + 재활용 필터 적용 상태 (56/59) | [02-post-simplify](./02-post-simplify/) |
| 03 | 2026-05-01 | 내 위치 + 가까운 휴지통 강조 (P2.1) | [03-geolocation](./03-geolocation/) |
| 04 | 2026-05-02 | 필터 + 위치 결합 (재활용+중림로10, 88m 점프) | [04-locate-with-filter](./04-locate-with-filter/) |
| 05 | 2026-05-02 | 실시간 추적 + 거리 선 (시청/명동/DDP 3프레임) | [05-realtime-tracking](./05-realtime-tracking/) |
| 06 | 2026-05-02 | 🎯 지도 탭으로 위치 지정 (iPad/GPS 거부 우회) | [06-tap-to-locate](./06-tap-to-locate/) |
| 07 | 2026-05-02 | 📐 Manhattan 거리 토글 (L자 격자, 154m vs 직선 121m) | [07-manhattan-toggle](./07-manhattan-toggle/) |
| 08 | 2026-05-02 | 🌑 CartoDB Dark Matter 타일 (다크 헤더와 통일) | [08-dark-tiles](./08-dark-tiles/) |
| 09 | 2026-05-02 | 🎨 다크 테마 가독성 — 비활성 칩·줌·어트리뷰션 다크 통일 | [09-dark-theme-polish](./09-dark-theme-polish/) |
| 10 | 2026-05-02 | 🌑/☀️ 라이트/다크 타일 토글 (2프레임 비교) | [10-tile-theme-toggle](./10-tile-theme-toggle/) |
| 11 | 2026-05-02 | 📲 PWA manifest + 아이콘 (홈 화면 추가 가능) | [11-pwa-manifest](./11-pwa-manifest/) |
| 12 | 2026-05-02 | 🚶 경로 최적화 — 출발 → 경유 통 → 목적지 (detour 알고리즘) | [12-route-optimization](./12-route-optimization/) |
| 13 | 2026-05-02 | ⏱ ETA + 보행 속도 3단계 (느림 3 / 보통 4 / 빠름 5 km/h) | [13-eta-walking-speed](./13-eta-walking-speed/) |
| 14 | 2026-05-03 | 🔎 주소·랜드마크 검색 박스 (Nominatim, "명동성당" 3건 드롭다운) | [14-address-search](./14-address-search/) |
| 15 | 2026-05-03 | 🔄 저장된 환경설정 복원 baseline — 라이트+격자+빠름 (hydration hotfix 검증) | [15-prefs-restored](./15-prefs-restored/) |
| 16 | 2026-05-03 | 🎨 폴리싱 셋트 — 마커 톤 (blue/emerald/violet-400) + 시스템 다크 자동 + 햅틱 | [16-polish-bundle](./16-polish-bundle/) |
| 17 | 2026-05-03 | 🔗 URL 쿼리스트링 공유 + 딥링크 (🔗 공유 버튼, 6개 파라미터) | [17-url-share](./17-url-share/) |
| 18 | 2026-05-04 | 🥇🥈🥉 가까운/경유 휴지통 Top-3 후보 시각화 (rank별 opacity·크기) | [18-top3-candidates](./18-top3-candidates/) |
| 19 | 2026-05-04 | 🔵🔵🔵 Top-3 후보 가독성 개선 — 선 3개 연결 + 비후보 희미하게 | [19-top3-readability](./19-top3-readability/) |
| 20 | 2026-05-04 | 🧭 헤드업 모드 — 지도 회전 + cone 일관성 (P2.13) | [20-head-up-mode](./20-head-up-mode/) |
| 21 | 2026-05-04 | 🚶 보행 속도 슬라이더 — 2~7 km/h 0.5 step (P2.9) | [21-walking-speed-slider](./21-walking-speed-slider/) |
| 22 | 2026-05-04 | ☀️📏 라이트 + 직선 — Top-3 시각화 + 통계 바 | [22-light-euclidean](./22-light-euclidean/) |
| 23 | 2026-05-04 | ☀️📐 라이트 + 격자 — Manhattan 거리 (143m, +32m) | [23-light-manhattan](./23-light-manhattan/) |
| 24 | 2026-05-04 | 🌑📐 다크 + 격자 — CartoDB Dark Matter + L자 점선 | [24-dark-manhattan](./24-dark-manhattan/) |
| 25 | 2026-05-04 | ★ 즐겨찾기 — popup 별 토글 + 칩 필터 (P2.14) | [25-favorites](./25-favorites/) |
| 26 | 2026-05-05 | 🗺 다구 로드 — 7개 자치구 802 bins + breakdown (P3.1a + P3.2) | [26-multi-district-load](./26-multi-district-load/) |
| 27 | 2026-05-05 | ✓ 자치구별 status 오버레이 + theme chrome 정비 (P3.2 후반) | [27-per-district-status](./27-per-district-status/) |
| 28 | 2026-05-05 | 1️⃣2️⃣ onboarding & 모드 명확화 — 첫 방문 토스트 + 칩 뱃지 + tap mode 배너 (P2.17) | [28-onboarding-mode-clarity](./28-onboarding-mode-clarity/) |
| 29 | 2026-05-05 | ☀️🌑 라이트 모드 일관 전환 — 헤더·필터·칩·통계·오버레이·검색·핀까지 양 테마 (I.5) | [29-light-mode-polish](./29-light-mode-polish/) |
| 30 | 2026-05-05 | 🔵 markercluster — 802 bins 줌-아웃 클러스터링, ≥15 개별 마커 (P3.1b) | [30-markercluster](./30-markercluster/) |
| 31 | 2026-05-06 | 〰️ Top-N 거리선 패턴 분리 — rank 1 실선 / 2 대시 / 3 도트 (P2.20, light+dark) | [31-topn-distance-pattern](./31-topn-distance-pattern/) |
| 32 | 2026-05-06 | 〰️ 라이트 거리선 slate 폴리싱 — sky→slate-8/6/5 + opacity 보강 (P2.20 후속) | [32-topn-light-slate-polish](./32-topn-light-slate-polish/) |
| 33 | 2026-05-07 | 〰️ Top-N 거리선 P2.20 최종 — light deep blue 단일 톤 + RouteLine 실선화 (light·dark·destination 3장) | [33-topn-deep-blue-final](./33-topn-deep-blue-final/) |
| 34 | 2026-05-08 | 📍 위치 힌트 텍스트 — popup에 운영자 큐레이션 한 줄, 주소 위 primary (P4.3, light·dark·with·without 4장) | [34-location-hint](./34-location-hint/) |
| 35 | 2026-05-06 | 📱 모바일 툴바 압축 — 3그룹 / 아이콘 only / 줌 좌하단 / 출처 우하단 (P2.22) | [35-mobile-toolbar-compact](./35-mobile-toolbar-compact/) |
| 36 | 2026-05-06 | 📊 데이터 현황 + 출처 통합 토글 — 우하단 한 카드, 펼침=자치구 리스트+링크 (P2.22+) | [36-status-overlay-toggle](./36-status-overlay-toggle/) |
| 37 | 2026-05-07 | 🎯 HUD 재배치 — 좌상단 필터 / 우상단 모드 stack / 출발-목적지 segmented (P2.23) | [37-hud-rearrange](./37-hud-rearrange/) |
| 38 | 2026-05-09 | ✅ P2.22 + P2.23 branch final — mobile light/dark + iPad scroll lock 검수 | [38-p222-p223-final](./38-p222-p223-final/) |
| 39 | 2026-05-09 | 🚶 속도 슬라이더 우측에 ETA 인라인 프리뷰 — `km/h` 아래 "가까운 통 약 2분" 한 줄 (with·without 2장) | [39-speed-slider-eta-preview](./39-speed-slider-eta-preview/) |
| 40 | 2026-05-09 | 🗺 25구 셀렉터 그리드 — 우상단 🗺 칩 → 5x5 grid (populated/empty 시각 분리, P3.3) | [40-district-selector](./40-district-selector/) |
| 41 | 2026-05-09 | 🟡 자치구 폴리곤 outline — viewing district amber dashed (light/dark/selector-open 3장, P3.4) | [41-district-outline](./41-district-outline/) |
| 42 | 2026-05-09 | 💡 첫-사용 힌트 5종 + 토스트 모달 재배치 — share/favorite/headsUp/grid/speed 정중앙 투명 모달 (P2.19+P2.21) | [42-first-use-hints](./42-first-use-hints/) |
| 43 | 2026-05-09 | ⏱ 첫 로딩 토스트 시퀀스 검증 — 오버레이→상단→중앙 3 phase 모두 단독, 위치 충돌 0 (sequencing fix) | [43-loading-sequence-fix](./43-loading-sequence-fix/) |
| 44 | 2026-05-10 | 🎯🏁 토스트 + 탭 모드 배너 통합 시각 언어 — 정중앙 투명 모달 + 300ms fade in/out, default·violet origin·rose destination 3장 (P2.19+P2.21 final) | [44-toast-tap-banner-unified](./44-toast-tap-banner-unified/) |

## 새 스냅샷 찍는 법

`/snapshot` 슬래시 커맨드 실행 → `.claude/skills/snapshot/SKILL.md` 절차에 따라 자동 캡처.

수동으로:
1. `bun run dev`로 서버 띄우고 마커 렌더 확인
2. Playwright MCP로 viewport 390×844, http://localhost:3000 (또는 폴백 포트) 진입
3. `bun run dev` 콘솔에서 마커 카운트 확인 후 스크린샷 → `docs/snapshots/{NN}-{slug}/screenshot.png`
4. `meta.md` 작성 (index, date, phase, 보이는 것, 끝난 것, 다음 것)
5. 이 파일의 인덱스 표에 한 줄 추가

## 컨벤션
- 폴더: `NN-slug` (zero-padded NN, kebab-case slug)
- 사이즈: 390×844 (모바일 우선)
- 형식: PNG (selectable text/사진보다 화질 우선)
- meta.md: YAML frontmatter + 마크다운 본문
- 한 폴더 ≤ 1 스크린샷 + 1 메타. 더 필요하면 새 폴더.
