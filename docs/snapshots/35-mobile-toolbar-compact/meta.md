---
index: 35
slug: mobile-toolbar-compact
date: 2026-05-06
phase: "P2.22"
git_sha: 7d68481e0c8166d9dedb7c3d9982feb92da14253
viewport: 390x844
---

# 35 — 모바일 툴바 압축 + 줌·출처 위치 정리

모바일에서 메뉴 영역이 화면의 거의 절반을 차지하던 문제를 해결. 칩 텍스트를 아이콘으로 줄이고 의미 단위(필터·경로·보기)로 묶어 3행으로 정리. Leaflet 줌은 좌하단, 데이터 출처는 우하단으로 이동시켜 지도 가시 영역을 확보.

## 보이는 것
- **3개 시각 그룹**: [전체/일반/재활용/☆] | [📍/1️⃣🎯/2️⃣🏁/📏/4km/h] | [🧭/☀️/🔗]. 데스크톱에선 그룹 사이 세로 divider, 모바일에선 자연스러운 wrap 경계로 구분.
- **아이콘 only 칩**: 📍·📏·1️⃣🎯·2️⃣🏁·🧭·☀️·🔗는 텍스트 제거, `aria-label` + `title` 보강으로 a11y 보존.
- **줌 컨트롤 좌하단**: react-leaflet `<ZoomControl position="bottomleft" />` 명시. `+ / -`가 기본 N 컴퍼스(head-up 모드용) 위에 자리.
- **데이터 출처 우하단**: 📊 공공데이터포털 · v2026-05-05 — Leaflet OSM/CARTO attribution 위 28px(`bottom-7 right-2`)에 stack.
- **상단 영역 차지율**: 헤더 + 검색 + 3개 칩 그룹 + 통계 + 자치구 breakdown ≈ 280/844 → ~33%. 이전 ~50%에서 17%p 감소, 지도 영역 그만큼 확대.

## 무엇이 끝났나
- `LocateButton`/`ShareButton` 컴포넌트 아이콘 only로 단순화 (텍스트 → aria-label/title)
- `page.tsx` 거리모드/출발/목적지/방향/테마 칩 텍스트 제거 (의미는 색·이모지로 보존)
- 즐겨찾기 칩에서 "즐겨찾기" 단어 제거, `★ N` count만 노출
- 칩 영역을 `gap-1.5` 3개 sub-div로 그룹화, 그룹 사이 hidden-on-mobile divider 추가
- `MapContainer`에 `zoomControl={false}` + `<ZoomControl position="bottomleft" />` 명시
- `bun run build` 통과, 138 tests pass

## 다음 것
- P2.18 통계바 정보 분리 (에러 토스트 분기) 또는 P2.19+P2.21 hidden feature 안내 묶음 PR
- P3.3 자치구 셀렉터 / 빈 데이터 구 안내
