import { buildDistrictUrl } from './districts';
import { captureLoadBinsError } from './monitoring';
import type { BinType, DistrictCode, TrashBin } from './types';

const cache = new Map<DistrictCode, TrashBin[]>();

export async function fetchDistrict(
  code: DistrictCode,
  version: string,
): Promise<TrashBin[]> {
  const cached = cache.get(code);
  if (cached) return cached;

  try {
    const res = await fetch(buildDistrictUrl(code, version), {
      cache: 'force-cache',
    });
    if (!res.ok) {
      throw new Error(`Failed to load district ${code}: ${res.status}`);
    }
    const bins = (await res.json()) as TrashBin[];
    cache.set(code, bins);
    return bins;
  } catch (error) {
    captureLoadBinsError(error);
    throw error;
  }
}

/** Test-only: reset the in-memory cache so each test starts clean. */
export function _resetDistrictCache(): void {
  cache.clear();
}

export function filterByTypes(bins: TrashBin[], selected: Set<BinType>): TrashBin[] {
  if (selected.size === 0) return bins;
  return bins.filter((bin) => bin.types.some((t) => selected.has(t)));
}
