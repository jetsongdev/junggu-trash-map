import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  binMarkerLabel,
  clusterMarkerLabel,
  prefersReducedMotion,
} from '../a11y';
import type { TrashBin } from '../types';

describe('prefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false when matchMedia is unavailable', () => {
    vi.stubGlobal('window', {});

    expect(prefersReducedMotion()).toBe(false);
  });

  it('returns true when the user requests reduced motion', () => {
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockReturnValue({ matches: true }),
    });

    expect(prefersReducedMotion()).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith(
      '(prefers-reduced-motion: reduce)',
    );
  });

  it('returns false when reduced motion is not requested', () => {
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    });

    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('marker labels', () => {
  it('describes a trash bin marker by name and available types', () => {
    const bin = {
      id: 'junggu-0001',
      name: '명동역 8번 출구',
      sido: '서울특별시',
      sigungu: '중구',
      roadAddress: '서울특별시 중구 명동길',
      types: ['일반', '재활용'],
      lat: 37.563,
      lng: 126.982,
      updatedAt: '2026-05-05',
    } satisfies TrashBin;

    expect(binMarkerLabel(bin)).toBe('명동역 8번 출구 휴지통 (일반, 재활용)');
  });

  it('describes a cluster marker by child count', () => {
    expect(clusterMarkerLabel(12)).toBe('휴지통 12개 그룹');
  });
});
