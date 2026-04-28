'use client';

import { BIN_TYPES, TYPE_STYLE, type BinType } from '@/lib/types';

type Props = {
  selected: Set<BinType>;
  onToggle: (type: BinType) => void;
  onClear: () => void;
};

export function FilterChips({ selected, onToggle, onClear }: Props) {
  const isAll = selected.size === 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onClear}
        aria-pressed={isAll}
        className={`min-h-[44px] rounded-full px-4 text-sm font-medium transition ${
          isAll
            ? 'bg-neutral-900 text-white shadow'
            : 'bg-white text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-100'
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
            onClick={() => onToggle(type)}
            aria-pressed={active}
            className={`min-h-[44px] rounded-full px-4 text-sm font-medium transition flex items-center gap-1.5 ${
              active
                ? 'text-white shadow'
                : 'bg-white text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-100'
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
