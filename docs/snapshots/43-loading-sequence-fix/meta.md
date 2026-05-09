---
index: 43
slug: loading-sequence-fix
date: 2026-05-09
phase: P2.19+P2.21 (toast sequencing fix)
git_sha: 1953f30
viewport: 390x844 (mobile)
---

# 43 — 첫 로딩 토스트 시퀀스 검증 (overlay → top → center)

사용자가 첫 방문 시 자치구 로드 오버레이(중앙)와 onboarding 토스트(중앙)가 같은 자리에 겹쳐 뜨는 시각 버그를 보고. fix는 onboarding `useEffect`에 `showLoadingOverlay === true || toast !== null` 가드 두 개 추가 — 로드 진행 + 802 완료 토스트가 끝날 때까지 onboarding 보류. 이 스냅샷은 fix 후 세 phase가 어느 시점에도 시각적으로 겹치지 않음을 검증.

## 캡처

| 파일 | 시점 | 화면 |
|------|------|------|
| `screenshot-1-loading-overlay-only.png` | manifest 로드~자치구 로드 진행 중 | **중앙**: 자치구 로드 (3/7) 오버레이 단독. 토스트 없음. |
| `screenshot-2-top-toast-alone.png` | 자치구 모두 로드 직후 | **상단**: "전체 7개 자치구 802개 휴지통 로드 완료" emerald 모달 단독. 중앙 비어있음. |
| `screenshot-3-onboarding-alone.png` | 802 토스트 4초 후 | **중앙**: "🎯 출발과 🏁 목적지를 정하면 경유 휴지통을 알려드려요" emerald 모달 단독. 상단 비어있음. |

## 캡처 방법 — phase 1 합성 주의

phase 2/3은 자연 발화 — localStorage 비우고 navigate, 각 phase의 텍스트("로드 완료" / "출발과")를 `wait_for`로 잡아 캡처. phase 1(오버레이)은 로컬 dev 환경에서 districts JSON이 너무 빨리 로드돼 안정적으로 캡처하기 어려움 (P3.3-fix1 관련 함정 — 토스트 timing이 Playwright capture와 충돌). 대신 실제 오버레이 컴포넌트의 DOM 구조를 inline-style로 합성해 주입 후 캡처. 시각적으로 동일하지만 React state로 발화한 게 아니라 DOM 직접 주입.

## 트리거 (코드)

```ts
useEffect(() => {
  if (onboardingFiredRef.current) return;
  if (!manifest) return;
  if (typeof window === 'undefined') return;
  if (showLoadingOverlay) return;       // 로드 오버레이 dismiss까지 대기
  if (toast !== null) return;           // 다른 토스트 슬롯 점유 중엔 대기
  onboardingFiredRef.current = true;
  if (window.localStorage.getItem('onboarded') === 'true') return;
  window.localStorage.setItem('onboarded', 'true');
  showToast('🎯 출발과 🏁 목적지를 정하면 경유 휴지통을 알려드려요', 6000, 'emphatic');
}, [manifest, showLoadingOverlay, toast]);
```

## 시퀀스

```
T = 0          → 마운트
T ≈ 500ms      → manifest 로드 → showLoadingOverlay = true → 오버레이 (중앙)
                  ⛔ onboarding skip (showLoadingOverlay)
T = N          → 7/7 districts loaded → showLoadingOverlay = false
                  + 802 완료 토스트 fire (top, 4s emphatic)
                  ⛔ onboarding skip (toast !== null)
T = N + 4s     → toast slot null
                  ✅ onboarding fire (center, 6s emphatic)
T = N + 10s    → onboarding dismiss → 정상 사용
```

세 단계 모두 화면에 한 가지만 보임. 이전 BUG 스크린샷(중앙 오버레이 + 중앙 onboarding 겹침)과 비교해 시각 충돌 0.

## 보너스 — 토스트 position 분기

이 fix의 전제 조건: 802 완료 토스트가 `'top'` position 사용. 그 자체로도 오버레이와 같은 자리 겹침 회피하지만, onboarding은 `'center'`이므로 별도 시간 게이트 필요 — fix 두 축이 시너지.

## 다음

- 사용자 검수 후 PR #38 머지 진행
- 캐시 미스 케이스(브라우저 cache cold start) 시 phase 1 길이가 어떤지 별도 검증 — 모바일/iPad에서 첫 방문 더 잘 잡힘
