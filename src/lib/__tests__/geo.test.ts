import { describe, expect, it } from 'vitest';
import {
  detourCost,
  distanceMeters,
  findNearest,
  findOptimalDetour,
  formatDistance,
  haversineMeters,
  manhattanMeters,
  pathPositions,
  routePositions,
} from '../geo';
import type { TrashBin } from '../types';

const SEOUL = { lat: 37.5665, lng: 126.978 };
const BUSAN = { lat: 35.1796, lng: 129.0756 };
const NEARBY = { lat: 37.567, lng: 126.979 };

function makeBin(id: string, lat: number, lng: number): TrashBin {
  return {
    id,
    name: `bin-${id}`,
    sido: '서울',
    sigungu: '중구',
    roadAddress: '주소',
    lat,
    lng,
    types: ['일반'],
    updatedAt: '2026-01-01',
  };
}

describe('haversineMeters', () => {
  it('same point = 0', () => {
    expect(haversineMeters(SEOUL, SEOUL)).toBe(0);
  });

  it('Seoul to Busan ≈ 325km', () => {
    const d = haversineMeters(SEOUL, BUSAN);
    expect(d).toBeGreaterThan(320_000);
    expect(d).toBeLessThan(330_000);
  });

  it('is symmetric', () => {
    expect(haversineMeters(SEOUL, BUSAN)).toBeCloseTo(haversineMeters(BUSAN, SEOUL), 0);
  });
});

describe('manhattanMeters', () => {
  it('same point = 0', () => {
    expect(manhattanMeters(SEOUL, SEOUL)).toBe(0);
  });

  it('>= haversine for non-aligned points', () => {
    expect(manhattanMeters(SEOUL, BUSAN)).toBeGreaterThanOrEqual(haversineMeters(SEOUL, BUSAN));
  });

  it('same lat (east-west) ≈ haversine', () => {
    const a = { lat: 37.5, lng: 126.9 };
    const b = { lat: 37.5, lng: 127.1 };
    expect(manhattanMeters(a, b)).toBeCloseTo(haversineMeters(a, b), 0);
  });
});

describe('distanceMeters', () => {
  it('euclidean delegates to haversine', () => {
    expect(distanceMeters(SEOUL, BUSAN, 'euclidean')).toBe(haversineMeters(SEOUL, BUSAN));
  });

  it('manhattan delegates to manhattanMeters', () => {
    expect(distanceMeters(SEOUL, BUSAN, 'manhattan')).toBe(manhattanMeters(SEOUL, BUSAN));
  });

  it('defaults to euclidean', () => {
    expect(distanceMeters(SEOUL, BUSAN)).toBe(haversineMeters(SEOUL, BUSAN));
  });
});

describe('findNearest', () => {
  it('empty bins → null', () => {
    expect(findNearest([], SEOUL)).toBeNull();
  });

  it('single bin → that bin', () => {
    const bin = makeBin('a', SEOUL.lat, SEOUL.lng);
    const result = findNearest([bin], NEARBY);
    expect(result?.bin).toBe(bin);
  });

  it('picks the closer bin', () => {
    const close = makeBin('close', 37.5666, 126.9781);
    const far = makeBin('far', 37.58, 127.0);
    const result = findNearest([close, far], SEOUL);
    expect(result?.bin.id).toBe('close');
  });

  it('returns non-negative meters', () => {
    const bin = makeBin('a', NEARBY.lat, NEARBY.lng);
    const result = findNearest([bin], SEOUL);
    expect(result?.meters).toBeGreaterThanOrEqual(0);
  });
});

describe('formatDistance', () => {
  it('< 1000m → rounds to meters', () => {
    expect(formatDistance(0)).toBe('0m');
    expect(formatDistance(123.4)).toBe('123m');
    expect(formatDistance(999)).toBe('999m');
  });

  it('>= 1000m → km with 1 decimal', () => {
    expect(formatDistance(1000)).toBe('1.0km');
    expect(formatDistance(1500)).toBe('1.5km');
    expect(formatDistance(10_000)).toBe('10.0km');
  });
});

describe('pathPositions', () => {
  it('euclidean → 2 points (straight)', () => {
    const pts = pathPositions(SEOUL, BUSAN, 'euclidean');
    expect(pts).toHaveLength(2);
    expect(pts[0]).toEqual([SEOUL.lat, SEOUL.lng]);
    expect(pts[1]).toEqual([BUSAN.lat, BUSAN.lng]);
  });

  it('manhattan → 3 points (L-shape)', () => {
    const pts = pathPositions(SEOUL, BUSAN, 'manhattan');
    expect(pts).toHaveLength(3);
    expect(pts[1]).toEqual([SEOUL.lat, BUSAN.lng]);
  });
});

describe('routePositions', () => {
  const VIA = { lat: 37.57, lng: 127.0 };

  it('euclidean → 3 points', () => {
    const pts = routePositions(SEOUL, VIA, BUSAN, 'euclidean');
    expect(pts).toHaveLength(3);
  });

  it('manhattan → 5 points (2 L-shapes joined)', () => {
    const pts = routePositions(SEOUL, VIA, BUSAN, 'manhattan');
    expect(pts).toHaveLength(5);
  });
});

describe('detourCost', () => {
  const VIA = { lat: 37.5, lng: 127.0 };

  it('extra = total - direct', () => {
    const cost = detourCost(SEOUL, VIA, BUSAN);
    expect(cost.extra).toBeCloseTo(cost.total - cost.direct, 5);
  });

  it('total = via1 + via2', () => {
    const cost = detourCost(SEOUL, VIA, BUSAN);
    expect(cost.total).toBeCloseTo(cost.via1 + cost.via2, 5);
  });

  it('via on direct line has near-zero extra', () => {
    const midLat = (SEOUL.lat + BUSAN.lat) / 2;
    const midLng = (SEOUL.lng + BUSAN.lng) / 2;
    const cost = detourCost(SEOUL, { lat: midLat, lng: midLng }, BUSAN);
    expect(cost.extra).toBeGreaterThanOrEqual(0);
    expect(cost.extra / cost.direct).toBeLessThan(0.02);
  });
});

describe('findOptimalDetour', () => {
  it('empty bins → null', () => {
    expect(findOptimalDetour([], SEOUL, BUSAN)).toBeNull();
  });

  it('picks bin with minimum extra distance', () => {
    // atOrigin: sitting at the start point → extra ≈ 0 (via1=0, via2=direct)
    const atOrigin = makeBin('atOrigin', SEOUL.lat, SEOUL.lng);
    // farOff: well off the Seoul-Busan corridor
    const farOff = makeBin('farOff', 37.8, 125.5);
    const result = findOptimalDetour([atOrigin, farOff], SEOUL, BUSAN);
    expect(result?.bin.id).toBe('atOrigin');
  });
});
