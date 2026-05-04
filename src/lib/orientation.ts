'use client';

import { useEffect, useRef, useState } from 'react';

const THROTTLE_MS = 60;
const SMOOTHING = 0.25;

type Permission = 'unsupported' | 'prompt' | 'granted' | 'denied';

type DeviceOrientationEventStatic = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

type OrientationLike = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

function getScreenAngle(): number {
  if (typeof window === 'undefined') return 0;
  if (typeof screen !== 'undefined' && screen.orientation?.angle != null) {
    return screen.orientation.angle;
  }
  const legacy = (window as { orientation?: number }).orientation;
  return typeof legacy === 'number' ? legacy : 0;
}

function readHeading(e: OrientationLike): number | null {
  let raw: number;
  if (typeof e.webkitCompassHeading === 'number') {
    raw = e.webkitCompassHeading;
  } else if (e.alpha != null && (e.absolute === true || 'webkitCompassHeading' in e)) {
    raw = (360 - e.alpha) % 360;
  } else {
    return null;
  }
  return ((raw - getScreenAngle()) % 360 + 360) % 360;
}

function smoothHeading(prev: number, next: number, weight: number): number {
  let delta = next - prev;
  if (delta > 180) delta -= 360;
  else if (delta < -180) delta += 360;
  const result = prev + delta * weight;
  return ((result % 360) + 360) % 360;
}

function pickEventName(): 'deviceorientationabsolute' | 'deviceorientation' | null {
  if (typeof window === 'undefined') return null;
  if ('ondeviceorientationabsolute' in window) return 'deviceorientationabsolute';
  if ('ondeviceorientation' in window) return 'deviceorientation';
  return null;
}

export function useDeviceHeading(enabled: boolean) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<Permission>('prompt');
  const [heading, setHeading] = useState<number | null>(null);
  const lastUpdateRef = useRef(0);
  const smoothedRef = useRef<number | null>(null);

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
      smoothedRef.current = null;
      return;
    }
    const eventName = pickEventName();
    if (!eventName) return;
    const handler = (e: Event) => {
      const raw = readHeading(e as OrientationLike);
      if (raw == null || !Number.isFinite(raw)) return;
      const smoothed =
        smoothedRef.current == null ? raw : smoothHeading(smoothedRef.current, raw, SMOOTHING);
      smoothedRef.current = smoothed;
      const now = Date.now();
      if (now - lastUpdateRef.current < THROTTLE_MS) return;
      lastUpdateRef.current = now;
      setHeading(smoothed);
    };
    window.addEventListener(eventName, handler as EventListener);
    return () => {
      window.removeEventListener(eventName, handler as EventListener);
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
