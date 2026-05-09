'use client';

import { HAPTIC, vibrate } from '@/lib/haptic';
import { BIN_TYPES, TYPE_STYLE, type BinType } from '@/lib/types';

type Props = {
  selected: Set<BinType>;
  onToggle: (type: BinType) => void;
  layout?: 'horizontal' | 'vertical';
};

const INACTIVE =
  'bg-white/70 text-neutral-700 ring-1 ring-neutral-300 hover:bg-white dark:bg-neutral-900/70 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-800';
const CHIP =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-lg font-semibold transition';

export function FilterChips({ selected, onToggle, layout = 'horizontal' }: Props) {
  return (
    <div className={layout === 'vertical' ? 'flex flex-col gap-1.5' : 'flex flex-nowrap items-center gap-1.5'}>
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
