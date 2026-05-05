import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../monitoring', () => ({
  captureLoadBinsError: vi.fn(),
}));

import {
  buildDistrictUrl,
  fetchManifest,
  fetchDistrictsGeoJson,
  findDistrictMeta,
} from '../districts';
import type { Manifest } from '../types';

const FAKE_MANIFEST: Manifest = {
  version: '2026-04-14',
  districts: [
    {
      code: 'junggu',
      name: '중구',
      binCount: 59,
      bbox: [126.99, 37.55, 127.01, 37.57],
      centroid: [127.0, 37.56],
      adjacent: ['jongno'],
    },
    {
      code: 'jongno',
      name: '종로',
      binCount: 0,
      bbox: [126.97, 37.57, 127.0, 37.6],
      centroid: [126.985, 37.585],
      adjacent: [],
    },
  ],
};

describe('buildDistrictUrl', () => {
  it('appends version as cache-bust query', () => {
    expect(buildDistrictUrl('junggu', '2026-04-14')).toBe(
      '/data/districts/junggu.json?v=2026-04-14',
    );
  });
});

describe('findDistrictMeta', () => {
  it('returns the meta entry by code', () => {
    expect(findDistrictMeta(FAKE_MANIFEST, 'jongno')?.name).toBe('종로');
  });

  it('returns undefined for unknown code', () => {
    expect(findDistrictMeta(FAKE_MANIFEST, 'nowhere')).toBeUndefined();
  });
});

describe('fetchManifest', () => {
  afterEach(() => vi.restoreAllMocks());

  it('fetches and parses the manifest', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => FAKE_MANIFEST,
      } as Response),
    );

    const m = await fetchManifest();
    expect(m.version).toBe('2026-04-14');
    expect(m.districts).toHaveLength(2);
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response),
    );
    await expect(fetchManifest()).rejects.toThrow();
  });
});

describe('fetchDistrictsGeoJson', () => {
  afterEach(() => vi.restoreAllMocks());

  it('fetches the geojson FeatureCollection', async () => {
    const fc = { type: 'FeatureCollection', features: [] };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => fc } as Response),
    );
    const result = await fetchDistrictsGeoJson();
    expect(result.type).toBe('FeatureCollection');
  });
});
