'use client';

import { useEffect } from 'react';
import { Circle, MapContainer, TileLayer, useMap } from 'react-leaflet';
import { BinMarker } from './BinMarker';
import { UserMarker } from './UserMarker';
import type { LatLng } from '@/lib/geo';
import type { TrashBin } from '@/lib/types';

type Props = {
  bins: TrashBin[];
  userLocation?: LatLng | null;
  highlightBinId?: string | null;
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

function HighlightRing({ bin }: { bin: TrashBin }) {
  return (
    <Circle
      center={[bin.lat, bin.lng]}
      radius={28}
      pathOptions={{
        color: '#facc15',
        weight: 3,
        fillColor: '#facc15',
        fillOpacity: 0.18,
      }}
      interactive={false}
    />
  );
}

export function Map({ bins, userLocation, highlightBinId }: Props) {
  const highlight = highlightBinId
    ? bins.find((b) => b.id === highlightBinId) ?? null
    : null;

  return (
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
      {highlight && <HighlightRing bin={highlight} />}
      {userLocation && <UserMarker position={userLocation} />}
      <PanToUser target={userLocation} />
    </MapContainer>
  );
}

export default Map;
