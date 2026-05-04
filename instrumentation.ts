import type { Instrumentation } from 'next';
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

export function register(): void {
  if (process.env.NODE_ENV !== 'production' || !dsn) {
    return;
  }

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 0,
  });
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  if (process.env.NODE_ENV !== 'production' || !dsn) {
    return;
  }

  await Sentry.captureRequestError(error, request, context);
};
