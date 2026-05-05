import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addUse,
  formatSavingsLine,
  loadSavings,
  saveSavings,
  type Savings,
} from './savings';

const STORAGE_KEY = 'savings';

function mockWindow() {
  vi.stubGlobal('window', {
    localStorage: (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      };
    })(),
  });
}

describe('loadSavings', () => {
  beforeEach(() => {
    mockWindow();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns zeroed default when storage is empty', () => {
    expect(loadSavings()).toEqual({ totalMeters: 0, totalSeconds: 0, uses: 0 });
  });

  it('loads saved JSON payload from localStorage', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ totalMeters: 320, totalSeconds: 252, uses: 3 }),
    );

    expect(loadSavings()).toEqual({ totalMeters: 320, totalSeconds: 252, uses: 3 });
  });
});

describe('saveSavings', () => {
  beforeEach(() => {
    mockWindow();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('serializes savings as JSON under the savings key', () => {
    const savings: Savings = { totalMeters: 480, totalSeconds: 400, uses: 2 };

    saveSavings(savings);

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(savings));
  });
});

describe('addUse', () => {
  it('accumulates meters, seconds, and uses', () => {
    expect(addUse({ totalMeters: 100, totalSeconds: 45, uses: 1 }, 220, 67)).toEqual({
      totalMeters: 320,
      totalSeconds: 112,
      uses: 2,
    });
  });

  it('returns a new object without mutating the original', () => {
    const original: Savings = { totalMeters: 10, totalSeconds: 20, uses: 1 };

    const next = addUse(original, 30, 40);

    expect(next).not.toBe(original);
    expect(original).toEqual({ totalMeters: 10, totalSeconds: 20, uses: 1 });
  });
});

describe('formatSavingsLine', () => {
  it('formats meters, minutes, seconds, and uses', () => {
    expect(
      formatSavingsLine({ totalMeters: 320, totalSeconds: 252, uses: 3 }),
    ).toBe('🌱 +320m · 4분 12초 (3회)');
  });

  it('shows zero seconds when duration is under one minute', () => {
    expect(
      formatSavingsLine({ totalMeters: 80, totalSeconds: 8, uses: 1 }),
    ).toBe('🌱 +80m · 0분 8초 (1회)');
  });
});
