import { describe, expect, it } from 'vitest';
import { getZoomAnchor } from './zoom-anchor';

describe('getZoomAnchor', () => {
  it('returns midpoint when origin and destination exist', () => {
    expect(
      getZoomAnchor(
        { lat: 37.56, lng: 126.98 },
        { lat: 37.58, lng: 127.02 },
      ),
    ).toEqual({ lat: 37.57, lng: 127 });
  });

  it('returns origin when only origin exists', () => {
    const origin = { lat: 37.56, lng: 126.98 };

    expect(getZoomAnchor(origin, null)).toBe(origin);
  });

  it('returns null when only destination exists', () => {
    expect(getZoomAnchor(null, { lat: 37.58, lng: 127.02 })).toBeNull();
  });

  it('returns null when origin and destination are both null', () => {
    expect(getZoomAnchor(null, null)).toBeNull();
  });
});
