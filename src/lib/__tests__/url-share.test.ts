import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildShareUrl, parseUrlParams } from '../url-share';
import type { AppState } from '../url-share';

const DEFAULTS: AppState = {
  selected: new Set(),
  tileTheme: 'dark',
  distanceMode: 'euclidean',
  walkingSpeed: 'normal',
  userLocation: null,
  destination: null,
};

function params(obj: Record<string, string>): URLSearchParams {
  return new URLSearchParams(obj);
}

describe('parseUrlParams', () => {
  it('empty → empty partial', () => {
    const result = parseUrlParams(params({}));
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('types=general → selected has 일반', () => {
    const result = parseUrlParams(params({ types: 'general' }));
    expect(result.selected?.has('일반')).toBe(true);
    expect(result.selected?.has('재활용')).toBe(false);
  });

  it('types=general,recycle → both types', () => {
    const result = parseUrlParams(params({ types: 'general,recycle' }));
    expect(result.selected?.has('일반')).toBe(true);
    expect(result.selected?.has('재활용')).toBe(true);
  });

  it('invalid alias ignored', () => {
    const result = parseUrlParams(params({ types: 'garbage' }));
    expect(result.selected).toBeUndefined();
  });

  it('theme=light', () => {
    expect(parseUrlParams(params({ theme: 'light' })).tileTheme).toBe('light');
  });

  it('invalid theme → undefined', () => {
    expect(parseUrlParams(params({ theme: 'neon' })).tileTheme).toBeUndefined();
  });

  it('mode=manhattan', () => {
    expect(parseUrlParams(params({ mode: 'manhattan' })).distanceMode).toBe('manhattan');
  });

  it('speed=fast', () => {
    expect(parseUrlParams(params({ speed: 'fast' })).walkingSpeed).toBe('fast');
  });

  it('valid origin coord', () => {
    const result = parseUrlParams(params({ origin: '37.5665,126.978' }));
    expect(result.userLocation).toEqual({ lat: 37.5665, lng: 126.978 });
  });

  it('out-of-range lat → undefined', () => {
    expect(parseUrlParams(params({ origin: '91,126' })).userLocation).toBeUndefined();
  });

  it('extra coord field → undefined', () => {
    expect(parseUrlParams(params({ origin: '37,126,0' })).userLocation).toBeUndefined();
  });

  it('NaN coord → undefined', () => {
    expect(parseUrlParams(params({ origin: 'abc,def' })).userLocation).toBeUndefined();
  });

  it('valid dest coord', () => {
    const result = parseUrlParams(params({ dest: '35.1796,129.0756' }));
    expect(result.destination).toEqual({ lat: 35.1796, lng: 129.0756 });
  });
});

describe('buildShareUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: { pathname: '/', origin: 'http://localhost' },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('default state → no query params', () => {
    const url = buildShareUrl(DEFAULTS, DEFAULTS);
    expect(url).toBe('http://localhost/');
  });

  it('일반 filter → types=general', () => {
    const state: AppState = { ...DEFAULTS, selected: new Set(['일반']) };
    const url = new URL(buildShareUrl(state, DEFAULTS));
    expect(url.searchParams.get('types')).toBe('general');
  });

  it('both filters → types=general,recycle', () => {
    const state: AppState = { ...DEFAULTS, selected: new Set(['일반', '재활용']) };
    const url = new URL(buildShareUrl(state, DEFAULTS));
    expect(url.searchParams.get('types')).toBe('general,recycle');
  });

  it('light theme → theme=light', () => {
    const state: AppState = { ...DEFAULTS, tileTheme: 'light' };
    const url = new URL(buildShareUrl(state, DEFAULTS));
    expect(url.searchParams.get('theme')).toBe('light');
  });

  it('manhattan mode → mode=manhattan', () => {
    const state: AppState = { ...DEFAULTS, distanceMode: 'manhattan' };
    const url = new URL(buildShareUrl(state, DEFAULTS));
    expect(url.searchParams.get('mode')).toBe('manhattan');
  });

  it('fast speed → speed=fast', () => {
    const state: AppState = { ...DEFAULTS, walkingSpeed: 'fast' };
    const url = new URL(buildShareUrl(state, DEFAULTS));
    expect(url.searchParams.get('speed')).toBe('fast');
  });

  it('userLocation → origin param', () => {
    const state: AppState = { ...DEFAULTS, userLocation: { lat: 37.5665, lng: 126.978 } };
    const url = new URL(buildShareUrl(state, DEFAULTS));
    expect(url.searchParams.get('origin')).toBe('37.5665,126.978');
  });

  it('destination → dest param', () => {
    const state: AppState = { ...DEFAULTS, destination: { lat: 35.1796, lng: 129.0756 } };
    const url = new URL(buildShareUrl(state, DEFAULTS));
    expect(url.searchParams.get('dest')).toBe('35.1796,129.0756');
  });

  it('default tileTheme → no theme param', () => {
    const url = new URL(buildShareUrl(DEFAULTS, DEFAULTS));
    expect(url.searchParams.has('theme')).toBe(false);
  });
});
