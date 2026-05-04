'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-center text-neutral-50">
        <div className="space-y-4">
          <p>오류가 발생했습니다. 새로고침 해주세요</p>
          <button
            type="button"
            className="rounded-full bg-white px-5 py-3 text-sm font-medium text-neutral-900"
            onClick={() => {
              reset();
              window.location.reload();
            }}
          >
            새로고침
          </button>
        </div>
      </body>
    </html>
  );
}
