import { CLUSTER_BREAK_ZOOM } from './map-cluster';
import type { TrashBin } from './types';

export type MarkerClusterRank = 1 | 2 | 3;

type PopupRootLike = {
  render(node: unknown): void;
  unmount(): void;
};

type MarkerLike = {
  on(event: string, handler: () => void): void;
  bindPopup(container: unknown): void;
};

type MarkerClusterGroupLike = {
  addLayer(marker: MarkerLike): void;
  addTo(map: unknown): unknown;
  clearLayers(): void;
};

type MapLike = {
  hasLayer(layer: unknown): boolean;
  removeLayer(layer: unknown): unknown;
};

type LeafletLike = {
  markerClusterGroup(options: {
    chunkedLoading: boolean;
    disableClusteringAtZoom: number;
  }): MarkerClusterGroupLike;
  marker(latlng: unknown, options?: unknown): MarkerLike;
};

export function canMountMarkerClusterLayer(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function attachMarkerClusterLayer({
  bins,
  favorites,
  hasCandidates,
  highlightRanks,
  importMarkerCluster,
  leaflet,
  map,
  clusterBreakZoom = CLUSTER_BREAK_ZOOM,
  createIcon,
  createPopupRoot,
  popupContentFactory,
  onMarkerClick,
  onToggleFavorite,
  onUseForBin,
}: {
  bins: TrashBin[];
  favorites?: Set<string>;
  hasCandidates: boolean;
  highlightRanks: Map<string, MarkerClusterRank>;
  importMarkerCluster: () => Promise<unknown>;
  leaflet: LeafletLike;
  map: MapLike;
  clusterBreakZoom?: number;
  createIcon: (bin: TrashBin, rank: MarkerClusterRank | undefined) => unknown;
  createPopupRoot: (container: unknown) => PopupRootLike;
  popupContentFactory: (
    bin: TrashBin,
    isFavorite: boolean,
    onUse: (() => void) | undefined,
  ) => unknown;
  onMarkerClick: () => void;
  onToggleFavorite?: (binId: string) => void;
  onUseForBin?: (bin: TrashBin) => (() => void) | undefined;
}): () => void {
  let disposed = false;
  let cleanup = () => {};

  void (async () => {
    if (!canMountMarkerClusterLayer()) return;

    await importMarkerCluster();
    if (disposed) return;

    const clusterGroup = leaflet.markerClusterGroup({
      chunkedLoading: true,
      disableClusteringAtZoom: clusterBreakZoom,
    });
    const popupRoots: PopupRootLike[] = [];

    for (const bin of bins) {
      const rank = highlightRanks.get(bin.id);
      const marker = leaflet.marker([bin.lat, bin.lng], {
        icon: createIcon(bin, rank),
      });

      marker.on('click', onMarkerClick);

      const popupContainer = document.createElement('div');
      const popupRoot = createPopupRoot(popupContainer);
      popupRoots.push(popupRoot);
      popupRoot.render(
        popupContentFactory(
          bin,
          favorites?.has(bin.id) ?? false,
          onUseForBin?.(bin),
        ),
      );

      marker.bindPopup(popupContainer);
      clusterGroup.addLayer(marker);
    }

    clusterGroup.addTo(map);

    cleanup = () => {
      for (const popupRoot of popupRoots) {
        popupRoot.unmount();
      }
      clusterGroup.clearLayers();
      if (map.hasLayer(clusterGroup)) {
        map.removeLayer(clusterGroup);
      }
    };

    if (disposed) {
      cleanup();
    }
  })();

  return () => {
    disposed = true;
    cleanup();
  };
}
