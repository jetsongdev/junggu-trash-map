'use client';

import ReactDOM from 'react-dom';

const TILE_ORIGINS = [
  'https://tile.openstreetmap.org',
  'https://a.basemaps.cartocdn.com',
  'https://b.basemaps.cartocdn.com',
  'https://c.basemaps.cartocdn.com',
  'https://d.basemaps.cartocdn.com',
];

const DNS_PREFETCH = ['https://nominatim.openstreetmap.org'];

export function PreloadResources(): null {
  for (const origin of TILE_ORIGINS) {
    ReactDOM.preconnect(origin, { crossOrigin: '' });
  }
  for (const origin of DNS_PREFETCH) {
    ReactDOM.prefetchDNS(origin);
  }
  return null;
}
