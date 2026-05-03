import type { TileTheme } from '@/components/Map';
import type { DistanceMode, LatLng } from '@/lib/geo';
import type { WalkingSpeed } from '@/lib/eta';
import type { BinType } from '@/lib/types';

export type AppState = {
  selected: Set<BinType>;
  tileTheme: TileTheme;
  distanceMode: DistanceMode;
  walkingSpeed: WalkingSpeed;
  userLocation: LatLng | null;
  destination: LatLng | null;
};

export const BIN_TYPE_TO_ALIAS: Record<BinType, 'general' | 'recycle'> = {
  일반: 'general',
  재활용: 'recycle',
};

export const ALIAS_TO_BIN_TYPE: Record<'general' | 'recycle', BinType> = {
  general: '일반',
  recycle: '재활용',
};

const BIN_TYPE_ORDER: BinType[] = ['일반', '재활용'];

function parseBinTypes(raw: string | null): Set<BinType> | undefined {
  if (!raw) return undefined;

  const types = new Set<BinType>();
  for (const alias of raw.split(',')) {
    if (alias === 'general' || alias === 'recycle') {
      types.add(ALIAS_TO_BIN_TYPE[alias]);
    }
  }

  return types.size > 0 ? types : undefined;
}

function parseEnumValue<T extends string>(
  raw: string | null,
  allowed: readonly T[],
): T | undefined {
  if (!raw) return undefined;
  return allowed.includes(raw as T) ? (raw as T) : undefined;
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function parseLatLng(raw: string | null): LatLng | undefined {
  if (!raw) return undefined;

  const [latString, lngString, ...rest] = raw.split(',');
  if (!latString || !lngString || rest.length > 0) return undefined;

  const lat = Number.parseFloat(latString);
  const lng = Number.parseFloat(lngString);

  return isValidCoordinate(lat, lng) ? { lat, lng } : undefined;
}

function sameLatLng(a: LatLng | null, b: LatLng | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.lat === b.lat && a.lng === b.lng;
}

function sameTypes(a: Set<BinType>, b: Set<BinType>): boolean {
  if (a.size !== b.size) return false;
  for (const type of a) {
    if (!b.has(type)) return false;
  }
  return true;
}

function formatLatLng(value: LatLng): string {
  return `${value.lat},${value.lng}`;
}

export function parseUrlParams(searchParams: URLSearchParams): Partial<AppState> {
  const nextState: Partial<AppState> = {};

  const types = parseBinTypes(searchParams.get('types'));
  if (types) nextState.selected = types;

  const tileTheme = parseEnumValue(searchParams.get('theme'), ['dark', 'light']);
  if (tileTheme) nextState.tileTheme = tileTheme;

  const distanceMode = parseEnumValue(searchParams.get('mode'), [
    'manhattan',
    'euclidean',
  ]);
  if (distanceMode) nextState.distanceMode = distanceMode;

  const walkingSpeed = parseEnumValue(searchParams.get('speed'), [
    'slow',
    'normal',
    'fast',
  ]);
  if (walkingSpeed) nextState.walkingSpeed = walkingSpeed;

  const userLocation = parseLatLng(searchParams.get('origin'));
  if (userLocation) nextState.userLocation = userLocation;

  const destination = parseLatLng(searchParams.get('dest'));
  if (destination) nextState.destination = destination;

  return nextState;
}

export function buildShareUrl(state: AppState, defaults: AppState): string {
  const url = new URL(window.location.pathname, window.location.origin);

  if (!sameTypes(state.selected, defaults.selected)) {
    const aliases = BIN_TYPE_ORDER.filter((type) => state.selected.has(type)).map(
      (type) => BIN_TYPE_TO_ALIAS[type],
    );
    if (aliases.length > 0) {
      url.searchParams.set('types', aliases.join(','));
    }
  }

  if (state.tileTheme !== defaults.tileTheme) {
    url.searchParams.set('theme', state.tileTheme);
  }

  if (state.distanceMode !== defaults.distanceMode) {
    url.searchParams.set('mode', state.distanceMode);
  }

  if (state.walkingSpeed !== defaults.walkingSpeed) {
    url.searchParams.set('speed', state.walkingSpeed);
  }

  if (!sameLatLng(state.userLocation, defaults.userLocation) && state.userLocation) {
    url.searchParams.set('origin', formatLatLng(state.userLocation));
  }

  if (!sameLatLng(state.destination, defaults.destination) && state.destination) {
    url.searchParams.set('dest', formatLatLng(state.destination));
  }

  return url.toString();
}
