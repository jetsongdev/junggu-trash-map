import type { TrashBin } from './types';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const FOCUS_VISIBLE_CLASS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white motion-reduce:transition-none dark:focus-visible:ring-offset-neutral-950';

export function prefersReducedMotion(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }

  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function binMarkerLabel(bin: TrashBin): string {
  return `${bin.name} 휴지통 (${bin.types.join(', ')})`;
}

export function clusterMarkerLabel(count: number): string {
  return `휴지통 ${count}개 그룹`;
}
