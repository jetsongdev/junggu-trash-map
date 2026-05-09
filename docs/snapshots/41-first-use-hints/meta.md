---
index: 41
slug: first-use-hints
date: 2026-05-09
phase: P2.19+P2.21
git_sha: 92b3b30 (dirty)
viewport: 390x844 (mobile, dark)
---

# 41 — P2.19+P2.21 첫-사용 힌트 5종 + 토스트 모달 재배치

처음 사용하는 기능 5개에 대해 1회씩 4초 안내 토스트가 화면 정중앙 모달 형태로 뜨도록 추가. 같은 PR에서 토스트 시각 언어를 하단 pill에서 중앙 투명 모달(/35 bg + backdrop-blur-xl)로 재정의했고, "전체 N개 자치구 N개 휴지통 로드 완료" emphatic 토스트만 상단(`top-16`)으로 분리해 초기 로딩 오버레이(중앙)와 위치 충돌 회피.

## 캡처 (각 hint 화면 정중앙)

| 파일 | 메시지 |
|------|-------|
| `screenshot-share.png` | 🔗 공유 버튼으로 이 경로를 공유할 수 있어요 |
| `screenshot-favorite.png` | ★ 즐겨찾기에 추가됐어요. 우상단 별 칩으로 즐겨찾기만 볼 수 있어요 |
| `screenshot-headsup.png` | 🧭 헤드업: 지도가 시선 방향으로 회전합니다. 한 번 더 누르면 끕니다 |
| `screenshot-grid.png` | 📏 격자: 직선 대신 도로 격자 거리로 ETA를 계산합니다 |
| `screenshot-speed.png` | 🚶 현재 4 km/h (통상 보행). 2~7 km/h로 조절할 수 있어요 |

각 PNG에는 토스트만 합성되도록 DOM에 inline-style 모달을 주입해 캡처 (P3.3-fix1과 같은 timing 충돌 회피). 실제 앱에서는 React state로 4초 후 자동 dismiss.

## 트리거 (실제 앱)

- **share** — `userLocation && destination` 첫 동시 set 시 (useEffect)
- **favorite** — 첫 ☆ 추가일 때만 (size 증가, 제거에는 X)
- **headsUp** — `cycleLocate`에서 `compassMode === 'cone'` → `'head-up'` 전환 시
- **grid** — `setDistanceMode` `'euclidean'` → `'manhattan'` 전환 시
- **speed** — `setSpeedSliderOpen(true)` 첫 진입 시

## 시각 토큰

- 컨테이너: `fixed inset-0 flex items-center justify-center`, `pointer-events-none`
- 인너 박스: `max-w-sm rounded-2xl bg-white/35` + `backdrop-blur-xl` + `shadow-lg` + `ring-1 ring-white/40`
- 다크: `dark:bg-neutral-900/35 dark:text-neutral-50 dark:ring-neutral-700/40`
- 텍스트: `text-sm font-medium text-neutral-900` (info), `font-semibold text-white` (error/emphatic)
- error: `bg-red-500/40` / emphatic: `bg-emerald-500/40`

## 충돌 회피 두 축

1. **timing** — `maybeShowHint(key)` 진입 시 `toastTimerRef.current != null`이면 skip + markSeen 안 함. onboarding(6s) / 802 자치구 완료(4s) / error(6s) 표시 중엔 hint 발사 안 됨. 다음 트리거 때 재시도.
2. **공간** — `ToastPosition: 'center' | 'top'` 추가. "전체 N개 자치구 N개 휴지통 로드 완료" emphatic만 `'top'`(`top-16`) 사용해 자치구 로드 진행 오버레이(중앙)가 dismiss되자마자 같은 자리에서 morph되던 시각 충돌 해소.

## 코드

- `src/lib/first-use-hints.ts` — `HintKey` / `HINT_MESSAGES` / `HINT_DURATION_MS` (4000ms) / `hasSeenHint(key, storage)` / `markHintSeen(key, storage)`
- `src/lib/__tests__/first-use-hints.test.ts` — vitest 8개 (read·write·isolation·storage prefix·throw fail-closed·duration)
- `src/app/page.tsx` — `maybeShowHint(key)` 헬퍼 + 5 트리거 wiring (useEffect 1, 핸들러 4) + ToastPosition + 모달 스타일
- `CHANGELOG.md` `[Unreleased]` 2 줄 (Added P2.19+P2.21 / Changed 토스트 모달화)

## 알려진 trade-off

URL-driven origin+dest로 진입한 첫 mount에서 share hint이 onboarding과 충돌해 발사 skip → 이번 세션엔 안 뜸. 공유 URL로 도착한 사용자는 이미 공유 기능 인지하므로 수용.

## 다음

P3.4 자치구 폴리곤 outline / P4.1 타 종류 통 / I.6 a11y / P3.3-fix1 (별도 세션)
