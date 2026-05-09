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

const STYLE: Record<
  TileTheme,
  { halo: string; haloWeight: number; haloOpacity: number; inner: string; innerWeight: number }
> = {
  dark: { halo: '#000000', haloWeight: 4, haloOpacity: 0.55, inner: '#fbbf24', innerWeight: 1.5 },
  light: { halo: '#ffffff', haloWeight: 5, haloOpacity: 0.9, inner: '#1e40af', innerWeight: 2.5 },
};

export function DistrictOutline({ geoJson, code, name, tileTheme }: Props) {
  const feature = geoJson.features.find((f) => f.properties.code === code);
  if (!feature) return null;
  const data = feature as unknown as Feature;
  const { halo, haloWeight, haloOpacity, inner, innerWeight } = STYLE[tileTheme];

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
          weight: haloWeight,
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
          weight: innerWeight,
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
