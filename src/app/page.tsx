'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { FilterChips } from '@/components/FilterChips';
import { fetchBins, filterByTypes } from '@/lib/data';
import type { BinType, TrashBin } from '@/lib/types';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-500">
      지도 불러오는 중…
    </div>
  ),
});

export default function Page() {
  const [bins, setBins] = useState<TrashBin[]>([]);
  const [selected, setSelected] = useState<Set<BinType>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchBins()
      .then((data) => {
        if (active) setBins(data);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'unknown');
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => filterByTypes(bins, selected), [bins, selected]);

  const toggle = (type: BinType) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };
  const clear = () => setSelected((prev) => (prev.size === 0 ? prev : new Set()));

  return (
    <div className="flex h-dvh flex-col bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-950 px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight">🗑️ 중구 휴지통 지도</h1>
          <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-neutral-900">
            PROTO
          </span>
        </div>
      </header>

      <section className="border-b border-neutral-800 bg-neutral-900 px-4 py-3">
        <FilterChips selected={selected} onToggle={toggle} onClear={clear} />
        <div className="mt-2 text-xs text-neutral-400">
          📍 {visible.length} / 전체 {bins.length}개
          {error && <span className="ml-2 text-red-400">({error})</span>}
        </div>
      </section>

      <main className="relative min-h-0 flex-1">
        <Map bins={visible} />
      </main>
    </div>
  );
}
