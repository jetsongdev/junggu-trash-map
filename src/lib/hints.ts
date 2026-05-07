import type { DistrictCode, TrashBin } from './types';

export type DistrictHints = {
  version: string;
  hints: Record<string, string>;
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
  hints: Record<string, string>,
): TrashBin[] {
  return bins.map((b) =>
    hints[b.id] ? { ...b, locationHint: hints[b.id] } : b,
  );
}
