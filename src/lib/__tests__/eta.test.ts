import { describe, expect, it } from 'vitest';
import {
  clampKmh,
  etaSeconds,
  formatEta,
  formatKmh,
  getSpeedDisplay,
  nextSpeed,
  speedToKmh,
  WALKING_SPEEDS,
} from '../eta';

describe('nextSpeed', () => {
  it('cycles slow → normal → fast → slow', () => {
    expect(nextSpeed('slow')).toBe('normal');
    expect(nextSpeed('normal')).toBe('fast');
    expect(nextSpeed('fast')).toBe('slow');
  });
});

describe('etaSeconds', () => {
  it('360m at slow (3 km/h) = 432s', () => {
    expect(etaSeconds(360, 'slow')).toBeCloseTo(432, 0);
  });

  it('400m at normal (4 km/h) = 360s', () => {
    expect(etaSeconds(400, 'normal')).toBeCloseTo(360, 0);
  });

  it('500m at fast (5 km/h) = 360s', () => {
    expect(etaSeconds(500, 'fast')).toBeCloseTo(360, 0);
  });

  it('0m → 0s', () => {
    expect(etaSeconds(0, 'normal')).toBe(0);
  });

  it('consistent with WALKING_SPEEDS kmh values', () => {
    for (const [speed, { kmh }] of Object.entries(WALKING_SPEEDS) as [
      keyof typeof WALKING_SPEEDS,
      { kmh: number; label: string; emoji: string },
    ][]) {
      const mps = (kmh * 1000) / 3600;
      expect(etaSeconds(mps, speed)).toBeCloseTo(1, 5);
    }
  });
});

describe('formatEta', () => {
  it('0s → "약 0초"', () => {
    expect(formatEta(0)).toBe('약 0초');
  });

  it('< 60s → "약 Ns초"', () => {
    expect(formatEta(1)).toBe('약 1초');
    expect(formatEta(59)).toBe('약 59초');
  });

  it('exactly 60s → "약 1분"', () => {
    expect(formatEta(60)).toBe('약 1분');
  });

  it('90s → "약 1분 30초"', () => {
    expect(formatEta(90)).toBe('약 1분 30초');
  });

  it('120s → "약 2분"', () => {
    expect(formatEta(120)).toBe('약 2분');
  });

  it('rounds to nearest second', () => {
    expect(formatEta(59.4)).toBe('약 59초');
    expect(formatEta(59.6)).toBe('약 1분');
  });

  it('negative → clamps to 0', () => {
    expect(formatEta(-5)).toBe('약 0초');
  });
});

describe('etaSeconds with numeric km/h', () => {
  it('400m at 4.5 km/h ≈ 320s', () => {
    expect(etaSeconds(400, 4.5)).toBeCloseTo(320, 0);
  });

  it('1000m at 6 km/h = 600s', () => {
    expect(etaSeconds(1000, 6)).toBeCloseTo(600, 0);
  });

  it('0m at any speed → 0s', () => {
    expect(etaSeconds(0, 5.5)).toBe(0);
  });
});

describe('speedToKmh', () => {
  it('preset → corresponding kmh', () => {
    expect(speedToKmh('slow')).toBe(3);
    expect(speedToKmh('normal')).toBe(4);
    expect(speedToKmh('fast')).toBe(5);
  });

  it('number → identity', () => {
    expect(speedToKmh(4.5)).toBe(4.5);
    expect(speedToKmh(7)).toBe(7);
  });
});

describe('clampKmh', () => {
  it('within range → identity', () => {
    expect(clampKmh(4)).toBe(4);
    expect(clampKmh(2.5)).toBe(2.5);
  });

  it('below MIN → MIN', () => {
    expect(clampKmh(1)).toBe(2);
    expect(clampKmh(-5)).toBe(2);
  });

  it('above MAX → MAX', () => {
    expect(clampKmh(8)).toBe(7);
    expect(clampKmh(100)).toBe(7);
  });

  it('NaN/Infinity → DEFAULT', () => {
    expect(clampKmh(NaN)).toBe(4);
    expect(clampKmh(Infinity)).toBe(4);
  });
});

describe('getSpeedDisplay', () => {
  it('< 3.5 → 🐢 느림', () => {
    expect(getSpeedDisplay(2)).toEqual({ emoji: '🐢', label: '느림' });
    expect(getSpeedDisplay(3.4)).toEqual({ emoji: '🐢', label: '느림' });
  });

  it('3.5 ~ 4.5 → 🚶 보통', () => {
    expect(getSpeedDisplay(3.5)).toEqual({ emoji: '🚶', label: '보통' });
    expect(getSpeedDisplay(4.4)).toEqual({ emoji: '🚶', label: '보통' });
  });

  it('≥ 4.5 → 🏃 빠름', () => {
    expect(getSpeedDisplay(4.5)).toEqual({ emoji: '🏃', label: '빠름' });
    expect(getSpeedDisplay(7)).toEqual({ emoji: '🏃', label: '빠름' });
  });
});

describe('formatKmh', () => {
  it('integer → no decimal', () => {
    expect(formatKmh(4)).toBe('4');
    expect(formatKmh(7)).toBe('7');
  });

  it('non-integer → one decimal', () => {
    expect(formatKmh(4.5)).toBe('4.5');
    expect(formatKmh(2.5)).toBe('2.5');
  });
});
