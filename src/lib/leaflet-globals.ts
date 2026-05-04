'use client';

import L from 'leaflet';

if (typeof window !== 'undefined') {
  const w = window as Window & { L?: typeof L };
  if (!w.L) {
    w.L = L;
  }
}

export {};
