import * as Sentry from '@sentry/nextjs';

type GeolocationErrorCode = 1 | 2 | 3;

const GEOLOCATION_MESSAGES: Record<GeolocationErrorCode, string> = {
  1: 'Geolocation permission denied',
  2: 'Geolocation position unavailable',
  3: 'Geolocation timeout',
};

export function captureGeolocationError(error: GeolocationPositionError): void {
  const code = error.code as GeolocationErrorCode;
  const message = GEOLOCATION_MESSAGES[code] ?? 'Geolocation error';

  Sentry.captureMessage(message, {
    level: 'warning',
    tags: {
      area: 'geolocation',
    },
    extra: {
      code: error.code,
      message: error.message,
    },
  });
}

export function captureLoadBinsError(error: unknown): void {
  Sentry.captureException(error, {
    tags: {
      area: 'data',
      operation: 'fetchBins',
    },
  });
}
