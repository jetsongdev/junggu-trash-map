---
index: 44
slug: toast-tap-banner-unified
date: 2026-05-10
phase: P2.19+P2.21 (toast/tap-banner unification)
git_sha: 65e5b9c (dirty)
viewport: 390x844 (mobile)
---

# 44 — 토스트 + 탭 모드 배너 통합 시각 언어

P2.19+P2.21 작업 후반에 토스트와 탭 모드 배너를 한 시각 언어로 통합. 모든 안내가 정중앙 투명 모달(`bg-{color}/20` + `backdrop-blur-xl` + `rounded-2xl` + 300ms fade in/out)로 통일됐고, "한 번 읽고 흘려보낼" 안내라는 시각 톤이 일관됨.

## 캡처

| 파일 | 시점 | 화면 |
|------|------|------|
| `screenshot-default.png` | 첫-사용 힌트·onboarding 모두 silenced 상태 | 깨끗한 지도 + HUD. 토스트/배너 0. 비교 baseline |
| `screenshot-tap-mode-origin.png` | 좌측 🎯 출발 탭 활성 | 화면 정중앙에 violet 톤 투명 모달("🎯 지도에서 출발 위치를 탭하거나 검색하세요") |
| `screenshot-tap-mode-destination.png` | 우측 🏁 목적지 탭 활성 | 화면 정중앙에 rose 톤 투명 모달("🏁 지도에서 목적지를 탭하거나 검색하세요") |

## 시각 토큰 (전체 토스트/배너 공통)

| 속성 | 값 |
|------|------|
| 위치 | `fixed inset-0 flex items-center justify-center px-6` |
| 모양 | `rounded-2xl max-w-sm px-6 py-4 text-center text-sm` |
| 배경 (info) | `bg-white/20` light, `dark:bg-neutral-900/20` |
| 배경 (error) | `bg-red-500/20` |
| 배경 (emphatic) | `bg-emerald-500/20` |
| 배경 (origin tap) | `bg-violet-500/20` |
| 배경 (dest tap) | `bg-rose-500/20` |
| Blur | `backdrop-blur-xl` |
| Shadow | `shadow-lg` |
| Ring | `ring-1 ring-white/{25-40}` |
| Text weight | info `font-medium` / 그 외 `font-semibold` |
| 자동 dismiss fade | toast: durationMs - 300ms 시점에 exiting flag → 300ms opacity 1→0 |
| 사용자 액션 fade | tap banner: deferred unmount — `displayedTapTarget` + `tapBannerShown` 두 state로 분리 |

## 두 fade 패턴

### 자동 dismiss (toast)
- `showToast(text, durationMs)` 가 두 timer 발사: fade-out trigger (durationMs - 300ms) + unmount (durationMs)
- `toast.exiting` flag → CSS opacity transition 1→0
- `toastShown` state → 첫 mount 후 rAF로 false→true 플립 (fade-in)

### 사용자 액션 기반 (tap banner)
- Deferred unmount: `tapTarget` falsy 즉시 → `tapBannerShown=false` (fade-out 시작) → 300ms 후 `displayedTapTarget=null` (실제 unmount)
- 진입: `displayedTapTarget` 즉시 set + double-rAF로 `tapBannerShown=true` (fade-in)
- 같은 fade 결과를 다른 트리거에서 자연스럽게

## 보조 fix — popup 깜빡임

같은 PR에 popup blink fix 포함. 토스트 state 변경 → page 리렌더 → marker/popup props 참조 변경으로 react-leaflet이 열린 popup을 update하던 시각 깜빡임. `useCallback`/`useMemo` surgical 안정화로 토스트만 변하는 리렌더에선 마커 트리 영향 없음. 별도 캡처 어려움(애니메이션 깜빡임).

## 코드 (P2.19+P2.21 PR #38 최종)

- `src/app/page.tsx` — `showToast` `useCallback` + 두 timer + `toast.exiting` 플래그 + `toastShown` rAF flip + tap banner deferred unmount useEffect
- `src/components/BinMarker.tsx` — `position`·`eventHandlers` `useMemo` (popup blink fix)
- `src/components/Map.tsx` — `highlightRanks`·`binsById` `useMemo`, `handleUse` `useCallback` (signature `(binId)`)
- `src/lib/first-use-hints.ts` + 8 vitest (P2.19+P2.21 본체)

## 다음

PR #38 머지 (mergeStateStatus CLEAN, prebump v0.20.0 자동 cut). 다음 후보: P4.1(타 종류 통), I.6 2차(추가 a11y 라운드).
