import { describe, expect, it, vi } from 'vitest';
import {
  attachMarkerClusterLayer,
  canMountMarkerClusterLayer,
} from '../marker-cluster-layer';
import type { TrashBin } from '../types';

function makeBin(id: string): TrashBin {
  return {
    id,
    name: `휴지통 ${id}`,
    sido: '서울특별시',
    sigungu: '중구',
    roadAddress: '서울 중구 어딘가',
    lat: 37.56,
    lng: 126.99,
    types: ['일반'],
    updatedAt: '2026-05-06',
  };
}

describe('canMountMarkerClusterLayer', () => {
  it('returns false without window/document', () => {
    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;

    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);

    expect(canMountMarkerClusterLayer()).toBe(false);

    vi.stubGlobal('window', originalWindow);
    vi.stubGlobal('document', originalDocument);
  });
});

describe('attachMarkerClusterLayer', () => {
  it('adds cluster group to the map and cleans it up on unmount', async () => {
    const popupRoots = [{ render: vi.fn(), unmount: vi.fn() }, { render: vi.fn(), unmount: vi.fn() }];
    const createPopupRoot = vi
      .fn()
      .mockReturnValueOnce(popupRoots[0])
      .mockReturnValueOnce(popupRoots[1]);
    const popupContainers = [{}, {}];
    const markerA = { on: vi.fn(), bindPopup: vi.fn() };
    const markerB = { on: vi.fn(), bindPopup: vi.fn() };
    const clusterGroup = {
      addLayer: vi.fn(),
      addTo: vi.fn(),
      clearLayers: vi.fn(),
    };
    const map = {
      hasLayer: vi.fn(() => true),
      removeLayer: vi.fn(),
    };
    const leaflet = {
      markerClusterGroup: vi.fn(() => clusterGroup),
      marker: vi
        .fn()
        .mockReturnValueOnce(markerA)
        .mockReturnValueOnce(markerB),
    };

    vi.stubGlobal('window', {});
    vi.stubGlobal('document', { createElement: vi.fn(() => popupContainers.shift()) });

    const cleanup = attachMarkerClusterLayer({
      bins: [makeBin('a'), makeBin('b')],
      favorites: new Set(['b']),
      hasCandidates: true,
      highlightRanks: new Map([['a', 1]]),
      importMarkerCluster: () => Promise.resolve({}),
      leaflet,
      map,
      clusterBreakZoom: 15,
      createIcon: vi.fn(() => ({ icon: true })),
      createPopupRoot,
      popupContentFactory: (bin, isFavorite, onUse) => ({ bin, isFavorite, onUse }),
      onMarkerClick: vi.fn(),
      onToggleFavorite: vi.fn(),
      onUseForBin: vi.fn(() => vi.fn()),
    });

    await Promise.resolve();

    expect(leaflet.markerClusterGroup).toHaveBeenCalledWith({
      chunkedLoading: true,
      disableClusteringAtZoom: 15,
    });
    expect(clusterGroup.addLayer).toHaveBeenCalledTimes(2);
    expect(clusterGroup.addTo).toHaveBeenCalledWith(map);
    expect(createPopupRoot).toHaveBeenCalledTimes(2);

    cleanup();

    expect(popupRoots[0].unmount).toHaveBeenCalledTimes(1);
    expect(popupRoots[1].unmount).toHaveBeenCalledTimes(1);
    expect(clusterGroup.clearLayers).toHaveBeenCalledTimes(1);
    expect(map.removeLayer).toHaveBeenCalledWith(clusterGroup);
  });
});
