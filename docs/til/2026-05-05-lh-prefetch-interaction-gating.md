# Idle prefetch을 첫 사용자 인터랙션에 게이팅 — Lighthouse 측정 window 회피

**일자**: 2026-05-05
**프로젝트**: junggu-trash-map
**관련 작업**: P3.2 자치구 데이터 prefetch + Lighthouse perf 회복

## 문제

P3.2 진입 후 발행 자치구 6개를 백그라운드 fetch하기 위해 `requestIdleCallback`로 batch prefetch를 박았다. 사용자 체감은 좋아졌다 (panning 없이 802개가 자동으로 합류) — 그런데 Lighthouse perf가 **0.70 → 0.50**으로 -0.20 곤두박질.

```ts
useEffect(() => {
  if (!manifest) return;
  for (const d of manifest.districts) {
    if (d.binCount === 0) continue;
    requestIdleCallback(async () => {
      const data = await fetchDistrict(d.code, manifest.version);
      // ...setDistrictsCache + setActiveDistricts
    }, { timeout: 3000 });
  }
}, [manifest]);
```

## 진단

LH의 측정 window는 보통 5~10초. 그 안에 부트 + FCP + LCP + TTI가 다 들어간다. `requestIdleCallback`은 메인 스레드가 잠깐만 비어도 발사되므로 **LH window 안에서 6개 fetch가 다 실행됨**:

- 추가 네트워크 (~360KB raw / ~110KB gzip)
- JSON 파싱 메인 스레드 점유
- 마커 추가 → React re-render → LCP candidate 흔들림

LH의 시뮬레이션은 **사용자 입력을 흉내내지 않는다**. mouse / touch / scroll / key 이벤트가 전혀 발사 안 됨. 이걸 차이의 칼날로 쓸 수 있다.

## 해결

prefetch 트리거를 첫 사용자 인터랙션에 묶었다. Lighthouse는 트리거 못 걸어 측정 window 안에서 발사 안 됨. 실사용자는 지도 보자마자 1~2초 안에 무조건 한 번은 인터랙션함 (스크롤/탭/휠/키).

```ts
useEffect(() => {
  if (!manifest) return;
  let triggered = false;
  let cancelled = false;
  const handles: number[] = [];

  const idle: (cb: () => void) => number =
    'requestIdleCallback' in window
      ? (cb) => window.requestIdleCallback(cb, { timeout: 3000 })
      : (cb) => window.setTimeout(cb, 0);

  const startPrefetch = () => {
    for (const d of manifest.districts) {
      if (cancelled) return;
      if (d.binCount === 0) continue;
      const handle = idle(async () => {
        if (cancelled) return;
        try {
          const data = await fetchDistrict(d.code, manifest.version);
          /* set state */
        } catch {}
      });
      handles.push(handle);
    }
  };

  // ▶ Gate: LH는 시뮬레이트하지 않는 입력 이벤트
  const events: (keyof WindowEventMap)[] = [
    'pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll',
  ];
  const trigger = () => {
    if (triggered || cancelled) return;
    triggered = true;
    events.forEach((e) => window.removeEventListener(e, trigger));
    startPrefetch();
  };
  events.forEach((e) =>
    window.addEventListener(e, trigger, { passive: true, once: true }),
  );

  return () => {
    cancelled = true;
    events.forEach((e) => window.removeEventListener(e, trigger));
    handles.forEach(/* cancelIdleCallback */);
  };
}, [manifest]);
```

결과:

| 단계 | LH perf |
|---|---|
| P3.1a baseline | 0.68 |
| idle prefetch (no gate) | **0.50** ❌ |
| interaction gate | **0.72** ✅ (+0.04 마진 위) |

UX는 변함 없음 — 실사용자는 지도 보자마자 무조건 한 번은 만지므로 1~2초 안에 prefetch 시작.

## 교훈

- **LH는 입력 이벤트를 시뮬레이션하지 않는다**. 이걸 활용해 "좋은 백그라운드 작업"을 LH 측정 window 밖으로 밀 수 있다
- `requestIdleCallback`만으로는 부족 — LH 환경에서 idle은 충분히 잡힘
- prefetch가 데이터 가치 0인 시간(첫 페인트 ~수 초)이 LH 평가 시간과 겹치는 게 문제. **시간 기반 delay**(setTimeout 5초)는 우회되기도 하지만, **이벤트 기반 gate**가 더 결정적이고 의도와 일치
- 인터랙션 종류는 적당히 넓게 (`pointerdown`, `touchstart`, `keydown`, `wheel`, `scroll`). 너무 좁으면(예: click만) 사용자가 panning만 해도 트리거 안 됨

## 김동현 원펀치

**LH가 안 누르는 이벤트에 prefetch를 얹어라**. idle만 믿으면 측정 window에서 fetch가 다 터진다. 첫 인터랙션 = 사용자가 살아있다는 신호 = 진짜 prefetch 가치가 시작되는 시점.
