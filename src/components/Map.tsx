'use client';

import { MapContainer, TileLayer } from 'react-leaflet';
import { BinMarker } from './BinMarker';
import type { TrashBin } from '@/lib/types';

type Props = {
  bins: TrashBin[];
};

const JUNGGU_CENTER: [number, number] = [37.5635, 126.9870];

export function Map({ bins }: Props) {
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
    </MapContainer>
  );
}

export default Map;
