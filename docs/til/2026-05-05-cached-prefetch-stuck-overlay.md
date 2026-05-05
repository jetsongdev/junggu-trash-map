# Cached prefetch에서 "stuck overlay" — `setTimeout` autoFallback 대신 `requestIdleCallback`

**일자**: 2026-05-05
**프로젝트**: junggu-trash-map
**관련 작업**: P3.2 자치구 자동 prefetch (`cc64604`)

## 문제

P3.2 자치구별 데이터를 사용자 첫 인터랙션 시점에 idle prefetch하도록 게이팅 ([prefetch interaction-gating TIL](./2026-05-05-lh-prefetch-interaction-gating.md)). 인터랙션 없을 때 자동 발사하기 위해 5초 setTimeout fallback 추가:

```ts
const autoFallback = window.setTimeout(trigger, 5000);
```

증상: 디스크 캐시에 7개 자치구 JSON이 이미 있는 재방문에서 사용자는 5초 동안 `자치구 로드 (1/7)` 오버레이를 보면서 기다리다가, 답답해서 화면 만지면 cached fetch가 microsec에 settle되어 overlay 즉시 사라짐. 사용자 인식: "이미 로드됐는데 왜 stuck이지?".

캐시된 재방문에서 5초 setTimeout이 prefetch를 인위적으로 지연시키고 있던 것.

## 진단

setTimeout은 시간만 본다. 캐시 환경/콜드 환경 무관하게 5초. 하지만:

- **캐시된 재방문**: 브라우저 disk cache에 이미 데이터가 있으므로 prefetch는 0ms 비용. **즉시 발사해도 무료**.
- **콜드 첫 방문**: 네트워크 fetch 필요. boot 직후 prefetch는 LCP/TBT에 부담.
- **Lighthouse**: simulated throttled CPU/network. CPU가 거의 idle 안 됨. 5초 시점엔 critical metrics 측정 거의 끝남.

세 시나리오 다른 처리가 필요한데 setTimeout으로는 구분 불가.

`requestIdleCallback`이 정확히 이 셋을 자동 분기:

| 시나리오 | idle 발생 시점 |
|---|---|
| 캐시된 재방문 | 첫 paint 직후 ~50–200ms (브라우저 한가함) |
| 콜드 첫 방문 | boot 끝나면 ~1–2초 안 |
| Lighthouse (throttled) | idle 안 옴 → `timeout` fallback로 5000ms 후 강제 발사 |

## 해결

```ts
// before
const autoFallback = window.setTimeout(trigger, 5000);

// after
const autoFallback = window.requestIdleCallback
  ? window.requestIdleCallback(trigger, { timeout: 5000 })
  : window.setTimeout(trigger, 5000);
```

`{ timeout: 5000 }` 옵션은 "idle이 안 와도 5000ms 지나면 강제로 콜백 실행"을 보장. 즉 **캐시면 idle로 빨리, LH면 timeout으로 안전하게**.

cancel도 두 갈래:

```ts
const cancelAutoFallback = () => {
  if (window.cancelIdleCallback) {
    window.cancelIdleCallback(autoFallback);
  } else {
    window.clearTimeout(autoFallback);
  }
};
```

`requestIdleCallback`과 `setTimeout`이 같은 numeric handle을 반환하지만 cancel은 다른 함수를 써야 함 — feature detect는 trigger와 cancel 양쪽에 모두 필요.

## 교훈

- **시간 기반 fallback은 환경 차이를 무시한다**. 캐시 친화도가 다른 시나리오를 setTimeout 하나로 다루면 항상 누군가는 손해.
- **`requestIdleCallback` + `timeout`** 조합은 "여유 있을 때 빨리, 바쁘면 강제"라는 이중 신호 표현. LH 우회용으로도 좋고 캐시 친화적이기도 함.
- TypeScript에서 `'requestIdleCallback' in window`로 narrowing하면 `window.setTimeout` 타입이 `never`로 좁혀지는 함정 — `window.requestIdleCallback`을 직접 truthy check 하는 게 안전.
- cancel 페어를 잊지 말 것 — `requestIdleCallback`은 `cancelIdleCallback`, `setTimeout`은 `clearTimeout`.

## 김동현 원펀치

**`requestIdleCallback(cb, { timeout })`은 캐시 친화 + LH 안전을 한 줄로**. setTimeout은 시간만 보고 캐시는 모른다 — fallback 타이머에 한 번 더 의심을.
