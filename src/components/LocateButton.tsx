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
  const label = pending ? '찾는 중…' : active ? '위치 끄기' : '내 위치';

  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      aria-pressed={active}
      className={`min-h-[44px] rounded-full px-4 text-sm font-medium transition flex items-center gap-1.5 ${
        active
          ? 'bg-sky-500 text-white shadow'
          : 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-200 disabled:opacity-60 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-700'
      }`}
    >
      <span aria-hidden>📍</span>
      <span>{label}</span>
    </button>
  );
}
