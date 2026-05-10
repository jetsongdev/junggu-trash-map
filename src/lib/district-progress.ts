import type { DistrictCode, Manifest, TrashBin } from './types';

export type DistrictRow = {
  code: DistrictCode;
  name: string;
  binCount: number;
  loaded: boolean;
  inFlight: boolean;
  failed: boolean;
};

export type DistrictVisualStatus = 'loaded' | 'inFlight' | 'pending' | 'failed';

export function countPopulatedDistricts(manifest: Manifest | null): number {
  if (!manifest) return 0;
  return manifest.districts.filter((d) => d.binCount > 0).length;
}

export function countLoadedPopulatedDistricts(
  manifest: Manifest | null,
  activeDistricts: Set<DistrictCode>,
): number {
  if (!manifest) return 0;
  return manifest.districts.filter(
    (d) => d.binCount > 0 && activeDistricts.has(d.code),
  ).length;
}

export function countTerminalPopulatedDistricts(
  manifest: Manifest | null,
  activeDistricts: Set<DistrictCode>,
  failedDistricts: Set<DistrictCode>,
): number {
  if (!manifest) return 0;
  return manifest.districts.filter(
    (d) =>
      d.binCount > 0 &&
      (activeDistricts.has(d.code) || failedDistricts.has(d.code)),
  ).length;
}

export function buildDistrictBreakdown(
  manifest: Manifest | null,
  districtsCache: Map<DistrictCode, TrashBin[]>,
  activeFetches: Set<DistrictCode>,
  failedDistricts: Set<DistrictCode>,
): DistrictRow[] {
  if (!manifest) return [];
  return manifest.districts
    .filter((d) => d.binCount > 0)
    .map((d) => ({
      code: d.code,
      name: d.name,
      binCount: d.binCount,
      loaded: districtsCache.has(d.code),
      inFlight: activeFetches.has(d.code),
      failed: failedDistricts.has(d.code),
    }))
    .sort((a, b) => b.binCount - a.binCount);
}

export function districtVisualStatus(row: DistrictRow): DistrictVisualStatus {
  if (row.loaded) return 'loaded';
  if (row.failed) return 'failed';
  if (row.inFlight) return 'inFlight';
  return 'pending';
}
