import type { DistrictCode, DistrictMeta } from './types';

type LngLat = [number, number]; // GeoJSON order
type Ring = LngLat[];

type GeoFeature = {
  type: 'Feature';
  properties: { code: DistrictCode };
  geometry:
    | { type: 'Polygon'; coordinates: Ring[] }
    | { type: 'MultiPolygon'; coordinates: Ring[][] };
};

export type DistrictsGeoJson = {
  type: 'FeatureCollection';
  features: ReadonlyArray<GeoFeature>;
};

function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  // Standard ray-casting. ring is closed ([first] === [last]).
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInFeature(lng: number, lat: number, feature: GeoFeature): boolean {
  if (feature.geometry.type === 'Polygon') {
    const [outer, ...holes] = feature.geometry.coordinates;
    if (!pointInRing(lng, lat, outer)) return false;
    return holes.every((h) => !pointInRing(lng, lat, h));
  }
  // MultiPolygon
  return feature.geometry.coordinates.some((rings) => {
    const [outer, ...holes] = rings;
    if (!pointInRing(lng, lat, outer)) return false;
    return holes.every((h) => !pointInRing(lng, lat, h));
  });
}

export function findDistrictForPoint(
  point: { lat: number; lng: number },
  geojson: DistrictsGeoJson,
): DistrictCode | null {
  for (const feature of geojson.features) {
    if (pointInFeature(point.lng, point.lat, feature)) {
      return feature.properties.code;
    }
  }
  return null;
}

function haversineMeters(a: { lat: number; lng: number }, bLng: number, bLat: number): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - a.lat);
  const dLng = toRad(bLng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(bLat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function findNearestDistrictCentroid(
  point: { lat: number; lng: number },
  districts: ReadonlyArray<DistrictMeta>,
): DistrictCode {
  if (districts.length === 0) {
    throw new Error('findNearestDistrictCentroid: empty districts');
  }
  let bestCode = districts[0].code;
  let bestDist = Infinity;
  for (const d of districts) {
    const [lng, lat] = d.centroid;
    const dist = haversineMeters(point, lng, lat);
    if (dist < bestDist) {
      bestDist = dist;
      bestCode = d.code;
    }
  }
  return bestCode;
}
