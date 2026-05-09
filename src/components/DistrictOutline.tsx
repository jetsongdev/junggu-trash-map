'use client';

import { GeoJSON } from 'react-leaflet';
import type { Feature } from 'geojson';
import type { Layer } from 'leaflet';
import type { DistrictsGeoJson } from '@/lib/point-in-district';
import type { DistrictCode } from '@/lib/types';
import type { TileTheme } from './Map';

type Props = {
  geoJson: DistrictsGeoJson;
  code: DistrictCode;
  name: string;
  tileTheme: TileTheme;
};

const STYLE: Record<TileTheme, { halo: string; inner: string; haloOpacity: number }> = {
  dark: { halo: '#000000', inner: '#fbbf24', haloOpacity: 0.55 },
  light: { halo: '#ffffff', inner: '#1e293b', haloOpacity: 0.85 },
};

export function DistrictOutline({ geoJson, code, name, tileTheme }: Props) {
  const feature = geoJson.features.find((f) => f.properties.code === code);
  if (!feature) return null;
  const data = feature as unknown as Feature;
  const { halo, inner, haloOpacity } = STYLE[tileTheme];

  const bindName = (_: Feature, layer: Layer) => {
    layer.bindTooltip(name, {
      permanent: true,
      direction: 'center',
      className: `district-name-tooltip district-name-tooltip-${tileTheme}`,
      sticky: false,
      interactive: false,
    });
  };

  return (
    <>
      <GeoJSON
        key={`${code}-halo-${tileTheme}`}
        data={data}
        pathOptions={{
          color: halo,
          weight: 4,
          opacity: haloOpacity,
          fill: false,
          interactive: false,
        }}
      />
      <GeoJSON
        key={`${code}-inner-${tileTheme}`}
        data={data}
        pathOptions={{
          color: inner,
          weight: 1.5,
          dashArray: '6 4',
          opacity: 0.95,
          fill: false,
          interactive: false,
        }}
        onEachFeature={bindName}
      />
    </>
  );
}

export default DistrictOutline;
