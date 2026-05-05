import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../monitoring', () => ({
  captureLoadBinsError: vi.fn(),
}));

import { _resetDistrictCache, fetchDistrict, filterByTypes } from '../data';
import { captureLoadBinsError } from '../monitoring';
import type { TrashBin } from '../types';

const SAMPLE_BINS: TrashBin[] = [
  {
    id: 'JG-0001',
    name: '테스트 휴지통',
    sido: '서울특별시',
    sigungu: '중구',
    roadAddress: '',
    lat: 37.56,
    lng: 127.0,
    types: ['일반'],
    updatedAt: '2026-04-14',
  },
];

describe('fetchDistrict', () => {
  beforeEach(() => _resetDistrictCache());
  afterEach(() => vi.restoreAllMocks());

  it('fetches bins for a district code with version-bust URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => SAMPLE_BINS,
    } as Response);
    vi.stubGlobal('fetch', fetchMock);

    const bins = await fetchDistrict('junggu', '2026-04-14');
    expect(bins).toEqual(SAMPLE_BINS);
    expect(fetchMock).toHaveBeenCalledWith(
      '/data/districts/junggu.json?v=2026-04-14',
      expect.objectContaining({ cache: 'force-cache' }),
    );
  });

  it('caches by district code — second call does not refetch', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => SAMPLE_BINS } as Response);
    vi.stubGlobal('fetch', fetchMock);

    await fetchDistrict('junggu', '2026-04-14');
    await fetchDistrict('junggu', '2026-04-14');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('captures and rethrows on network failure', async () => {
    const error = new Error('network failed');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));

    await expect(fetchDistrict('junggu', '2026-04-14')).rejects.toThrow(
      'network failed',
    );
    expect(captureLoadBinsError).toHaveBeenCalledWith(error);
  });

  it('throws when district response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response),
    );
    await expect(fetchDistrict('junggu', '2026-04-14')).rejects.toThrow();
  });
});

describe('filterByTypes (regression)', () => {
  it('returns all bins when no filter selected', () => {
    expect(filterByTypes(SAMPLE_BINS, new Set())).toEqual(SAMPLE_BINS);
  });

  it('filters by type intersection', () => {
    const recyclingOnly: TrashBin[] = [{ ...SAMPLE_BINS[0], types: ['재활용'] }];
    expect(filterByTypes(recyclingOnly, new Set(['일반']))).toEqual([]);
  });
});
