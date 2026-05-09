'use client';

import { GeoJSON } from 'react-leaflet';
import type { Feature } from 'geojson';
import type { DistrictsGeoJson } from '@/lib/point-in-district';
import type { DistrictCode } from '@/lib/types';
import type { TileTheme } from './Map';

type Props = {
  geoJson: DistrictsGeoJson;
  code: DistrictCode;
  tileTheme: TileTheme;
};

const STROKE: Record<TileTheme, string> = {
  dark: '#fbbf24',
  light: '#b45309',
};

export function DistrictOutline({ geoJson, code, tileTheme }: Props) {
  const feature = geoJson.features.find((f) => f.properties.code === code);
  if (!feature) return null;

  return (
    <GeoJSON
      key={code}
      data={feature as unknown as Feature}
      pathOptions={{
        color: STROKE[tileTheme],
        weight: 1.5,
        dashArray: '6 4',
        opacity: 0.7,
        fill: false,
        interactive: false,
      }}
    />
  );
}

export default DistrictOutline;
