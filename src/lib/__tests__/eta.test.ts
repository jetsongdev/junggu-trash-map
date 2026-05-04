import { describe, expect, it } from 'vitest';
import { etaSeconds, formatEta, nextSpeed, WALKING_SPEEDS } from '../eta';

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
