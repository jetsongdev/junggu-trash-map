# Sentry SDK 메인 번들에서 빼기 — top-level import → dynamic import로 lazy chunk

**일자**: 2026-05-05
**프로젝트**: junggu-trash-map
**관련 작업**: P2.14 perf 개선

## 문제

Lighthouse artifact의 `unused-javascript` audit이 90KB짜리 청크를 지목했다. 범인은 Sentry SDK.

문제 구조는 단순했다:

- `page.tsx` 계열 실행 흐름에서 `src/lib/monitoring.ts`를 import
- 그 파일 최상단에 `import * as Sentry from '@sentry/nextjs'`
- 결과적으로 Next.js가 메인 번들에서 이 의존성을 미리 끌고 들어옴
- "에러 날 때만 쓰는 SDK"인데도 code-split이 안 걸림

실제 Lighthouse run `25354528695` artifact 기준으로 `unused-javascript` 90KB가 perf score 하락 원인으로 보였다.

## 진단

원인은 `src/lib/monitoring.ts`의 top-level import였다. 이 형태에선 호출 빈도와 무관하게 번들 포함이 먼저 확정된다.

기존 구조는 이런 식이었다:

```tsx
import * as Sentry from '@sentry/nextjs';

export function captureGeolocationError(...) {
  Sentry.captureMessage(...);
}
```

이 패턴은 "런타임 조건문으로 실행 안 하면 되겠지"가 통하지 않는다. import 시점이 이미 정적이기 때문.

초기화 파일도 같은 문제를 안고 있었다. `instrumentation-client.ts`에서 SDK를 즉시 import/init하면 첫 page load 비용에 그대로 올라탄다.

## 해결

핵심은 Sentry를 "필요할 때만" 불러오도록 top-level import를 없애는 것. 캡처 함수는 async로 바꾸고, production + DSN 둘 다 있을 때만 no-op gate를 통과한 뒤 SDK 청크를 lazy load하게 했다.

`src/lib/monitoring.ts`

```tsx
type GeolocationErrorCode = 1 | 2 | 3;

const GEOLOCATION_MESSAGES: Record<GeolocationErrorCode, string> = {
  1: 'Geolocation permission denied',
  2: 'Geolocation position unavailable',
  3: 'Geolocation timeout',
};

function shouldReport(): boolean {
  return (
    process.env.NODE_ENV === 'production' &&
    Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)
  );
}

export async function captureGeolocationError(
  error: GeolocationPositionError,
): Promise<void> {
  if (!shouldReport()) return;
  const Sentry = await import('@sentry/nextjs');
  const code = error.code as GeolocationErrorCode;
  const message = GEOLOCATION_MESSAGES[code] ?? 'Geolocation error';
  Sentry.captureMessage(message, {
    level: 'warning',
    tags: { area: 'geolocation' },
    extra: { code: error.code, message: error.message },
  });
}

export async function captureLoadBinsError(error: unknown): Promise<void> {
  if (!shouldReport()) return;
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureException(error, {
    tags: { area: 'data', operation: 'fetchBins' },
  });
}
```

`instrumentation-client.ts`

```tsx
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (
  typeof window !== 'undefined' &&
  process.env.NODE_ENV === 'production' &&
  dsn
) {
  const initSentry = async () => {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      replaysOnErrorSampleRate: 0,
    });
  };

  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => void;
  };

  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(initSentry, { timeout: 3000 });
  } else {
    setTimeout(initSentry, 1500);
  }
}
```

즉:

- capture 함수는 async dynamic import로 lazy chunk화
- SDK init도 page load 직후가 아니라 idle 구간으로 지연
- production이 아니거나 DSN이 없으면 import 자체를 안 함

## 트레이드오프

- capture 호출 시점 첫 1회 청크 다운로드 지연 (~50~100ms 추정) — 에러 보고는 약간 늦어지지만 UX 영향은 사실상 없다
- production page load 직후 약 1.5초 동안 발생한 에러는 capture가 안 될 수 있음 — 드문 edge case지만 zero-loss 보장은 깨진다

## 교훈

### 1. 외부 SDK는 무조건 dynamic import 검토 — 특히 capture/log/analytics같이 lazy 가능한 것

앱 핵심 UX 경로가 아닌 의존성은 "언제 실행되느냐"보다 "언제 import되느냐"를 먼저 봐야 한다.

### 2. `import * as X` top-level은 tree-shaking 한계 — dynamic이 더 확실

패키지 내부 구조를 믿고 흔들리는 것보다, 필요 시점 import로 청크 경계를 명시하는 편이 예측 가능하다.

### 3. Lighthouse `unused-javascript` audit이 hidden cost 잡는 핵심 지표

번들 사이즈 표면 수치보다 "초기 로드에 실사용 없이 포함된 JS"를 직접 지목해 주기 때문에 perf 라운드에서 가장 실전적이다.

## 김동현 원펀치

Sentry처럼 호출 시점이 명확한 외부 SDK는 top-level import 금지 — async dynamic import로 lazy chunk화.
