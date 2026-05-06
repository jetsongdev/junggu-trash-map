export const CLUSTER_BREAK_ZOOM = 15;

export function shouldClusterMarkers(zoom: number): boolean {
  return zoom < CLUSTER_BREAK_ZOOM;
}

export function shouldDimNonHighlightMarker({
  zoom,
  hasCandidates,
  isHighlighted,
}: {
  zoom: number;
  hasCandidates: boolean;
  isHighlighted: boolean;
}): boolean {
  return !isHighlighted && hasCandidates && !shouldClusterMarkers(zoom);
}
