'use client';

import { memo } from 'react';
import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import { BinPopup } from './BinPopup';
import type { TrashBin } from '@/lib/types';
import { styleFor } from '@/lib/types';

const ICON_CACHE = new Map<string, L.DivIcon>();

function iconKey(types: TrashBin['types']): string {
  return types.length >= 2 ? 'mixed' : types[0];
}

function makeIcon(types: TrashBin['types']): L.DivIcon {
  const { color, emoji } = styleFor(types);
  const isMixed = types.length >= 2;
  const width = isMixed ? 44 : 32;
  const fontSize = isMixed ? 15 : 18;
  const html = `<span style="
    display:inline-flex;align-items:center;justify-content:center;
    width:${width}px;height:32px;border-radius:9999px;
    background:${color};color:#fff;font-size:${fontSize}px;line-height:1;
    box-shadow:0 1px 4px rgba(0,0,0,0.35);
    border:2px solid #fff;
    white-space:nowrap;
  ">${emoji}</span>`;
  return L.divIcon({
    html,
    className: 'bin-marker',
    iconSize: [width, 32],
    iconAnchor: [width / 2, 16],
    popupAnchor: [0, -16],
  });
}

function getIcon(types: TrashBin['types']): L.DivIcon {
  const key = iconKey(types);
  let icon = ICON_CACHE.get(key);
  if (!icon) {
    icon = makeIcon(types);
    ICON_CACHE.set(key, icon);
  }
  return icon;
}

type Props = {
  bin: TrashBin;
};

function BinMarkerImpl({ bin }: Props) {
  return (
    <Marker position={[bin.lat, bin.lng]} icon={getIcon(bin.types)}>
      <Popup>
        <BinPopup bin={bin} />
      </Popup>
    </Marker>
  );
}

export const BinMarker = memo(BinMarkerImpl);
