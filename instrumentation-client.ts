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
