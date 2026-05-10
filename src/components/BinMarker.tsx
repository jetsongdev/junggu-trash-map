'use client';

import { memo, useMemo } from 'react';
import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import { BinPopup } from './BinPopup';
import { binMarkerLabel } from '@/lib/a11y';
import { HAPTIC, vibrate } from '@/lib/haptic';
import type { TrashBin } from '@/lib/types';
import { styleFor } from '@/lib/types';

const ICON_CACHE = new Map<string, L.DivIcon>();
type Rank = 1 | 2 | 3;

const RANK_STYLE: Record<Rank, { scale: number }> = {
  1: { scale: 1 },
  2: { scale: 0.75 },
  3: { scale: 0.625 },
};

function iconKey(types: TrashBin['types'], rank?: Rank, dimmed?: boolean): string {
  const { color } = styleFor(types);
  return `${types.length >= 2 ? 'mixed' : types[0]}:${color}:${rank ?? 0}:${dimmed ? 'd' : ''}`;
}

function makeIcon(types: TrashBin['types'], rank?: Rank, dimmed?: boolean): L.DivIcon {
  const { color, emoji } = styleFor(types);
  const isMixed = types.length >= 2;
  const baseWidth = isMixed ? 44 : 32;
  const baseHeight = 32;
  const baseFontSize = isMixed ? 15 : 18;
  const scale = rank ? RANK_STYLE[rank].scale : 1;
  const iconWidth = Math.round(baseWidth * scale);
  const iconHeight = Math.round(baseHeight * scale);
  const fontSize = Math.round(baseFontSize * scale);
  const opacity = dimmed ? 0.25 : 1;
  const html = `<span aria-hidden="true" style="
    display:inline-flex;align-items:center;justify-content:center;
    width:${iconWidth}px;height:${iconHeight}px;border-radius:9999px;
    background:${color};color:#fff;font-size:${fontSize}px;line-height:1;
    box-shadow:0 1px 4px rgba(0,0,0,0.35);
    border:2px solid #fff;
    white-space:nowrap;
    opacity:${opacity};
  ">${emoji}</span>`;
  return L.divIcon({
    html,
    className: 'bin-marker',
    iconSize: [iconWidth, iconHeight],
    iconAnchor: [Math.round(iconWidth / 2), Math.round(iconHeight / 2)],
    popupAnchor: [0, -16],
  });
}

function getIcon(types: TrashBin['types'], rank?: Rank, dimmed?: boolean): L.DivIcon {
  const key = iconKey(types, rank, dimmed);
  let icon = ICON_CACHE.get(key);
  if (!icon) {
    icon = makeIcon(types, rank, dimmed);
    ICON_CACHE.set(key, icon);
  }
  return icon;
}

type Props = {
  bin: TrashBin;
  rank?: Rank;
  dimmed?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (binId: string) => void;
  onUse?: (binId: string) => void;
};

function BinMarkerImpl({ bin, rank, dimmed, isFavorite, onToggleFavorite, onUse }: Props) {
  const position = useMemo<[number, number]>(() => [bin.lat, bin.lng], [bin.lat, bin.lng]);
  const eventHandlers = useMemo(
    () => ({
      click: () => vibrate(HAPTIC.SELECT),
    }),
    [],
  );
  const label = binMarkerLabel(bin);

  return (
    <Marker
      position={position}
      icon={getIcon(bin.types, rank, dimmed)}
      title={label}
      alt={label}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <BinPopup
          bin={bin}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          onUse={onUse}
        />
      </Popup>
    </Marker>
  );
}

export const BinMarker = memo(BinMarkerImpl);
