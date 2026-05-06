'use client';

import '@/lib/leaflet-globals';
import 'leaflet.markercluster';
import L from 'leaflet';
import {
  createElementObject,
  createLayerComponent,
  extendContext,
  type LeafletContextInterface,
} from '@react-leaflet/core';
import type { ReactNode } from 'react';

type Props = L.MarkerClusterGroupOptions & {
  children?: ReactNode;
};

export const MarkerClusterGroup = createLayerComponent<L.MarkerClusterGroup, Props>(
  function createClusterGroup({ children: _c, ...options }, ctx: LeafletContextInterface) {
    const group = L.markerClusterGroup(options);
    return createElementObject(group, extendContext(ctx, { layerContainer: group }));
  },
);
