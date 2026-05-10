---
date: 2026-05-10
git_sha: 7781c2b
viewport: 390x844
url: http://localhost:3000
phase: P2.24
title: Liquid Glass 디자인 언어 (HUD/검색/status/토스트)
---

# 45 — Liquid Glass

Apple iOS/iPadOS 26 Liquid Glass 시각 언어를 6개 floating UI 표면에 적용. CSS-only 토큰 시스템.

## 토큰 (`globals.css`)

- `.glass-surface` — light `rgba(255,255,255,0.62)` + `backdrop-blur(24px) saturate(180%)` + 두 줄 inset shadow(top highlight + bottom shade) → 유리 두께 환영. dark `rgba(23,23,23,0.55)` + `saturate(160%)`.
- `.glass-surface-strong` — input/dropdown처럼 텍스트 가독성 우선 표면. light 0.82 / dark 0.78.
- `.glass-toast` — 짧은 노출에 더 강한 blur(28px). 색 tint(red/emerald/violet/rose/white)는 배경 alpha로 분리.
- `prefers-reduced-transparency` 감지 → 자동으로 alpha 0.95~0.98 + blur 제거 fallback.

## 적용 표면

| # | 표면 | 토큰 |
|---|---|---|
| 1 | 좌상단 필터 floating group | `glass-surface` |
| 2 | 우상단 모드 stack (즐겨찾기/거리/나침반/테마/공유/셀렉터) | `glass-surface` |
| 3 | 좌하단 메뉴 칩 한 줄 (route segment + speed slider) | `glass-surface` |
| 4 | 검색박스 input + dropdown | `glass-surface-strong` |
| 5 | 우하단 status 카드 (collapsed + expanded) | `glass-surface` |
| 6 | 토스트 (info/error/emphatic) + 탭 모드 배너 + 첫 onboarding 토스트 | `glass-toast` + `glass-surface-strong` |

## 활성 칩 색 identity 보존

부모 glass surface가 반투명이라 자식 활성 칩이 `15% fill`이면 색이 sub-saturated 돼 affordance 손실. 5색 accent를 `solid 85%`로 강화:

- `bg-amber-500/85 text-white ring-1 ring-amber-300` (light)
- `dark:bg-amber-400/80 dark:text-neutral-950 dark:ring-amber-200` (dark — ring이 밝아 텍스트는 어둡게)
- 4색 모두 동일 패턴 (sky/violet/emerald/violet)

## 4 시나리오 (1차)

| 파일 | 상태 |
|---|---|
| `screenshot-light-default.png` | 라이트 기본 — 6 표면 모두 배치된 정적 상태 |
| `screenshot-dark-default.png` | 다크 기본 — alpha 0.55에서 마커 식별 가능, 텍스트 가독성 OK |
| `screenshot-light-status-open.png` | 우하단 status 카드 펼쳐 자치구 7행 + 출처 노출 |
| `screenshot-light-search-dropdown.png` | 검색박스에 "명동" 입력 → glass-surface-strong dropdown 노출, 항목 hover OK |

## 4 시나리오 (2차 — extension)

P2.24 머지 직전, 사용자가 "지도 위 컴포넌트 뿐만 아니라 전체 모든 컴포넌트에 적용" 요청 → header / 헤더 테마 토글 / DistrictSelector 그리드 패널 / Leaflet popup 4 표면 추가 적용. 동일 토큰 재사용.

| 파일 | 상태 |
|---|---|
| `screenshot-light-extended.png` | 라이트 + 헤더에 glass-surface 적용된 상태 |
| `screenshot-dark-extended.png` | 다크 + 헤더 glass — 마커 색·가독성 OK |
| `screenshot-light-district-grid.png` | 우상단 🗺 셀렉터 panel 열린 상태 — 5x5 grid가 glass-surface |
| `screenshot-light-popup.png` | 마커 클릭 시 Leaflet popup wrapper에 glass-surface-strong 적용 |

## 결정 이력

- 6 표면 vs HUD 4 vs 2개 → 사용자 결정으로 6개 (시각 일관성 우선)
- CSS-only vs SVG turbulence → CSS-only (perf 안전, 95% 시각 임팩트)
- 활성 칩 alpha 0.15 → 0.85 (색 identity 보존)
- 다크 alpha 0.55 (텍스트 대비 확보 + saturate 160%)
- toast tint는 배경에서, blur는 토큰에서 분리 (한 토큰으로 5 variant 통합)

## 함정

- Tailwind v4 `@layer components`에서 다크 변형은 `.dark .glass-surface { ... }`로 명시. utility의 `dark:bg-*`는 토큰 내부에 못 박는다.
- 부모가 glass면 자식 활성 칩 `15% fill`은 색이 죽음. solid 85%로.

## Spec / Plan

- spec: `docs/superpowers/specs/2026-05-10-p2-24-liquid-glass-design.md`
- plan: `docs/superpowers/plans/2026-05-10-p2-24-liquid-glass.md`
