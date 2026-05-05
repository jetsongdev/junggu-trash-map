import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  filterByFavorites,
  isFavorite,
  loadFavorites,
  saveFavorites,
  toggleFavorite,
} from '../favorites';
import type { TrashBin } from '../types';

const STORAGE_KEY = 'favorites';

function bin(id: string): TrashBin {
  return {
    id,
    name: `bin-${id}`,
    sido: '서울특별시',
    sigungu: '중구',
    roadAddress: '테스트로 1',
    lat: 37.5,
    lng: 126.9,
    types: ['일반'],
    updatedAt: '2026-05-04',
  };
}

describe('toggleFavorite', () => {
  it('adds new id to set', () => {
    const result = toggleFavorite(new Set(), 'a');
    expect(result.has('a')).toBe(true);
    expect(result.size).toBe(1);
  });

  it('removes existing id from set', () => {
    const result = toggleFavorite(new Set(['a', 'b']), 'a');
    expect(result.has('a')).toBe(false);
    expect(result.has('b')).toBe(true);
    expect(result.size).toBe(1);
  });

  it('returns a new Set (immutability)', () => {
    const original = new Set(['a']);
    const result = toggleFavorite(original, 'b');
    expect(result).not.toBe(original);
    expect(original.size).toBe(1);
  });
});

describe('isFavorite', () => {
  it('true for member', () => {
    expect(isFavorite(new Set(['a']), 'a')).toBe(true);
  });

  it('false for non-member', () => {
    expect(isFavorite(new Set(['a']), 'b')).toBe(false);
  });

  it('false for empty set', () => {
    expect(isFavorite(new Set(), 'a')).toBe(false);
  });
});

describe('filterByFavorites', () => {
  it('empty favorites → empty result', () => {
    expect(filterByFavorites([bin('a'), bin('b')], new Set())).toEqual([]);
  });

  it('returns only bins matching favorite ids', () => {
    const result = filterByFavorites([bin('a'), bin('b'), bin('c')], new Set(['a', 'c']));
    expect(result.map((b) => b.id)).toEqual(['a', 'c']);
  });

  it('preserves bin order', () => {
    const result = filterByFavorites([bin('z'), bin('a'), bin('m')], new Set(['a', 'z', 'm']));
    expect(result.map((b) => b.id)).toEqual(['z', 'a', 'm']);
  });
});

describe('loadFavorites + saveFavorites', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: (() => {
        let store: Record<string, string> = {};
        return {
          getItem: (k: string) => store[k] ?? null,
          setItem: (k: string, v: string) => {
            store[k] = v;
          },
          removeItem: (k: string) => {
            delete store[k];
          },
          clear: () => {
            store = {};
          },
        };
      })(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('empty → empty Set', () => {
    expect(loadFavorites()).toEqual(new Set());
  });

  it('round-trip — save then load', () => {
    saveFavorites(new Set(['a', 'b', 'c']));
    expect(loadFavorites()).toEqual(new Set(['a', 'b', 'c']));
  });

  it('save empty Set → removes key (so empty load is clean)', () => {
    saveFavorites(new Set(['x']));
    saveFavorites(new Set());
    expect(loadFavorites()).toEqual(new Set());
  });

  it('handles whitespace + empty entries gracefully on load', () => {
    window.localStorage.setItem(STORAGE_KEY, ' a , ,b ,, c ');
    expect(loadFavorites()).toEqual(new Set(['a', 'b', 'c']));
  });
});
