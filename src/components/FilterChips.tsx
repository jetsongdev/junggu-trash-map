'use client';

import { HAPTIC, vibrate } from '@/lib/haptic';
import { BIN_TYPES, TYPE_STYLE, type BinType } from '@/lib/types';

type Props = {
  selected: Set<BinType>;
  onToggle: (type: BinType) => void;
  onClear: () => void;
};

const INACTIVE =
  'bg-white/70 text-neutral-700 ring-1 ring-neutral-300 hover:bg-white dark:bg-neutral-900/70 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-800';
const ACTIVE =
  'bg-amber-500/15 text-amber-700 ring-1 ring-amber-500 shadow-sm dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400';
const CHIP =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-lg font-semibold transition';

export function FilterChips({ selected, onToggle, onClear }: Props) {
  const isAll = selected.size === 0;

  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => {
          vibrate(HAPTIC.TAP);
          onClear();
        }}
        aria-pressed={isAll}
        aria-label="전체 보기"
        title="전체 보기"
        className={`${CHIP} ${
          isAll ? ACTIVE : INACTIVE
        }`}
      >
        <span
          aria-hidden
          className={`text-3xl leading-none -translate-y-0.5 ${
            isAll ? 'font-bold' : 'font-bold opacity-40'
          }`}
        >
          *
        </span>
      </button>
      {BIN_TYPES.map((type) => {
        const active = selected.has(type);
        const style = TYPE_STYLE[type];
        const label =
          type === '일반' ? '일반쓰레기 필터' : '재활용 필터';
        const title = type === '일반' ? '일반쓰레기' : '재활용';
        return (
          <button
            key={type}
            type="button"
            onClick={() => {
              vibrate(HAPTIC.TAP);
              onToggle(type);
            }}
            aria-pressed={active}
            aria-label={label}
            title={title}
            className={`${CHIP} ${
              active ? 'text-white shadow ring-1 ring-white/50 dark:ring-neutral-900/40' : INACTIVE
            }`}
            style={active ? { backgroundColor: style.color } : undefined}
          >
            <span aria-hidden>{style.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
