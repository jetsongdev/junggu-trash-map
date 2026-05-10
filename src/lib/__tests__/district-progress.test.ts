import { describe, expect, it } from 'vitest';

import {
  buildDistrictBreakdown,
  countLoadedPopulatedDistricts,
  countPopulatedDistricts,
  countTerminalPopulatedDistricts,
  districtVisualStatus,
  type DistrictRow,
} from '../district-progress';
import type { Manifest, TrashBin } from '../types';

const MANIFEST: Manifest = {
  version: '2026-05-11',
  districts: [
    {
      code: 'junggu',
      name: '중구',
      binCount: 59,
      bbox: [126.99, 37.55, 127.01, 37.57],
      centroid: [127.0, 37.56],
      adjacent: [],
    },
    {
      code: 'mapo',
      name: '마포구',
      binCount: 84,
      bbox: [126.9, 37.53, 126.97, 37.58],
      centroid: [126.93, 37.55],
      adjacent: [],
    },
    {
      code: 'jongno',
      name: '종로구',
      binCount: 0,
      bbox: [126.97, 37.57, 127.0, 37.6],
      centroid: [126.985, 37.585],
      adjacent: [],
    },
  ],
};

const SAMPLE_BIN: TrashBin = {
  id: 'JG-0001',
  name: '테스트 휴지통',
  sido: '서울특별시',
  sigungu: '중구',
  roadAddress: '테스트로 1',
  lat: 37.56,
  lng: 127,
  types: ['일반'],
  updatedAt: '2026-05-11',
};

describe('district progress counts', () => {
  it('counts only districts that publish bin data', () => {
    expect(countPopulatedDistricts(MANIFEST)).toBe(2);
    expect(countPopulatedDistricts(null)).toBe(0);
  });

  it('counts active populated districts as loaded', () => {
    expect(
      countLoadedPopulatedDistricts(MANIFEST, new Set(['junggu', 'jongno'])),
    ).toBe(1);
  });

  it('counts loaded or failed populated districts as terminal', () => {
    expect(
      countTerminalPopulatedDistricts(
        MANIFEST,
        new Set(['junggu']),
        new Set(['mapo', 'jongno']),
      ),
    ).toBe(2);
  });
});

describe('buildDistrictBreakdown', () => {
  it('returns populated districts sorted by bin count with current state flags', () => {
    const rows = buildDistrictBreakdown(
      MANIFEST,
      new Map([['junggu', [SAMPLE_BIN]]]),
      new Set(['mapo']),
      new Set(['mapo']),
    );

    expect(rows).toEqual([
      {
        code: 'mapo',
        name: '마포구',
        binCount: 84,
        loaded: false,
        inFlight: true,
        failed: true,
      },
      {
        code: 'junggu',
        name: '중구',
        binCount: 59,
        loaded: true,
        inFlight: false,
        failed: false,
      },
    ]);
  });

  it('returns an empty list before manifest loads', () => {
    expect(
      buildDistrictBreakdown(null, new Map(), new Set(), new Set()),
    ).toEqual([]);
  });
});

describe('districtVisualStatus', () => {
  const base: DistrictRow = {
    code: 'junggu',
    name: '중구',
    binCount: 59,
    loaded: false,
    inFlight: false,
    failed: false,
  };

  it('prioritizes loaded over other flags', () => {
    expect(
      districtVisualStatus({
        ...base,
        loaded: true,
        inFlight: true,
        failed: true,
      }),
    ).toBe('loaded');
  });

  it('maps failed, in-flight, and pending rows', () => {
    expect(districtVisualStatus({ ...base, failed: true })).toBe('failed');
    expect(districtVisualStatus({ ...base, inFlight: true })).toBe('inFlight');
    expect(districtVisualStatus(base)).toBe('pending');
  });
});
