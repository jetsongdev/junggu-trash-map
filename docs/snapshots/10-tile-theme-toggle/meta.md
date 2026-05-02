---
index: 10
slug: tile-theme-toggle
date: 2026-05-02
phase: "Phase 2.4++ — 라이트/다크 타일 토글"
git_sha: 2478994 (dirty)
viewport: 390x844
state: "두 프레임 — 다크(default) + 라이트, 명동성당 121m 동일 컨텍스트"
---

# 10 — 라이트/다크 타일 토글

다크가 헤더와 통일감 좋지만 야외 햇빛에선 라이트가 가독성 좋음. 한 칩으로 전환 + localStorage 영속화.

## 프레임

| 파일 | 모드 | 타일 | 어트리뷰션 |
|------|------|------|-----------|
| `screenshot.png` | 🌑 다크 (default) | CartoDB Dark Matter | © OSM © CARTO (다크 톤) |
| `screenshot-light.png` | ☀️ 라이트 | OpenStreetMap Standard | © OSM (기본 톤) |

같은 좌표 (명동성당), 같은 통계 (121m), 같은 마커. **타일 + 줌·어트리뷰션 톤만** 변함.

## 변경
- `src/components/Map.tsx`:
  - `TileTheme = 'light' | 'dark'` 타입 export
  - `TILE_PRESETS` 객체 (url/attribution/subdomains/maxZoom)
  - `tileTheme` prop, `<TileLayer key={tileTheme}>` (key로 교체 시 reset)
  - 래퍼 div의 `tile-theme-dark` 클래스 (다크 모드일 때만)
- `src/app/page.tsx`:
  - `tileTheme` state, lazy init from `localStorage`
  - `useEffect` for persistence
  - 토글 칩: `🌑 다크` / `☀️ 라이트`. neutral inactive 스타일 (현재 모드 표시 용도)
- `src/app/globals.css`:
  - leaflet 줌·어트리뷰션 dark override 셀렉터를 `.tile-theme-dark` 자손으로 가드
  - 라이트 모드에선 leaflet 기본 (흰 배경) 그대로

## 검증
- 빌드 통과
- 토글 클릭 → 라벨/이모지 swap, tileSrc 즉시 변경 (CartoDB ↔ OpenStreetMap)
- localStorage 영속화 (다음 방문 시 마지막 선택 복원)
- 다크 모드: leaflet UI 다크. 라이트 모드: leaflet UI 기본 (흰 배경 + 검은 글씨)

## 다음 것
P2.2 PWA manifest, P2.5 URL 쿼리스트링 필터 상태.
