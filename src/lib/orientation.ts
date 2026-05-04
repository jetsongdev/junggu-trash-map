'use client';

import { useEffect, useRef, useState } from 'react';

const THROTTLE_MS = 150;

type Permission = 'unsupported' | 'prompt' | 'granted' | 'denied';

type DeviceOrientationEventStatic = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

type OrientationLike = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

function readHeading(e: OrientationLike): number | null {
  if (typeof e.webkitCompassHeading === 'number') {
    return e.webkitCompassHeading;
  }
  if (e.alpha == null) return null;
  return (360 - e.alpha) % 360;
}

export function useDeviceHeading(enabled: boolean) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<Permission>('prompt');
  const [heading, setHeading] = useState<number | null>(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('DeviceOrientationEvent' in window)) {
      setSupported(false);
      setPermission('unsupported');
      return;
    }
    setSupported(true);
    const DOE = window.DeviceOrientationEvent as DeviceOrientationEventStatic;
    if (typeof DOE.requestPermission !== 'function') {
      setPermission('granted');
    }
  }, []);

  useEffect(() => {
    if (!enabled || !supported || permission !== 'granted') {
      setHeading(null);
      return;
    }
    const handler = (e: Event) => {
      const h = readHeading(e as OrientationLike);
      if (h == null || !Number.isFinite(h)) return;
      const now = Date.now();
      if (now - lastUpdateRef.current < THROTTLE_MS) return;
      lastUpdateRef.current = now;
      setHeading(h);
    };
    window.addEventListener('deviceorientationabsolute', handler as EventListener);
    window.addEventListener('deviceorientation', handler as EventListener);
    return () => {
      window.removeEventListener('deviceorientationabsolute', handler as EventListener);
      window.removeEventListener('deviceorientation', handler as EventListener);
    };
  }, [enabled, supported, permission]);

  const request = async (): Promise<Permission> => {
    if (typeof window === 'undefined') return 'unsupported';
    const DOE = window.DeviceOrientationEvent as DeviceOrientationEventStatic | undefined;
    if (!DOE) {
      setPermission('unsupported');
      return 'unsupported';
    }
    if (typeof DOE.requestPermission !== 'function') {
      setPermission('granted');
      return 'granted';
    }
    try {
      const result = await DOE.requestPermission();
      setPermission(result);
      return result;
    } catch {
      setPermission('denied');
      return 'denied';
    }
  };

  return { heading, supported, permission, request };
}
