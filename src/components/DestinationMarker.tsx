'use client';

import L from 'leaflet';
import { Marker } from 'react-leaflet';
import type { LatLng } from '@/lib/geo';

const DEST_ICON = L.divIcon({
  html: `<span class="dest-flag" aria-hidden>🏁</span>`,
  className: 'dest-marker',
  iconSize: [28, 28],
  iconAnchor: [14, 26],
});

type Props = {
  position: LatLng;
};

export function DestinationMarker({ position }: Props) {
  return (
    <Marker position={[position.lat, position.lng]} icon={DEST_ICON} interactive={false} />
  );
}
