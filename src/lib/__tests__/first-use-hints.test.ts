import { beforeEach, describe, expect, it } from 'vitest';
import {
  HINT_DURATION_MS,
  HINT_MESSAGES,
  hasSeenHint,
  markHintSeen,
  type HintKey,
} from '../first-use-hints';

function makeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

const ALL_KEYS: HintKey[] = ['share', 'favorite', 'headsUp', 'grid', 'speed'];

describe('hasSeenHint / markHintSeen', () => {
  let storage: Storage;
  beforeEach(() => {
    storage = makeStorage();
  });

  it('returns false before being marked', () => {
    for (const key of ALL_KEYS) {
      expect(hasSeenHint(key, storage)).toBe(false);
    }
  });

  it('returns true after markHintSeen', () => {
    markHintSeen('share', storage);
    expect(hasSeenHint('share', storage)).toBe(true);
  });

  it('isolates keys', () => {
    markHintSeen('share', storage);
    expect(hasSeenHint('favorite', storage)).toBe(false);
    expect(hasSeenHint('headsUp', storage)).toBe(false);
    expect(hasSeenHint('grid', storage)).toBe(false);
    expect(hasSeenHint('speed', storage)).toBe(false);
  });

  it('uses hint:<key> storage prefix', () => {
    markHintSeen('grid', storage);
    expect(storage.getItem('hint:grid')).toBe('true');
  });

  it('treats throwing storage.getItem as already seen (fail-closed)', () => {
    const broken: Storage = {
      ...makeStorage(),
      getItem() {
        throw new Error('quota');
      },
    };
    expect(hasSeenHint('share', broken)).toBe(true);
  });

  it('swallows throwing storage.setItem', () => {
    const broken: Storage = {
      ...makeStorage(),
      setItem() {
        throw new Error('quota');
      },
    };
    expect(() => markHintSeen('share', broken)).not.toThrow();
  });
});

describe('HINT_MESSAGES', () => {
  it('has a non-empty message for every hint key', () => {
    for (const key of ALL_KEYS) {
      expect(HINT_MESSAGES[key]).toBeTruthy();
      expect(HINT_MESSAGES[key].length).toBeGreaterThan(0);
    }
  });
});

describe('HINT_DURATION_MS', () => {
  it('is 4000ms (between info default and error duration)', () => {
    expect(HINT_DURATION_MS).toBe(4000);
  });
});
