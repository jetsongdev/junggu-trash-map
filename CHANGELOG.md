# Changelog

이 프로젝트의 모든 주목할 변경사항은 이 파일에 기록된다.

포맷은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 기반.
버전은 [Semantic Versioning](https://semver.org/lang/ko/)을 따른다.

엔트리는 사용자/리뷰어 관점에서 변화를 한 줄로 적는다 — 구현 디테일이 아니라 "사용자가 보거나 느낄 차이". 한 글머리 기호 = 한 변경.

## [Unreleased]

### Infrastructure — Tier 2 검증 환경
- GitHub private repo `jetsongdev/junggu-trash-map` 생성 + 첫 push
- Vercel 프로젝트 link + Production deploy → https://junggu-trash-map.vercel.app
- **GitHub auto-deploy 연결** — `git push`만으로 production/preview 자동 배포 (16~22초 빌드)
- **Vercel Analytics + Speed Insights 설치** — RUM(Real User Monitoring), Core Web Vitals 자동 수집
- iPad/모바일에서 HTTPS로 접속해 실제 GPS 권한·watchPosition 동작 검증 가능

### Added — Phase 2.4++: 라이트/다크 타일 토글
- 새 칩 **🌑 다크 ↔ ☀️ 라이트** — CartoDB Dark Matter ↔ OpenStreetMap Standard
- 다크 모드: 어트리뷰션·줌 컨트롤도 다크. 라이트 모드: leaflet 기본 (흰)
- `localStorage['tileTheme']` 영속화 — 야외 햇빛 → 라이트, 실내 → 다크 선호 기억
- `TILE_PRESETS` 객체로 깔끔하게 정리 (Map.tsx export `TileTheme` 타입)

### Changed — Phase 2.4+: 다크 테마 가독성 통일
- 모든 비활성 칩(FilterChips·LocateButton·격자·지도 탭) 흰색 → `bg-neutral-800 text-neutral-200`
- 활성 "전체" 칩 흰색으로 invert (가장 강한 selected 표현)
- Leaflet 줌 컨트롤·어트리뷰션 다크 톤 override (Tailwind layer/specificity 회피 위해 `!important`)

### Changed — Phase 2.4: 다크 타일 (CartoDB Dark Matter)
- 지도 배경 OSM Light → CartoDB Dark Matter (`{s}.basemaps.cartocdn.com/dark_all/...`) — 다크 헤더와 통일
- 어트리뷰션에 © CARTO 추가, subdomains `abcd` (4-shard 분산), maxZoom 19→20, `{r}` retina 지원
- 보라/파랑 마커와 주황 강조 ring이 다크 배경에서 더 도드라짐

### Added — Phase 2.6: Manhattan 거리 토글
- 새 칩 **📏 직선 / 📐 격자** (amber 활성) — 거리 선이 2점 직선 ↔ 3점 L자로 즉시 전환
- `findNearest`도 mode 따라 재계산 (격자 거리에서는 nearest가 다른 마커가 될 수 있음)
- `localStorage['distanceMode']` 영속화 — 다음 방문 시 마지막 선택 복원
- 같은 좌표·같은 마커: 직선 121m → 격자 154m (보행자 거리 근사)

### Added — Phase 2.1+: 탭으로 위치 지정 (iOS Safari fallback)
- 새 칩 **🎯 지도 탭** — 모드 토글 후 지도 한 번 클릭으로 사용자 위치 설정 (cursor `crosshair`, 클릭 후 모드 자동 종료)
- GPS 권한 거부 / 신호 없음 / 타임아웃 별 에러 메시지 분기, 각 분기에서 탭 모드 우회 안내 포함
- iPad Safari에서 위치 권한 거부됐을 때, 설정 들어가지 않고도 앱 사용 가능 / 데스크톱에서 시뮬레이션 도구로도 사용

### Added — Phase 2.1: Geolocation
- "📍 내 위치" 버튼 — 권한 요청 → 지도가 사용자 위치로 panTo(zoom≥16, 0.6s flyTo) + 펄스 점 표시
- **실시간 추적**: `watchPosition`으로 사용자가 움직일 때마다 마커·강조·거리 라벨 자동 갱신 (clearWatch on toggle off + unmount)
- 가장 가까운 휴지통 자동 강조 — `CircleMarker` 픽셀 고정 ring(주황 #f97316 + 노랑 fill) + `highlight-pulse` 애니메이션
- **거리 선** — 사용자 위치 ↔ 가장 가까운 통 사이 dashed sky-300 polyline (`pathPositions`로 mode별 모양 결정)
- 거리 라벨 in 통계 바 ("가까운 통 121m (이름)") — m/km 자동 전환
- `lib/geo.ts` — Haversine + Manhattan + `distanceMeters` 디스패처 + `findNearest(mode)` + `pathPositions(mode)` (UI 토글은 추후)
- 권한 거부 / 브라우저 미지원 시 칩에 에러 메시지

### Added — Phase 0: PoC 부트스트랩
- Next.js 16 + Bun + Tailwind v4 + Leaflet 기반 중구 휴지통 지도 PWA 프로토타입
- 모바일 우선 헤더(다크) + 라이트 OSM 지도 레이아웃
- 휴지통 타입별 마커 색상·이모지 (🗑️ 일반 / ♻️ 재활용 / 🚬 담배꽁초 / 📍 기타)
- 다중 선택 필터 칩 + "📍 N / 전체 M개" 통계 바
- 마커 클릭 시 이름·주소·타입·관리기관 팝업

### Added — Phase 1: 실데이터 연동
- 표준데이터 CSV → JSON 변환 스크립트 (`scripts/transform.ts`) — 같은 좌표 다중 행을 그룹화, 자치구 무관
- 중구 가로휴지통 117행 → 59 그룹 마커 (혼합 56·일반-only 3)
- 혼합 마커 시각화: 보라(`#a855f7`) + 이중 이모지 `🗑️♻️`
- README에 실데이터 교체 가이드 한 단락

### Changed — Phase 1
- 휴지통 타입 시스템 축소: 4종 → 표준데이터 2종(`일반 | 재활용`). `TrashBin.type` → `TrashBin.types: BinType[]`
- 필터 칩 4 → 3개 (전체 / 일반 / 재활용)
- 팝업에 type 칩 배열 표시, 도로명 없으면 지번으로 fallback

### Performance
- `BinMarker`의 `L.divIcon`을 모듈 스코프 캐시로 (59 인스턴스/렌더 → 3 고정)
- `BinMarker`에 `React.memo` 적용 — 필터 토글 시 변경 없는 마커 skip
- `fetchBins`에 `cache: 'force-cache'` (정적 JSON, 빌드 시점에만 갱신)

### Fixed
- `scripts/transform.ts` 좌표 정렬 비교자 버그 (`*1e6 + ...` 매그니튜드 → 표준 튜플 비교 `a-b || c-d`)
- 스키마 마이그레이션 시 옛 캐시 응답으로 `bin.types`가 undefined 되던 문제

### Infrastructure
- `docs/tasks.md` — 작업 큐 + 결정 포인트 + 함정 누적 단일 소스
- `docs/snapshots/` — 마일스톤별 모바일 스크린샷 누적 시스템
- `~/.claude/skills/snapshot/` — 글로벌 스냅샷 스킬 (프레임워크 무관, config 기반)
- `CLAUDE.md` — 세션 진입 가이드 (작업 큐 / 시각 히스토리 / CHANGELOG 포인터)

[Unreleased]: https://github.com/USER/REPO/compare/HEAD
