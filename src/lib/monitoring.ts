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
