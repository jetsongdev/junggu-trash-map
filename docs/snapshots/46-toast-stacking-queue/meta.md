---
index: 46
slug: toast-stacking-queue
date: 2026-05-10
phase: P2.25
git_sha: 4616972 (clean)
viewport: 390x844
url: http://localhost:3000
title: 토스트 stacking 큐 — 한도 없음, position별 독립 stack
---

# 46 — 토스트 stacking 큐

P2.25는 single `toast` state → array 모델 전환. 빠른 연속 트리거 시 직전 토스트가 덮이던 문제를 해결한다. 동시 표시 한도는 두지 않는다 — 사용자 가시 안내는 자기 duration만큼 살아있다 사라지는 게 자연스럽고, 인위적인 cap은 latest signal 손실을 만든다. 기본 상태(토스트 0장)에서는 시각 회귀가 없고, 실제 가치는 다중 토스트 stacking 레이아웃이 어떻게 보이는지에 있다 — 그래서 default · stacked 두 장으로 기록 (stacked 캡처는 3장이지만 임의 N개도 같은 패턴).

## 보이는 것

### `screenshot-default.png` — 기본 상태
지도가 막 로드된 직후, 토스트 0장. P2.24 Liquid Glass 톤·HUD·status 카드 모두 그대로. 회귀 없음 확인용 베이스라인.

### `screenshot-stacked.png` — 3장 stacking 데모 (synthetic)
P2.25의 실제 visual contract — `flex-col items-center gap-2`로 위→아래 chronological. 가장 위 = 가장 오래된 토스트, 아래 = 새 것. position `'center'` stack 기준 viewport 정중앙에 배치.

샘플 콘텐츠:
1. (top) emphatic — `✅ 전체 7개 자치구 802개 휴지통 로드 완료` (실제 `allLoadedToastFiredRef` 메시지)
2. (mid) info — `✓ 통과한 휴지통은 ☆로 즐겨찾기에 모아볼 수 있어요` (favorite 첫-사용 힌트 톤)
3. (bottom) info — `🧭 현재 보행 속도: 4 km/h (통상 보행)` (speed 첫-사용 힌트 톤)

> ⚠️ 이 장은 **synthetic injection** — `browser_evaluate`로 실제 toast render 구조와 동일한 DOM(`glass-toast` + variant별 `bg-*-500/20` ring)을 `pointer-events-none absolute z-[1001]` 컨테이너에 직접 주입해 캡처. 실제 page 코드의 `setToasts` 경로를 거치지 않아 fade-in transition은 생략(`opacity-100` 고정). 레이아웃·간격·색은 production render와 100% 일치 (같은 Tailwind 클래스).

실제 사용자 흐름에서 다중 stacking은 흔치 않다 — `maybeShowHint`이 `toasts.length > 0`이면 skip해서 hint끼리는 직렬화되고, 보통 stacking은 system-driven 이벤트(여러 자치구 lazy-load 완료가 가까운 시점에 fire되는 경우)에서 발생한다. snapshot은 그 레이아웃 contract을 보여주는 reference.

## 무엇이 끝났나

- `src/lib/toast-queue.ts` 순수 모듈 — `pushToast`/`markExiting`/`removeToast`. `pushToast`는 `[...list, item]` 단순 append (한도 없음).
- `src/lib/__tests__/toast-queue.test.ts` — vitest 8 케이스 (push to empty/2, 5개 stacking, ordering, markExiting/removeToast id 일치/불일치)
- `src/app/page.tsx` state 교체 — `toast | null` → `toasts: ToastItem[]`, `toastShown: boolean` → `toastsShown: Set<number>`, 단일 `toastTimerRef`/`toastFadeOutRef` → `toastTimersRef: Map<id, {fade, unmount}>`
- `showToast` 재작성 — id ref-counter, pushToast로 append, 각 토스트 fade·unmount per-id 스케줄
- 게이트 통일 — onboarding `toast !== null` → `toasts.length > 0`, `maybeShowHint` 동일 (deps에 toasts 추가)
- Render — `(['top', 'center'] as const).map(...)` per-position 독립 stack, `flex-col items-center gap-2`

## 동시 표시 한도

두지 않는다. 각 토스트는 자기 `durationMs`(1.8s/4s/6s)만큼 살아있다 자연스럽게 사라지므로 stack 깊이는 자연 발산하지 않는다. 한도(예: 3장)를 두면 latest signal이 손실되고, "왜 이 안내는 안 떴지?" 디버깅 노이즈만 늘어난다.

## 다음 것

- preview에서 실 stacking 검수 (system-driven 다중 자치구 로드 시점) — `https://junggu-trash-map-git-feat-p225-toast-queue-jetsongdev.vercel.app`
- OK면 `release:minor` 라벨로 PR open → squash merge
- 다음 후보: P4.1 타 종류 통 합치기 (담배꽁초·의류수거함·폐의약품함)
