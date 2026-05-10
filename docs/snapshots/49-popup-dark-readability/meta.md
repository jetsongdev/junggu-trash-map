---
index: 49
slug: popup-dark-readability
date: 2026-05-10
phase: P2.27
git_sha: cdf390a (pre-merge)
viewport: 390x844
url: http://localhost:3010
title: BinPopup 다크 모드 가독성 보강
---

# 49 — BinPopup 다크 모드 가독성 보강

P2.24 Liquid Glass 적용 후 다크 모드에서 `BinPopup`의 본문 텍스트가 거의 안 보이던 회귀를 좁게 막은 라운드. 컴포넌트가 `text-neutral-900/700/500`만 들고 있어서 `dark:` 변형이 없어 검정 텍스트가 다크 popup wrapper(`rgba(23,23,23,0.82)`) + 그 뒤 다크 타일에 그대로 묻혔다. 두 곳을 동시에 손봤다 — (1) 컴포넌트 텍스트에 `dark:` 변형 추가, (2) `globals.css`의 `.dark .leaflet-popup-content-wrapper` alpha 0.82 → 0.92 로 약간 상향해 잔존하는 lab(98) 흰 텍스트의 contrast를 확실히 끌어올렸다. 라이트 모드는 손대지 않음.

## 보이는 것

`screenshot.png` — 다크 테마, 마커 한 개 클릭해서 popup 펼친 상태:

- 제목 `을지로3가, 중부시장 버스정류장 02-166` — 거의 흰색(`dark:text-neutral-50`, lab(98.26 0 0))으로 또렷이 읽힘
- `🚌 일반쓰레기` 칩 — 변경 없음 (원래 색별 fill이라 양 모드 OK)
- 주소 `서울특별시 중구 을지로 210` — `dark:text-neutral-100`로 light gray
- `버스정류장` (location hint, no kakao 케이스) — `dark:text-neutral-100`
- `관리: 서울특별시 중구청 · 02-3396-5482` — `dark:text-neutral-300` + `dark:border-neutral-700` 분리선

비교 기준: 사용자가 보고한 동일 viewport 다크 popup 캡처(첨부 이미지) — 동일 위치에서 제목·주소·관리자 라인이 다크 배경에 묻혀 안 읽힘.

## 무엇이 끝났나

- `src/components/BinPopup.tsx` — 7곳에 `dark:` 변형 추가
  - 제목 `text-neutral-900` + `dark:text-neutral-50`
  - 즐겨찾기 ☆ 비활성 hover 톤 다크 분기 (`dark:text-neutral-400 dark:hover:text-amber-300`)
  - locationHint kakao body / "근처: " 라벨 / kakao 태그 3 단계 톤 분기
  - locationHint 일반 body, 주소 fallback, detail, manager 분기
  - manager 영역 분리선 `dark:border-neutral-700`
- `src/app/globals.css` — `.dark .leaflet-popup-content-wrapper` background `rgba(23,23,23,0.82)` → `0.92`, border 톤 `0.12` → `0.14`. tip도 같이 0.92.
- 라이트 popup wrapper / tip / `glass-surface*` 토큰은 변경 없음 (라이트 모드는 OK라는 사용자 확인)

## 다음 것

- preview 검수 → squash merge → v0.22.x patch
- 후속: P3.5 자치구 전환 reset, P2.26 zoom anchor, P4.1 타 종류 통
