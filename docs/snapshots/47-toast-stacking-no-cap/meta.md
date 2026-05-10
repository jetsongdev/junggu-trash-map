---
index: 47
slug: toast-stacking-no-cap
date: 2026-05-10
phase: P2.25
git_sha: eae7f86 (clean)
viewport: 390x844
url: http://localhost:3000
title: 토스트 stacking — 한도 없음 (5장 데모)
---

# 47 — 토스트 stacking 한도 제거

`46-toast-stacking-queue` 다음 라운드. cap=3 정책을 제거해 토스트가 임의 N개까지 자연스럽게 쌓이도록 변경. 코드 측면에서는 7파일 +37 / −60으로 더 단순해진 refactor — `MAX_VISIBLE_TOASTS` 상수 제거, `pushToast` 반환 shape `{ next, evictedIds }` → `ToastItem[]`, page.tsx의 evicted-timer cleanup 루프 제거.

## 보이는 것

### `screenshot-stacked-5.png` — 5장 stacking 데모 (synthetic)
이전 46번이 3장에서 잘리던 cap=3 가정을 보여줬다면, 47번은 cap을 떼고 5장을 동시에 띄워 "한도 없음" 시각 contract을 기록한다.

샘플 (위→아래 chronological):
1. emphatic — `✅ 전체 7개 자치구 802개 휴지통 로드 완료`
2. info — `✓ 통과한 휴지통은 ☆로 즐겨찾기에 모아볼 수 있어요`
3. info — `🧭 현재 보행 속도: 4 km/h (통상 보행)`
4. info — `🗺 헤드업 모드 — 지도가 시선 방향으로 회전합니다`
5. info — `📏 격자 거리 — 보행로 따라 가는 가까운 추정`

5장 모두 viewport 안에 들어가고 `glass-toast` backdrop-blur가 누적돼 뒤 지도가 자연스럽게 흐려진다. 각 카드 사이 8px gap (`gap-2`).

> ⚠️ 46번과 동일하게 **synthetic injection** — `browser_evaluate`로 실제 toast render 구조와 동일한 DOM을 직접 주입해 캡처. fade-in transition은 생략(`opacity-100` 고정), 레이아웃·간격·색은 production render와 100% 일치. 실 사용자 흐름에서 5장 동시 stacking은 system-driven 이벤트가 매우 가까운 시점에 fire되는 드문 케이스에서만 발생.

## 왜 cap 제거

- 각 토스트가 자기 `durationMs`(1.8s/4s/6s)만큼 살아있다 자연 dismiss → stack 깊이가 자연 발산하지 않음
- 인위적 cap은 latest signal 손실. 디버깅 노이즈("왜 이 안내는 안 떴지?")만 늘어남
- 코드도 단순해짐: `pushToast`는 한 줄, 호출처는 evicted-timer cleanup 루프 0줄

## 무엇이 끝났나

- `src/lib/toast-queue.ts` — `MAX_VISIBLE_TOASTS` 제거, `pushToast` 반환 shape 단순화 (`ToastItem[]`)
- `src/lib/__tests__/toast-queue.test.ts` — eviction 케이스 → "stacks beyond 3 without dropping anything" 5개 스택 테스트로 교체
- `src/app/page.tsx` `showToast` — evicted-timer cleanup 루프 제거 (이제 evict 안 일어남)
- `CHANGELOG v0.22.0` / `docs/tasks.md` P2.25 / `docs/snapshots/46/meta.md` 모두 "한도 없음"으로 갱신

## 다음 것

- preview 검수 → squash merge로 v0.22.0 production
- 쌓아둔 후속 task: P3.5 (자치구 전환 시 origin/dest 초기화), P2.26 (zoom 사용자 위치 기준), P4.1 (타 종류 통)
