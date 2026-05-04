'use client';

import L from 'leaflet';
import { Marker } from 'react-leaflet';
import type { LatLng } from '@/lib/geo';

const ICON_SIZE = 80;
const ICON_HALF = ICON_SIZE / 2;

function makeIcon(heading: number | null): L.DivIcon {
  const cone =
    heading != null
      ? `<span class="user-cone" style="transform:rotate(${heading.toFixed(1)}deg)" aria-hidden></span>`
      : '';
  return L.divIcon({
    html: `<span class="user-marker-inner">${cone}<span class="user-dot" aria-hidden></span></span>`,
    className: 'user-marker',
    iconSize: [ICON_SIZE, ICON_SIZE],
    iconAnchor: [ICON_HALF, ICON_HALF],
  });
}

const DEFAULT_ICON = makeIcon(null);

type Props = {
  position: LatLng;
  heading?: number | null;
};

export function UserMarker({ position, heading }: Props) {
  const icon = heading != null ? makeIcon(heading) : DEFAULT_ICON;
  return <Marker position={[position.lat, position.lng]} icon={icon} interactive={false} />;
}
