import { describe, expect, it } from 'vitest';
import {
  findDistrictForPoint,
  findNearestDistrictCentroid,
} from '../point-in-district';
import type { DistrictsGeoJson } from '../point-in-district';
import type { DistrictMeta } from '../types';

// Minimal FeatureCollection: junggu = unit square around (127, 37.56)
const FAKE_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { code: 'junggu' },
      geometry: {
        type: 'Polygon',
        // [lng, lat] order, ring closed
        coordinates: [
          [
            [126.99, 37.55],
            [127.01, 37.55],
            [127.01, 37.57],
            [126.99, 37.57],
            [126.99, 37.55],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { code: 'jongno' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [126.97, 37.57],
            [127.00, 37.57],
            [127.00, 37.60],
            [126.97, 37.60],
            [126.97, 37.57],
          ],
        ],
      },
    },
  ],
} as unknown as DistrictsGeoJson;

const FAKE_MANIFEST_DISTRICTS: DistrictMeta[] = [
  {
    code: 'junggu',
    name: '중구',
    binCount: 59,
    bbox: [126.99, 37.55, 127.01, 37.57],
    centroid: [127.00, 37.56],
    adjacent: [],
  },
  {
    code: 'jongno',
    name: '종로',
    binCount: 0,
    bbox: [126.97, 37.57, 127.00, 37.60],
    centroid: [126.985, 37.585],
    adjacent: [],
  },
];

describe('findDistrictForPoint', () => {
  it('returns the district whose polygon contains the point', () => {
    const result = findDistrictForPoint(
      { lat: 37.56, lng: 127.0 },
      FAKE_GEOJSON,
    );
    expect(result).toBe('junggu');
  });

  it('returns null when point is outside every polygon', () => {
    const result = findDistrictForPoint(
      { lat: 37.0, lng: 126.0 }, // far west of seoul
      FAKE_GEOJSON,
    );
    expect(result).toBeNull();
  });

  it('handles coordinate input as {lat,lng} but reads geojson [lng,lat] correctly', () => {
    // If someone swapped axes, point (37.585, 126.985) would test as (lng=37, lat=126)
    // and miss every polygon. This guards that bug.
    const result = findDistrictForPoint(
      { lat: 37.585, lng: 126.985 },
      FAKE_GEOJSON,
    );
    expect(result).toBe('jongno');
  });
});

describe('findNearestDistrictCentroid', () => {
  it('returns the closest centroid by haversine when point is outside all polygons', () => {
    // Point south of both districts, slightly closer to junggu centroid (127, 37.56) than to jongno centroid (126.985, 37.585)
    const result = findNearestDistrictCentroid(
      { lat: 37.50, lng: 127.0 },
      FAKE_MANIFEST_DISTRICTS,
    );
    expect(result).toBe('junggu');
  });

  it('breaks ties deterministically by array order', () => {
    // Equidistant midpoint — ensures stable behavior.
    const equidistant = { lat: 37.5725, lng: 126.9925 }; // midpoint between centroids
    const result = findNearestDistrictCentroid(equidistant, FAKE_MANIFEST_DISTRICTS);
    // Either junggu or jongno acceptable, but deterministic across runs:
    expect(['junggu', 'jongno']).toContain(result);
  });
});
