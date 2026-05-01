# Changelog

이 프로젝트의 모든 주목할 변경사항은 이 파일에 기록된다.

포맷은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 기반.
버전은 [Semantic Versioning](https://semver.org/lang/ko/)을 따른다.

엔트리는 사용자/리뷰어 관점에서 변화를 한 줄로 적는다 — 구현 디테일이 아니라 "사용자가 보거나 느낄 차이". 한 글머리 기호 = 한 변경.

## [Unreleased]

### Added — Phase 2.1: Geolocation
- "📍 내 위치" 버튼 — 권한 요청 → 지도가 사용자 위치로 panTo(zoom≥16, 0.6s flyTo) + 펄스 점 표시
- 가장 가까운 휴지통 자동 강조 (노란 ring) + 거리 라벨 ("가까운 통 121m (이름)") in 통계 바
- `lib/geo.ts` — Haversine 거리, `findNearest`, `formatDistance` (m/km 전환)
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
