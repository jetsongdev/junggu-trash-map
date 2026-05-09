import type { TrashBin } from './types';

type ShortcutTarget = {
  tagName?: string;
  isContentEditable?: boolean;
};

type MapZoomShortcutOptions = {
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  target?: ShortcutTarget | null;
};

export type MapZoomShortcut = 'in' | 'out';

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

export function mapZoomShortcutForKey(
  key: string,
  options: MapZoomShortcutOptions = {},
): MapZoomShortcut | null {
  if (options.altKey || options.ctrlKey || options.metaKey) {
    return null;
  }

  const tagName = options.target?.tagName?.toUpperCase();
  if (
    options.target?.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  ) {
    return null;
  }

  if (key === '=') return 'in';
  if (key === '-') return 'out';
  return null;
}

export function shortcutTargetFromEventTarget(
  target: EventTarget | null,
): ShortcutTarget | null {
  if (typeof HTMLElement === 'undefined' || !(target instanceof HTMLElement)) {
    return null;
  }

  return {
    tagName: target.tagName,
    isContentEditable: target.isContentEditable,
  };
}
