import { describe, expect, it } from 'vitest';
import {
  CLUSTER_BREAK_ZOOM,
  shouldClusterMarkers,
  shouldDimNonHighlightMarker,
} from '../map-cluster';

describe('marker clustering zoom threshold', () => {
  it('clusters markers below zoom 15', () => {
    expect(CLUSTER_BREAK_ZOOM).toBe(15);
    expect(shouldClusterMarkers(14)).toBe(true);
  });

  it('shows individual markers from zoom 15', () => {
    expect(shouldClusterMarkers(15)).toBe(false);
    expect(shouldClusterMarkers(16)).toBe(false);
  });
});

describe('Top-3 dimming rule', () => {
  it('does not dim non-highlight markers while clusters are visible', () => {
    expect(
      shouldDimNonHighlightMarker({
        zoom: 14,
        hasCandidates: true,
        isHighlighted: false,
      }),
    ).toBe(false);
  });

  it('dims non-highlight markers only at zoom 15+ when highlights exist', () => {
    expect(
      shouldDimNonHighlightMarker({
        zoom: 15,
        hasCandidates: true,
        isHighlighted: false,
      }),
    ).toBe(true);
  });

  it('never dims highlighted markers', () => {
    expect(
      shouldDimNonHighlightMarker({
        zoom: 16,
        hasCandidates: true,
        isHighlighted: true,
      }),
    ).toBe(false);
  });
});
