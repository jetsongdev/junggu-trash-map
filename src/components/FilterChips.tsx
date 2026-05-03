'use client';

import { HAPTIC, vibrate } from '@/lib/haptic';
import { BIN_TYPES, TYPE_STYLE, type BinType } from '@/lib/types';

type Props = {
  selected: Set<BinType>;
  onToggle: (type: BinType) => void;
  onClear: () => void;
};

const INACTIVE =
  'bg-neutral-800 text-neutral-200 ring-1 ring-neutral-700 hover:bg-neutral-700';

export function FilterChips({ selected, onToggle, onClear }: Props) {
  const isAll = selected.size === 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => {
          vibrate(HAPTIC.TAP);
          onClear();
        }}
        aria-pressed={isAll}
        className={`min-h-[44px] rounded-full px-4 text-sm font-medium transition ${
          isAll ? 'bg-white text-neutral-900 shadow' : INACTIVE
        }`}
      >
        전체
      </button>
      {BIN_TYPES.map((type) => {
        const active = selected.has(type);
        const style = TYPE_STYLE[type];
        return (
          <button
            key={type}
            type="button"
            onClick={() => {
              vibrate(HAPTIC.TAP);
              onToggle(type);
            }}
            aria-pressed={active}
            className={`min-h-[44px] rounded-full px-4 text-sm font-medium transition flex items-center gap-1.5 ${
              active ? 'text-white shadow' : INACTIVE
            }`}
            style={active ? { backgroundColor: style.color } : undefined}
          >
            <span aria-hidden>{style.emoji}</span>
            <span>{type}</span>
          </button>
        );
      })}
    </div>
  );
}
