import type { TrashBin } from './types';

export type LatLng = { lat: number; lng: number };
export type DistanceMode = 'euclidean' | 'manhattan';

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

export function manhattanMeters(a: LatLng, b: LatLng): number {
  const corner: LatLng = { lat: b.lat, lng: a.lng };
  return haversineMeters(a, corner) + haversineMeters(corner, b);
}

export function distanceMeters(
  a: LatLng,
  b: LatLng,
  mode: DistanceMode = 'euclidean',
): number {
  return mode === 'manhattan' ? manhattanMeters(a, b) : haversineMeters(a, b);
}

export function findNearest(
  bins: TrashBin[],
  origin: LatLng,
  mode: DistanceMode = 'euclidean',
): { bin: TrashBin; meters: number } | null {
  if (bins.length === 0) return null;
  let bestBin = bins[0];
  let bestMeters = distanceMeters(origin, bestBin, mode);
  for (let i = 1; i < bins.length; i++) {
    const m = distanceMeters(origin, bins[i], mode);
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

export function pathPositions(
  origin: LatLng,
  target: LatLng,
  mode: DistanceMode = 'euclidean',
): [number, number][] {
  if (mode === 'manhattan') {
    return [
      [origin.lat, origin.lng],
      [origin.lat, target.lng],
      [target.lat, target.lng],
    ];
  }
  return [
    [origin.lat, origin.lng],
    [target.lat, target.lng],
  ];
}

export function routePositions(
  origin: LatLng,
  via: LatLng,
  destination: LatLng,
  mode: DistanceMode = 'euclidean',
): [number, number][] {
  const seg1 = pathPositions(origin, via, mode);
  const seg2 = pathPositions(via, destination, mode);
  return [...seg1, ...seg2.slice(1)];
}

export type DetourCost = {
  via1: number;
  via2: number;
  total: number;
  direct: number;
  extra: number;
};

export function detourCost(
  origin: LatLng,
  via: LatLng,
  destination: LatLng,
  mode: DistanceMode = 'euclidean',
): DetourCost {
  const via1 = distanceMeters(origin, via, mode);
  const via2 = distanceMeters(via, destination, mode);
  const direct = distanceMeters(origin, destination, mode);
  return { via1, via2, total: via1 + via2, direct, extra: via1 + via2 - direct };
}

export function findOptimalDetour(
  bins: TrashBin[],
  origin: LatLng,
  destination: LatLng,
  mode: DistanceMode = 'euclidean',
): { bin: TrashBin; cost: DetourCost } | null {
  if (bins.length === 0) return null;
  let best: { bin: TrashBin; cost: DetourCost } | null = null;
  for (const bin of bins) {
    const cost = detourCost(origin, bin, destination, mode);
    if (!best || cost.extra < best.cost.extra) {
      best = { bin, cost };
    }
  }
  return best;
}
