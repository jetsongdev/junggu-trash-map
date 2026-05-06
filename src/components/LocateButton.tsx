'use client';

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
      className={`min-h-[44px] min-w-[44px] rounded-full px-3 text-base transition flex items-center justify-center ${
        active
          ? 'bg-sky-500 text-white shadow'
          : 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-200 disabled:opacity-60 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-700'
      }`}
    >
      <span aria-hidden>{pending ? '⏳' : '📍'}</span>
    </button>
  );
}
