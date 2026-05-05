import { captureLoadBinsError } from './monitoring';
import type { DistrictCode, DistrictMeta, Manifest } from './types';

const MANIFEST_URL = '/data/seoul-manifest.json';
const GEOJSON_URL = '/data/seoul-districts.geojson';

export function buildDistrictUrl(code: DistrictCode, version: string): string {
  return `/data/districts/${code}.json?v=${encodeURIComponent(version)}`;
}

export function findDistrictMeta(
  manifest: Manifest,
  code: DistrictCode,
): DistrictMeta | undefined {
  return manifest.districts.find((d) => d.code === code);
}

export async function fetchManifest(): Promise<Manifest> {
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'force-cache' });
    if (!res.ok) {
      throw new Error(`Failed to load manifest: ${res.status}`);
    }
    return (await res.json()) as Manifest;
  } catch (error) {
    captureLoadBinsError(error);
    throw error;
  }
}

export async function fetchDistrictsGeoJson(): Promise<unknown> {
  try {
    const res = await fetch(GEOJSON_URL, { cache: 'force-cache' });
    if (!res.ok) {
      throw new Error(`Failed to load districts geojson: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    captureLoadBinsError(error);
    throw error;
  }
}
