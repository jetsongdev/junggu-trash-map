import type { TrashBin } from './types';

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_METERS = 6371000;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLng = Math.sin(dLng / 2);
  const h =
    sinHalfLat * sinHalfLat + Math.cos(lat1) * Math.cos(lat2) * sinHalfLng * sinHalfLng;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

export function findNearest(
  bins: TrashBin[],
  origin: LatLng,
): { bin: TrashBin; meters: number } | null {
  if (bins.length === 0) return null;
  let bestBin = bins[0];
  let bestMeters = haversineMeters(origin, bestBin);
  for (let i = 1; i < bins.length; i++) {
    const m = haversineMeters(origin, bins[i]);
    if (m < bestMeters) {
      bestBin = bins[i];
      bestMeters = m;
    }
  }
  return { bin: bestBin, meters: bestMeters };
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
