import type { TrashBin } from '@/lib/types';

const STORAGE_KEY = 'favorites';

export function loadFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function saveFavorites(favorites: Set<string>): void {
  if (typeof window === 'undefined') return;
  if (favorites.size === 0) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, [...favorites].join(','));
}

export function toggleFavorite(favorites: Set<string>, binId: string): Set<string> {
  const next = new Set(favorites);
  if (next.has(binId)) {
    next.delete(binId);
  } else {
    next.add(binId);
  }
  return next;
}

export function isFavorite(favorites: Set<string>, binId: string): boolean {
  return favorites.has(binId);
}

export function filterByFavorites(bins: TrashBin[], favorites: Set<string>): TrashBin[] {
  if (favorites.size === 0) return [];
  return bins.filter((bin) => favorites.has(bin.id));
}
