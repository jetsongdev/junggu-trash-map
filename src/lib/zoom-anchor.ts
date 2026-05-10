import type { LatLng } from './geo';

export function getZoomAnchor(
  origin: LatLng | null,
  dest: LatLng | null,
): LatLng | null {
  if (origin && dest) return { lat: (origin.lat + dest.lat) / 2, lng: (origin.lng + dest.lng) / 2 };
  if (origin) return origin;
  return null; // dest만 있는 경우는 무시 (출발지 없이는 anchor 비활성)
}
