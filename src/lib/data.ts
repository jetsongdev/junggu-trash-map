import type { BinType, TrashBin } from './types';
import { captureLoadBinsError } from './monitoring';

export async function fetchBins(): Promise<TrashBin[]> {
  try {
    const res = await fetch('/data/junggu.json', { cache: 'force-cache' });
    if (!res.ok) {
      throw new Error(`Failed to load bin data: ${res.status}`);
    }
    return (await res.json()) as TrashBin[];
  } catch (error) {
    captureLoadBinsError(error);
    throw error;
  }
}

export function filterByTypes(bins: TrashBin[], selected: Set<BinType>): TrashBin[] {
  if (selected.size === 0) return bins;
  return bins.filter((bin) => bin.types.some((t) => selected.has(t)));
}
