'use client';

import { useEffect } from 'react';
import '@/lib/leaflet-globals';
import 'leaflet-rotate/dist/leaflet-rotate.js';
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { BinMarker } from './BinMarker';
import { DestinationMarker } from './DestinationMarker';
import { MarkerClusterGroup } from './MarkerClusterGroup';
import { UserMarker } from './UserMarker';
import {
  findOptimalDetour,
  findNearest,
  pathPositions,
  routePositions,
  type DistanceMode,
  type LatLng,
} from '@/lib/geo';
import { etaSeconds } from '@/lib/eta';
import type { TrashBin } from '@/lib/types';

type RotatedMap = ReturnType<typeof useMap> & {
  setBearing?: (theta: number) => void;
  getBearing?: () => number;
};

export type TileTheme = 'light' | 'dark';

type TilePreset = {
  url: string;
  attribution: string;
  subdomains: string;
  maxZoom: number;
};

const TILE_PRESETS: Record<TileTheme, TilePreset> = {
  light: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    maxZoom: 19,
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  },
};

type Props = {
  bins: TrashBin[];
  userLocation?: LatLng | null;
  userHeading?: number | null;
  mapBearing?: number | null;
  destination?: LatLng | null;
  highlights?: TrashBin[];
  focusTarget?: LatLng | null;
  distanceMode?: DistanceMode;
  onMapClick?: (latlng: LatLng) => void;
  onCenterChange?: (latlng: LatLng) => void;
  tapMode?: boolean;
  tileTheme?: TileTheme;
  favorites?: Set<string>;
  onToggleFavorite?: (binId: string) => void;
  walkingSpeed?: number;
  onUse?: (binId: string, extraMeters: number, extraSeconds: number) => void;
};

const JUNGGU_CENTER: [number, number] = [37.5635, 126.987];

function PanToUser({ target }: { target: LatLng | null | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 16), {
      duration: 0.6,
    });
  }, [map, target]);
  return null;
}

function BearingController({ bearing }: { bearing: number | null }) {
  const map = useMap() as RotatedMap;
  useEffect(() => {
    if (typeof map.setBearing !== 'function') return;
    map.setBearing(bearing ?? 0);
  }, [map, bearing]);
  return null;
}

