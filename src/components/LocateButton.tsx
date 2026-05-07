'use client';

import { Loader2, LocateFixed } from 'lucide-react';
import { HAPTIC, vibrate } from '@/lib/haptic';

type Props = {
  active: boolean;
  pending: boolean;
  onLocate: () => void;
  onClear: () => void;
};

export function LocateButton({ active, pending, onLocate, onClear }: Props) {
  const handle = () => {
    vibrate(HAPTIC.TAP);
    if (active) onClear();
    else onLocate();
  };
  const ariaLabel = pending ? '위치 찾는 중' : active ? '위치 추적 끄기' : '내 위치 찾기';

  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      aria-pressed={active}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`relative flex h-11 w-11 items-center justify-center rounded-md px-3 text-base transition ring-1 ${
        active
          ? 'bg-sky-500/15 text-sky-700 ring-1 ring-sky-500 shadow-sm dark:bg-sky-400/15 dark:text-sky-200 dark:ring-sky-400'
          : 'bg-white/95 text-neutral-700 ring-1 ring-neutral-300 hover:bg-white disabled:opacity-60 dark:bg-neutral-900/95 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-800'
      }`}
    >
      {pending ? (
        <Loader2 size={20} aria-hidden="true" className="animate-spin" />
      ) : (
        <LocateFixed size={20} aria-hidden="true" />
      )}
      {active && !pending && (
        <span className="absolute -right-1 -top-1 rounded-md bg-sky-500 px-1 text-[10px] leading-5 text-white ring-1 ring-white dark:ring-neutral-900">
          ✓
        </span>
      )}
    </button>
  );
}
