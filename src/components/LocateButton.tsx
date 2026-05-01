'use client';

type Props = {
  active: boolean;
  pending: boolean;
  onLocate: () => void;
  onClear: () => void;
};

export function LocateButton({ active, pending, onLocate, onClear }: Props) {
  const handle = active ? onClear : onLocate;
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
          : 'bg-white text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-100 disabled:opacity-60'
      }`}
    >
      <span aria-hidden>📍</span>
      <span>{label}</span>
    </button>
  );
}
