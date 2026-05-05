import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

import * as Sentry from '@sentry/nextjs';
import { captureGeolocationError, captureLoadBinsError } from '../monitoring';

beforeAll(() => {
  // monitoring no-ops outside production+DSN; flip both for tests
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://test@example.ingest/0');
});

describe('captureGeolocationError', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('captures permission denied as a message with code context', async () => {
    await captureGeolocationError({
      code: 1,
      message: 'permission denied',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    });

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Geolocation permission denied',
      expect.objectContaining({
        level: 'warning',
        extra: expect.objectContaining({
          code: 1,
          message: 'permission denied',
        }),
      }),
    );
  });

  it('captures timeout as a message with timeout type', async () => {
    await captureGeolocationError({
      code: 3,
      message: 'timed out',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    });

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Geolocation timeout',
      expect.objectContaining({
        level: 'warning',
      }),
    );
  });

  it('captures unavailable position as a message', async () => {
    await captureGeolocationError({
      code: 2,
      message: 'unavailable',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    });

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Geolocation position unavailable',
      expect.objectContaining({
        level: 'warning',
      }),
    );
  });
});

describe('captureLoadBinsError', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('captures fetchBins errors as exceptions with context', async () => {
    const error = new Error('boom');

    await captureLoadBinsError(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        tags: expect.objectContaining({
          area: 'data',
          operation: 'fetchBins',
        }),
      }),
    );
  });
});