function MapClickHandler({ onClick }: { onClick: (ll: LatLng) => void }) {
  useMapEvents({
    click: (e) => onClick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

function MapMoveHandler({ onCenterChange }: { onCenterChange: (ll: LatLng) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const c = map.getCenter();
      onCenterChange({ lat: c.lat, lng: c.lng });
    },
  });
  return null;
}

function HighlightRing({ bin }: { bin: TrashBin }) {
  return (
    <CircleMarker
      center={[bin.lat, bin.lng]}
      radius={26}
      pathOptions={{
        color: '#f97316',
        weight: 4,
        fillColor: '#fde047',
        fillOpacity: 0.45,
        className: 'highlight-ring',
      }}
      interactive={false}
    />
  );
}

// Dark tile uses sky scale that pops on CartoDB Dark Matter.
// Light tile uses slate scale — neutral gray-blue avoids clashing with sky-tinted bin markers and UserMarker.
const DISTANCE_LINE_STYLE: Record<
  TileTheme,
  Record<1 | 2 | 3, { color: string; weight: number; opacity: number; dashArray?: string }>
> = {
  dark: {
    1: { color: '#0ea5e9', weight: 4, opacity: 0.85 },
    2: { color: '#7dd3fc', weight: 2.5, opacity: 0.75, dashArray: '8 6' },
    3: { color: '#bae6fd', weight: 2, opacity: 0.7, dashArray: '3 5' },
  },
  light: {
    1: { color: '#1e293b', weight: 4, opacity: 0.9 },
    2: { color: '#475569', weight: 2.5, opacity: 0.85, dashArray: '8 6' },
    3: { color: '#64748b', weight: 2, opacity: 0.9, dashArray: '3 5' },
  },
};

function DistanceLine({
  origin,
  target,
  mode,
  rank = 1,
  tileTheme,
}: {
  origin: LatLng;
  target: LatLng;
  mode: DistanceMode;
  rank?: 1 | 2 | 3;
  tileTheme: TileTheme;
}) {
  const style = DISTANCE_LINE_STYLE[tileTheme][rank];
  return (
    <Polyline
      positions={pathPositions(origin, target, mode)}
      pathOptions={{
        color: style.color,
        weight: style.weight,
        opacity: style.opacity,
        dashArray: style.dashArray,
      }}
      interactive={false}
    />
  );
}

function RouteLine({
  origin,
  via,
  destination,
  mode,
}: {
  origin: LatLng;
  via: LatLng;
  destination: LatLng;
  mode: DistanceMode;
}) {
  return (
    <Polyline
      positions={routePositions(origin, via, destination, mode)}
      pathOptions={{
        color: '#22d3ee',
        weight: 4,
        opacity: 0.85,
        dashArray: '8 6',
      }}
      interactive={false}
    />
  );
}

export function Map({
  bins,
  userLocation,
  userHeading,
  mapBearing,
  destination,
  highlights = [],
  focusTarget,
  distanceMode = 'euclidean',
  onMapClick,
  onCenterChange,
  tapMode = false,
  tileTheme = 'dark',
  favorites,
  onToggleFavorite,
  walkingSpeed = 4,
  onUse,
}: Props) {
  const preset = TILE_PRESETS[tileTheme];
  const primaryHighlight = highlights[0] ?? null;
  const showRoute = !!(userLocation && destination && primaryHighlight);
  const showDistanceOnly = !!(userLocation && primaryHighlight && !destination);
  const highlightRanks = new globalThis.Map(
    highlights.map((bin, index) => [bin.id, (index + 1) as 1 | 2 | 3]),
  );
  const hasCandidates = highlights.length > 0;

  const handleUse = (bin: TrashBin) => {
    if (!onUse || !userLocation) return;

    if (destination) {
      const route = findOptimalDetour([bin], userLocation, destination, distanceMode);
      if (!route) return;
      const extraMeters = route.cost.extra;
      onUse(bin.id, extraMeters, etaSeconds(extraMeters, walkingSpeed));
      return;
    }

    const nearest = findNearest([bin], userLocation, distanceMode);
    if (!nearest) return;
    onUse(bin.id, nearest.meters, etaSeconds(nearest.meters, walkingSpeed));
  };

  return (
    <div
      className={[
        tapMode ? 'tap-mode-active' : '',
        tileTheme === 'dark' ? 'tile-theme-dark' : '',
      ]
        .filter(Boolean)
        .join(' ') || undefined}
      style={{ height: '100%', width: '100%' }}
    >
    <MapContainer
      center={JUNGGU_CENTER}
      zoom={14}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
      {...({ rotate: true, rotateControl: false, touchRotate: false, bearing: 0 } as object)}
    >
      <TileLayer
        key={tileTheme}
        attribution={preset.attribution}
        url={preset.url}
        subdomains={preset.subdomains}
        maxZoom={preset.maxZoom}
      />
      <MarkerClusterGroup
        disableClusteringAtZoom={15}
        spiderfyOnMaxZoom={false}
        showCoverageOnHover={false}
        chunkedLoading
      >
        {bins.map((bin) => {
          const rank = highlightRanks.get(bin.id);
          return (
            <BinMarker
              key={bin.id}
              bin={bin}
              rank={rank}
              dimmed={hasCandidates && !rank}
              isFavorite={favorites?.has(bin.id) ?? false}
              onToggleFavorite={onToggleFavorite}
              onUse={onUse && userLocation ? () => handleUse(bin) : undefined}
            />
          );
        })}
      </MarkerClusterGroup>
      {primaryHighlight && <HighlightRing bin={primaryHighlight} />}
      {showDistanceOnly &&
        highlights.map((bin, i) => (
          <DistanceLine
            key={bin.id}
            origin={userLocation!}
            target={{ lat: bin.lat, lng: bin.lng }}
            mode={distanceMode}
            tileTheme={tileTheme}
            rank={(i + 1) as 1 | 2 | 3}
          />
        ))}
      {showRoute && (
        <RouteLine
          origin={userLocation!}
          via={{ lat: primaryHighlight!.lat, lng: primaryHighlight!.lng }}
          destination={destination!}
          mode={distanceMode}
        />
      )}
      {showRoute &&
        highlights.slice(1).map((bin, i) => (
          <DistanceLine
            key={bin.id}
            origin={userLocation!}
            target={{ lat: bin.lat, lng: bin.lng }}
            mode={distanceMode}
            tileTheme={tileTheme}
            rank={(i + 2) as 2 | 3}
          />
        ))}
      {userLocation && (
        <UserMarker
          position={userLocation}
          heading={
            userHeading != null ? userHeading + (mapBearing ?? 0) : null
          }
        />
      )}
      {destination && <DestinationMarker position={destination} />}
      <PanToUser target={userLocation} />
      <PanToUser target={focusTarget} />
      <BearingController bearing={mapBearing ?? 0} />
      {onMapClick && <MapClickHandler onClick={onMapClick} />}
      {onCenterChange && <MapMoveHandler onCenterChange={onCenterChange} />}
    </MapContainer>
    </div>
  );
}

export default Map;
