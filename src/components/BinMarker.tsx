'use client';

import { memo } from 'react';
import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import { BinPopup } from './BinPopup';
import { HAPTIC, vibrate } from '@/lib/haptic';
import type { TrashBin } from '@/lib/types';
import { styleFor } from '@/lib/types';

const ICON_CACHE = new Map<string, L.DivIcon>();
type Rank = 1 | 2 | 3;

const RANK_STYLE: Record<Rank, { opacity: number; scale: number }> = {
  1: { opacity: 1, scale: 1 },
  2: { opacity: 0.55, scale: 0.75 },
  3: { opacity: 0.35, scale: 0.625 },
};

function iconKey(types: TrashBin['types'], rank?: Rank): string {
  const { color } = styleFor(types);
  return `${types.length >= 2 ? 'mixed' : types[0]}:${color}:${rank ?? 0}`;
}

function makeIcon(types: TrashBin['types'], rank?: Rank): L.DivIcon {
  const { color, emoji } = styleFor(types);
  const isMixed = types.length >= 2;
  const baseWidth = isMixed ? 44 : 32;
  const baseHeight = 32;
  const baseFontSize = isMixed ? 15 : 18;
  const rankStyle = rank ? RANK_STYLE[rank] : RANK_STYLE[1];
  const iconWidth = Math.round(baseWidth * rankStyle.scale);
  const iconHeight = Math.round(baseHeight * rankStyle.scale);
  const fontSize = Math.round(baseFontSize * rankStyle.scale);
  const html = `<span style="
    display:inline-flex;align-items:center;justify-content:center;
    width:${iconWidth}px;height:${iconHeight}px;border-radius:9999px;
    background:${color};color:#fff;font-size:${fontSize}px;line-height:1;
    box-shadow:0 1px 4px rgba(0,0,0,0.35);
    border:2px solid #fff;
    white-space:nowrap;
    opacity:${rankStyle.opacity};
  ">${emoji}</span>`;
  return L.divIcon({
    html,
    className: 'bin-marker',
    iconSize: [iconWidth, iconHeight],
    iconAnchor: [Math.round(iconWidth / 2), Math.round(iconHeight / 2)],
    popupAnchor: [0, -16],
  });
}

function getIcon(types: TrashBin['types'], rank?: Rank): L.DivIcon {
  const key = iconKey(types, rank);
  let icon = ICON_CACHE.get(key);
  if (!icon) {
    icon = makeIcon(types, rank);
    ICON_CACHE.set(key, icon);
  }
  return icon;
}

type Props = {
  bin: TrashBin;
  rank?: Rank;
};

function BinMarkerImpl({ bin, rank }: Props) {
  return (
    <Marker
      position={[bin.lat, bin.lng]}
      icon={getIcon(bin.types, rank)}
      eventHandlers={{
        click: () => vibrate(HAPTIC.SELECT),
      }}
    >
      <Popup>
        <BinPopup bin={bin} />
      </Popup>
    </Marker>
  );
}

export const BinMarker = memo(BinMarkerImpl);
