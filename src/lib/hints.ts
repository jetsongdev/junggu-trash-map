import type { DistrictCode, LocationHintSource, TrashBin } from './types';

export type HintEntry =
  | string
  | { text: string; source: LocationHintSource };

export type DistrictHints = {
  version: string;
  hints: Record<string, HintEntry>;
};

const EMPTY: DistrictHints = { version: '', hints: {} };

export async function fetchHints(code: DistrictCode): Promise<DistrictHints> {
  try {
    const res = await fetch(`/data/hints/${code}.json`);
    if (!res.ok) return EMPTY;
    return (await res.json()) as DistrictHints;
  } catch {
    return EMPTY;
  }
}

export function mergeHints(
  bins: TrashBin[],
  hints: Record<string, HintEntry>,
): TrashBin[] {
  return bins.map((b) => {
    const h = hints[b.id];
    if (!h) return b;
    if (typeof h === 'string') {
      return { ...b, locationHint: h, locationHintSource: 'curated' };
    }
    return { ...b, locationHint: h.text, locationHintSource: h.source };
  });
}
