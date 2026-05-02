---
index: 09
slug: dark-theme-polish
date: 2026-05-02
phase: "Phase 2.4+ — 다크 테마 가독성 개선"
git_sha: e984d20 (dirty)
viewport: 390x844
state: "내 위치 활성, 명동성당 121m. 모든 비활성 칩 + Leaflet 줌 컨트롤 + 어트리뷰션 다크"
---

# 09 — 다크 테마 가독성 통일

08(다크 타일) 직후 발견된 문제: 비활성 칩들이 흰색 배경이라 다크 헤더에서 산만, Leaflet 줌 컨트롤·어트리뷰션도 흰색으로 둥둥 떠있음. 한 번에 다크로 통일.

## 변경 전 (08)
- 비활성 칩: `bg-white text-neutral-700 ring-neutral-300` (흰 배경)
- 줌 컨트롤: 기본 흰색
- 어트리뷰션: 기본 반투명 흰색

## 변경 후 (09)
- **비활성 칩**: `bg-neutral-800 text-neutral-200 ring-neutral-700 hover:bg-neutral-700` — 다크 그레이
- **활성 칩**:
  - 전체: `bg-white text-neutral-900` — 흰색으로 invert (가장 강한 selected 표현)
  - 일반/재활용: 기존 색별 (파랑/초록)
  - 위치 끄기: sky-500
  - 격자: amber-500
  - 지도 탭하세요: violet-500
- **Leaflet 줌 컨트롤**: `bg-#171717 + text-#e5e5e5` (`!important`로 leaflet 기본 override)
- **Leaflet 어트리뷰션**: `bg-rgba(23,23,23,0.85) + text-#d4d4d4`, 링크 `#93c5fd` (sky-300)

## 보이는 것
- 헤더·필터바·지도·줌·어트리뷰션 모두 같은 다크 그레이 그라데이션
- 활성 상태가 시각적으로 한눈에 잡힘 (전체=흰 / 위치=sky)
- 비활성은 차분히 뒷자리, 흰색 panopticon 효과 사라짐
- 보라/파랑 마커, 주황 강조 ring은 그대로 (다크 위 더 도드라짐)

## 함정
- Leaflet 기본 CSS와 same-specificity 충돌. 우리 globals.css가 import 순서상 뒤이지만 some build pipeline에서 override 안 먹는 케이스 있음 → `!important`로 강제. Tailwind v4의 `@layer` 정책 영향 가능.
- 비활성 색은 `bg-neutral-800` 단일 토큰으로 통일하고 page.tsx/FilterChips/LocateButton 모두 같은 클래스 사용 — 향후 라이트/다크 토글 도입 시 한 번에 바꾸기 쉬움.

## 다음 것
P2.2 PWA manifest, P2.5 URL 필터 상태 공유. (선택) 라이트/다크 타일 토글.
