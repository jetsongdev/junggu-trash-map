---
captured: 2026-05-09
topic: Deferred unmount 패턴 — React에서 fade-out 후 unmount하는 두 가지 케이스
series-candidate: 정글 실험실
project: junggu-trash-map
---

# Deferred unmount 패턴 — React에서 fade-out 후 unmount하기

## 현장 메모

토스트/배너에 부드러운 fade in/out을 붙이려고 할 때 마주친 두 가지 케이스. 같은 패턴인데 트리거가 달라서 코드 모양이 달라진다.

### 케이스 1 — 자동 dismiss 토스트 (durationMs 기반)

토스트는 `showToast(text, durationMs)` 으로 표시 시간이 명시. 단순한 단일 setTimeout(durationMs)이면 한 번에 사라져 깜빡임.

**해결**:
```ts
// fade-out 트리거를 별도 타이머로 분리
toastFadeOutRef.current = window.setTimeout(() => {
  setToast(prev => prev ? { ...prev, exiting: true } : null);
}, durationMs - 300);
toastTimerRef.current = window.setTimeout(() => {
  setToast(null);
}, durationMs);
```

JSX는 `transition-opacity duration-300` + 조건부 `opacity-0` 클래스. exiting flag 켜지면 CSS가 알아서 transition.

표시 시간 자체는 그대로 유지 — fade는 마지막 300ms 안에서 진행.

### 케이스 2 — 사용자 액션 기반 배너 (state truthy/falsy 토글)

탭 모드 배너 ("🎯 지도에서 출발 위치를 탭하세요") 같은 경우는 `tapTarget` state가 사용자 액션으로 즉시 변함. 단순히 `tapTarget === null` 시 unmount하면 fade-out 들어갈 시간이 없음.

**해결 — Deferred unmount**:
```ts
const [displayedTapTarget, setDisplayedTapTarget] = useState(null);
const [tapBannerShown, setTapBannerShown] = useState(false);

useEffect(() => {
  if (tapTarget) {
    // 진입: displayed 즉시 set + 다음 paint에 visible true
    setDisplayedTapTarget(tapTarget);
    setTapBannerShown(false);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setTapBannerShown(true))
    );
  } else {
    // 해제: visible false → 300ms 후 displayed null (실제 unmount)
    setTapBannerShown(false);
    const t = setTimeout(() => setDisplayedTapTarget(null), 300);
    return () => clearTimeout(t);
  }
}, [tapTarget]);
```

핵심: **state 두 개로 분리**.
- `displayedTapTarget` = "지금 DOM에 그려야 하는가" (mount 제어)
- `tapBannerShown` = "지금 보여야 하는가" (opacity 제어)

CSS transition이 0 → 1 → 0 까지 완주할 시간을 주고 그 후 unmount.

### 함정

**double rAF**: 단일 `requestAnimationFrame` 으로 `setTapBannerShown(true)` 하면 React batching으로 `setDisplayedTapTarget(tapTarget)` 와 같은 commit에 묶일 수 있음. 그러면 첫 paint가 opacity-0이 아니라 opacity-1로 시작 → fade-in 안 보임. 한 번 더 rAF 감싸서 paint 분리 보장.

**maybeShowHint 가드**: 첫-사용 힌트는 다른 토스트 활성 중엔 skip하는데, fade-out 중에도 `toastTimerRef.current != null` 유지해서 hint이 fade-out 위에 fade-in으로 겹치지 않게 막음. 토스트 슬롯이 "완전히 비었을 때만" 다음 hint 발사.

### 발견한 사이드 버그

토스트 시스템 손보다가 발견: **휴지통 마커 클릭 → popup 띄운 상태에서 다른 토스트(예: 첫-사용 힌트) 발사되면 popup이 깜빡인다**.

원인 추정: toast state 변경 → page 컴포넌트 re-render → React-Leaflet의 marker/popup도 영향받음. Leaflet popup은 React 트리 밖에서 관리되므로 DOM이 detach/reattach 되거나 popup 내부 컴포넌트가 unmount/remount.

해결 후보:
- `BinPopup` 의 props 안정화 (참조 동일성 유지)
- popup 컨테이너에 `key` 고정해서 React가 unmount 안 하게
- 토스트 렌더 자체를 다른 React tree(portal)로 분리해서 marker layer에 영향 안 가게

→ 별도 fix 라운드 필요.

## 다음 단계

- [ ] jetsong-dev 아이디어 등록됨: `docs/content-ideas/3-lab/2026-05-09-deferred-unmount-react-fade.md`
- [ ] popup 깜빡임 버그 별도 fix
- [ ] 초안 작성 시 이 파일 참고 — 두 케이스 코드 스니펫 + double rAF 함정 강조
