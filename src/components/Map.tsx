'use client';

import { useEffect } from 'react';
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { BinMarker } from './BinMarker';
import { UserMarker } from './UserMarker';
import {
  pathPositions,
  type DistanceMode,
  type LatLng,
} from '@/lib/geo';
import type { TrashBin } from '@/lib/types';

type Props = {
  bins: TrashBin[];
  userLocation?: LatLng | null;
  highlightBin?: TrashBin | null;
  distanceMode?: DistanceMode;
  onMapClick?: (latlng: LatLng) => void;
  tapMode?: boolean;
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

function DistanceLine({
  origin,
  target,
  mode,
}: {
  origin: LatLng;
  target: LatLng;
  mode: DistanceMode;
}) {
  return (
    <Polyline
      positions={pathPositions(origin, target, mode)}
      pathOptions={{
        color: '#0ea5e9',
        weight: 3,
        opacity: 0.75,
        dashArray: '6 6',
      }}
      interactive={false}
    />
  );
}

export function Map({
  bins,
  userLocation,
  highlightBin,
  distanceMode = 'euclidean',
  onMapClick,
  tapMode = false,
}: Props) {
  return (
    <div
      className={tapMode ? 'tap-mode-active' : undefined}
      style={{ height: '100%', width: '100%' }}
    >
    <MapContainer
      center={JUNGGU_CENTER}
      zoom={14}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {bins.map((bin) => (
        <BinMarker key={bin.id} bin={bin} />
      ))}
      {highlightBin && <HighlightRing bin={highlightBin} />}
      {userLocation && highlightBin && (
        <DistanceLine
          origin={userLocation}
          target={{ lat: highlightBin.lat, lng: highlightBin.lng }}
          mode={distanceMode}
        />
      )}
      {userLocation && <UserMarker position={userLocation} />}
      <PanToUser target={userLocation} />
      {onMapClick && <MapClickHandler onClick={onMapClick} />}
    </MapContainer>
    </div>
  );
}

export default Map;
