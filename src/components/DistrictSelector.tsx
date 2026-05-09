'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { TileTheme } from '@/components/Map';
import { FOCUS_VISIBLE_CLASS } from '@/lib/a11y';
import { getDistrictGridRows } from '@/lib/district-grid';
import { HAPTIC, vibrate } from '@/lib/haptic';
import type { DistrictCode, DistrictMeta, Manifest } from '@/lib/types';

type Props = {
  manifest: Manifest;
  viewingDistrict: DistrictCode | null;
  tileTheme: TileTheme;
  onSelectPopulated: (meta: DistrictMeta) => void;
  onSelectEmpty: (meta: DistrictMeta) => void;
};

const TRIGGER_BASE =
  `relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md px-2 text-base font-medium transition ring-1 ${FOCUS_VISIBLE_CLASS}`;
const TRIGGER_INACTIVE =
  'bg-white/95 text-neutral-700 ring-neutral-300 hover:bg-white dark:bg-neutral-900/95 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-800';
const TRIGGER_ACTIVE =
  'bg-teal-500/15 text-teal-700 ring-teal-500 shadow-sm dark:bg-teal-400/15 dark:text-teal-200 dark:ring-teal-400';
const CELL_BASE =
  `flex h-11 w-11 flex-col items-center justify-center rounded-md text-[10px] font-semibold leading-none transition ring-1 ${FOCUS_VISIBLE_CLASS}`;
const POPULATED_CELL =
  'bg-sky-100 text-sky-900 ring-sky-300 hover:bg-sky-200 dark:bg-sky-600/30 dark:text-sky-100 dark:ring-sky-500/40 dark:hover:bg-sky-600/45';
const EMPTY_CELL =
  'bg-neutral-200/80 text-neutral-600 opacity-70 ring-neutral-300 hover:opacity-90 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700';
const VIEWING_CELL = 'ring-2 ring-amber-400 dark:ring-amber-300';

export function DistrictSelector({
  manifest,
  viewingDistrict,
  tileTheme,
  onSelectPopulated,
  onSelectEmpty,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rows = useMemo(() => getDistrictGridRows(manifest), [manifest]);

  useEffect(() => {
    if (!open) return;

    const closeIfOutside = (event: PointerEvent | FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', closeIfOutside);
    document.addEventListener('focusin', closeIfOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeIfOutside);
      document.removeEventListener('focusin', closeIfOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const handleSelect = (meta: DistrictMeta) => {
    vibrate(HAPTIC.SELECT);
    if (meta.binCount > 0) {
      onSelectPopulated(meta);
    } else {
      onSelectEmpty(meta);
    }
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative" data-map-theme={tileTheme}>
      <button
        type="button"
        onClick={() => {
          vibrate(HAPTIC.TAP);
          setOpen((prev) => !prev);
        }}
        aria-expanded={open}
        aria-label={open ? '자치구 선택 닫기' : '자치구 선택 열기'}
        title="자치구 선택"
        className={`${TRIGGER_BASE} ${open ? TRIGGER_ACTIVE : TRIGGER_INACTIVE}`}
      >
        <span aria-hidden>🗺</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[1001] mt-1 w-[252px] rounded-md bg-white/95 p-2 shadow-xl ring-1 ring-neutral-200 backdrop-blur-sm dark:bg-neutral-900/95 dark:ring-neutral-700">
          <div className="grid grid-cols-5 gap-1">
            {rows.map((row) =>
              row.map((meta) => {
                const populated = meta.binCount > 0;
                const viewing = meta.code === viewingDistrict;
                return (
                  <button
                    key={meta.code}
                    type="button"
                    onClick={() => handleSelect(meta)}
                    aria-label={
                      populated
                        ? `${meta.name} 휴지통 ${meta.binCount}개`
                        : `${meta.name} 공공데이터 미발행`
                    }
                    aria-current={viewing ? 'location' : undefined}
                    title={
                      populated
                        ? `${meta.name} ${meta.binCount}개`
                        : `${meta.name} 데이터 미발행`
                    }
                    className={`${CELL_BASE} ${
                      populated ? POPULATED_CELL : EMPTY_CELL
                    } ${viewing ? VIEWING_CELL : ''}`}
                  >
                    <span className="whitespace-nowrap">{meta.name}</span>
                    {populated && (
                      <span className="mt-0.5 font-mono text-[9px] leading-none opacity-80">
                        {meta.binCount}
                      </span>
                    )}
                  </button>
                );
              }),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
