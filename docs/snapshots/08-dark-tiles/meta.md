---
index: 08
slug: dark-tiles
date: 2026-05-02
phase: "Phase 2.4 — CartoDB Dark Matter 타일 전환"
git_sha: e984d20
viewport: 390x844
state: "다크 타일 + 격자 모드(localStorage 잔존) + 내 위치 명동성당, 154m"
---

# 08 — CartoDB Dark Matter 타일

OSM Light Standard → **CartoDB Dark Matter**로 교체. 다크 헤더(`bg-neutral-950`)와 라이트 지도 사이 콘트라스트가 거슬리던 부분 해결. 한 줄 변경.

## 보이는 것
- 지도 배경이 거의 검정(`#1a1a1a` 톤). 도로·강·공원 같은 윤곽선이 회색·녹색 흐릿하게
- 마커가 다크 위에서 더 도드라짐 — 보라(혼합) 56개, 파랑(일반-only) 3개, 주황 강조 ring 1개
- 어트리뷰션: "Leaflet | © OpenStreetMap contributors © CARTO" (Carto 정책 준수)
- 사용자 위치 펄스 점(sky)도 다크 배경에 더 잘 보임
- (이번 캡처는 `localStorage['distanceMode']`가 'manhattan'으로 잔존해 격자 모드 active — L자 거리 선 함께 노출)

## 변경
- `src/components/Map.tsx` `<TileLayer>`:
  - `url`: `https://tile.openstreetmap.org/{z}/{x}/{y}.png` → `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
  - `attribution`: OSM + CARTO 공동 표기
  - `subdomains`: `'abcd'` 추가 — Carto 4-shard 분산
  - `maxZoom`: 19 → 20 (Carto 지원)
  - `{r}` placeholder: retina 화면에서 `@2x` 자동 (Leaflet 1.4+)

## 검증
- `bun run build` 통과
- `.leaflet-tile-loaded` 15개 (실제 타일 fetch 성공)
- 첫 타일 src 확인: `https://a.basemaps.cartocdn.com/dark_all/16/55885/25379.png`

## 다음 것
- P2.2 PWA manifest + 홈화면 추가 프롬프트
- P2.5 URL 쿼리스트링 필터 상태 공유
- (선택) 라이트/다크 타일 토글 — 기본 다크, 야외에서 더 잘 보고 싶을 때 라이트로
