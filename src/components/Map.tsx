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
import { UserMarker } from './UserMarker';
import {
  pathPositions,
  routePositions,
  type DistanceMode,
  type LatLng,
} from '@/lib/geo';
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
  tapMode?: boolean;
  tileTheme?: TileTheme;
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

const DISTANCE_LINE_STYLE: Record<1 | 2 | 3, { color: string; weight: number; opacity: number }> = {
  1: { color: '#0ea5e9', weight: 3, opacity: 0.85 },
  2: { color: '#7dd3fc', weight: 2, opacity: 0.6 },
  3: { color: '#bae6fd', weight: 1.5, opacity: 0.4 },
};

function DistanceLine({
  origin,
  target,
  mode,
  rank = 1,
}: {
  origin: LatLng;
  target: LatLng;
  mode: DistanceMode;
  rank?: 1 | 2 | 3;
}) {
  const style = DISTANCE_LINE_STYLE[rank];
  return (
    <Polyline
      positions={pathPositions(origin, target, mode)}
      pathOptions={{
        color: style.color,
        weight: style.weight,
        opacity: style.opacity,
        dashArray: '6 6',
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
  tapMode = false,
  tileTheme = 'dark',
}: Props) {
  const preset = TILE_PRESETS[tileTheme];
  const primaryHighlight = highlights[0] ?? null;
  const showRoute = !!(userLocation && destination && primaryHighlight);
  const showDistanceOnly = !!(userLocation && primaryHighlight && !destination);
  const highlightRanks = new globalThis.Map(
    highlights.map((bin, index) => [bin.id, (index + 1) as 1 | 2 | 3]),
  );
  const hasCandidates = highlights.length > 0;
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
      {bins.map((bin) => {
        const rank = highlightRanks.get(bin.id);
        return (
          <BinMarker
            key={bin.id}
            bin={bin}
            rank={rank}
            dimmed={hasCandidates && !rank}
          />
        );
      })}
      {primaryHighlight && <HighlightRing bin={primaryHighlight} />}
      {showDistanceOnly &&
        highlights.map((bin, i) => (
          <DistanceLine
            key={bin.id}
            origin={userLocation!}
            target={{ lat: bin.lat, lng: bin.lng }}
            mode={distanceMode}
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
    </MapContainer>
    </div>
  );
}

export default Map;
