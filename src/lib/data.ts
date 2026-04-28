import type { BinType, TrashBin } from './types';

export async function fetchBins(): Promise<TrashBin[]> {
  const res = await fetch('/data/junggu.json', { cache: 'force-cache' });
  if (!res.ok) {
    throw new Error(`Failed to load bin data: ${res.status}`);
  }
  return (await res.json()) as TrashBin[];
}

export function filterByTypes(bins: TrashBin[], selected: Set<BinType>): TrashBin[] {
  if (selected.size === 0) return bins;
  return bins.filter((bin) => bin.types.some((t) => selected.has(t)));
}
