import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

import * as Sentry from '@sentry/nextjs';
import { captureGeolocationError, captureLoadBinsError } from '../monitoring';

describe('captureGeolocationError', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('captures permission denied as a message with code context', () => {
    captureGeolocationError({
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

  it('captures timeout as a message with timeout type', () => {
    captureGeolocationError({
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

  it('captures unavailable position as a message', () => {
    captureGeolocationError({
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

  it('captures fetchBins errors as exceptions with context', () => {
    const error = new Error('boom');

    captureLoadBinsError(error);

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
