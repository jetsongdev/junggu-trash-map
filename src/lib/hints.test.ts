import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchHints, mergeHints } from './hints';
import type { TrashBin } from './types';

const sampleBins: TrashBin[] = [
  {
    id: 'JG-0001',
    name: '명동성당 앞',
    sido: '서울특별시',
    sigungu: '중구',
    roadAddress: '서울 중구 명동길 12',
    lat: 37.5634,
    lng: 126.9871,
    types: ['일반'],
    updatedAt: '2026-04-14',
  },
  {
    id: 'JG-0002',
    name: '남대문 시장 앞',
    sido: '서울특별시',
    sigungu: '중구',
    roadAddress: '서울 중구 남대문시장4길 1',
    lat: 37.5598,
    lng: 126.9785,
    types: ['일반', '재활용'],
    updatedAt: '2026-04-14',
  },
];

describe('mergeHints', () => {
  it('hints가 빈 객체면 bins를 그대로 반환', () => {
    const result = mergeHints(sampleBins, {});
    expect(result).toHaveLength(2);
    expect(result[0].locationHint).toBeUndefined();
    expect(result[1].locationHint).toBeUndefined();
  });

  it('해당 id의 bin에만 locationHint 주입', () => {
    const hints = { 'JG-0001': '명동성당 정문 좌측 5m' };
    const result = mergeHints(sampleBins, hints);
    expect(result[0].locationHint).toBe('명동성당 정문 좌측 5m');
    expect(result[1].locationHint).toBeUndefined();
  });

  it('여러 hint를 동시에 주입', () => {
    const hints = {
      'JG-0001': '힌트1',
      'JG-0002': '힌트2',
    };
    const result = mergeHints(sampleBins, hints);
    expect(result[0].locationHint).toBe('힌트1');
    expect(result[1].locationHint).toBe('힌트2');
  });

  it('매칭 안 되는 hint id는 무시', () => {
    const hints = { 'XX-9999': '존재하지 않는 통' };
    const result = mergeHints(sampleBins, hints);
    expect(result[0].locationHint).toBeUndefined();
    expect(result[1].locationHint).toBeUndefined();
  });

  it('입력 bins 배열을 mutate하지 않음', () => {
    const hints = { 'JG-0001': '힌트1' };
    const before = JSON.stringify(sampleBins);
    mergeHints(sampleBins, hints);
    expect(JSON.stringify(sampleBins)).toBe(before);
  });
});

describe('fetchHints', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('200 OK면 파싱 결과 반환', async () => {
    const payload = {
      version: '2026-05-08',
      hints: { 'JG-0001': '힌트1' },
    };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => payload,
    });
    const result = await fetchHints('junggu');
    expect(result).toEqual(payload);
  });

  it('404면 EMPTY 반환', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });
    const result = await fetchHints('mapo');
    expect(result).toEqual({ version: '', hints: {} });
  });

  it('네트워크 에러면 EMPTY 반환', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('network down'),
    );
    const result = await fetchHints('guro');
    expect(result).toEqual({ version: '', hints: {} });
  });
});
