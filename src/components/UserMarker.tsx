'use client';

import L from 'leaflet';
import { Marker } from 'react-leaflet';
import type { LatLng } from '@/lib/geo';

const USER_ICON = L.divIcon({
  html: `<span class="user-dot" aria-hidden></span>`,
  className: 'user-marker',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

type Props = {
  position: LatLng;
};

export function UserMarker({ position }: Props) {
  return <Marker position={[position.lat, position.lng]} icon={USER_ICON} interactive={false} />;
}
