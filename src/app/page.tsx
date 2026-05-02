'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FilterChips } from '@/components/FilterChips';
import { LocateButton } from '@/components/LocateButton';
import { fetchBins, filterByTypes } from '@/lib/data';
import {
  findNearest,
  formatDistance,
  type DistanceMode,
  type LatLng,
} from '@/lib/geo';
import type { BinType, TrashBin } from '@/lib/types';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-500">
      지도 불러오는 중…
    </div>
  ),
});

export default function Page() {
  const [bins, setBins] = useState<TrashBin[]>([]);
  const [selected, setSelected] = useState<Set<BinType>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locatePending, setLocatePending] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [tapMode, setTapMode] = useState(false);
  const [distanceMode, setDistanceMode] = useState<DistanceMode>(() => {
    if (typeof window === 'undefined') return 'euclidean';
    const saved = window.localStorage.getItem('distanceMode');
    return saved === 'manhattan' ? 'manhattan' : 'euclidean';
  });
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    fetchBins()
      .then((data) => {
        if (active) setBins(data);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'unknown');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem('distanceMode', distanceMode);
  }, [distanceMode]);

  const visible = useMemo(() => filterByTypes(bins, selected), [bins, selected]);
  const nearest = useMemo(
    () => (userLocation ? findNearest(visible, userLocation, distanceMode) : null),
    [visible, userLocation, distanceMode],
  );

  const toggle = (type: BinType) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };
  const clearTypes = () =>
    setSelected((prev) => (prev.size === 0 ? prev : new Set()));

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setLocateError('이 브라우저는 위치를 지원하지 않습니다');
      return;
    }
    if (watchIdRef.current !== null) return;

    setLocatePending(true);
    setLocateError(null);
    setTapMode(false);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocatePending(false);
      },
      (err) => {
        setLocatePending(false);
        const msg =
          err.code === err.PERMISSION_DENIED
            ? '위치 권한 거부됨 — Safari 설정 > 위치 허용 후 새로고침, 또는 🎯 지도 탭 사용'
            : err.code === err.POSITION_UNAVAILABLE
              ? '위치 신호 없음 — 🎯 지도 탭으로 지정 가능'
              : err.code === err.TIMEOUT
                ? '위치 가져오기 타임아웃 — 🎯 지도 탭 사용'
                : '위치 가져오기 실패';
        setLocateError(msg);
        if (watchIdRef.current !== null && 'geolocation' in navigator) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
    watchIdRef.current = id;
  };
  const clearLocation = () => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setUserLocation(null);
    setLocateError(null);
  };
  const toggleTapMode = () => {
    setTapMode((prev) => !prev);
    setLocateError(null);
  };
  const handleMapClick = (latlng: LatLng) => {
    setUserLocation(latlng);
    setTapMode(false);
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-950 px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight">🗑️ 중구 휴지통 지도</h1>
          <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-neutral-900">
            PROTO
          </span>
        </div>
      </header>

      <section className="border-b border-neutral-800 bg-neutral-900 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChips selected={selected} onToggle={toggle} onClear={clearTypes} />
          <LocateButton
            active={!!userLocation}
            pending={locatePending}
            onLocate={locate}
            onClear={clearLocation}
          />
          <button
            type="button"
            onClick={() =>
              setDistanceMode((prev) =>
                prev === 'euclidean' ? 'manhattan' : 'euclidean',
              )
            }
            aria-pressed={distanceMode === 'manhattan'}
            className={`min-h-[44px] rounded-full px-4 text-sm font-medium transition flex items-center gap-1.5 ${
              distanceMode === 'manhattan'
                ? 'bg-amber-500 text-white shadow'
                : 'bg-neutral-800 text-neutral-200 ring-1 ring-neutral-700 hover:bg-neutral-700'
            }`}
          >
            <span>{distanceMode === 'euclidean' ? '📏 직선' : '📐 격자'}</span>
          </button>
          <button
            type="button"
            onClick={toggleTapMode}
            aria-pressed={tapMode}
            className={`min-h-[44px] rounded-full px-4 text-sm font-medium transition flex items-center gap-1.5 ${
              tapMode
                ? 'bg-violet-500 text-white shadow'
                : 'bg-neutral-800 text-neutral-200 ring-1 ring-neutral-700 hover:bg-neutral-700'
            }`}
          >
            <span aria-hidden>🎯</span>
            <span>{tapMode ? '지도 탭하세요' : '지도 탭'}</span>
          </button>
        </div>
        <div className="mt-2 text-xs text-neutral-400">
          📍 {visible.length} / 전체 {bins.length}개
          {nearest && (
            <span className="ml-2 text-sky-300">
              · 가까운 통 {formatDistance(nearest.meters)} ({nearest.bin.name.split(',')[0]})
            </span>
          )}
          {locateError && <span className="ml-2 text-red-400">({locateError})</span>}
          {error && <span className="ml-2 text-red-400">({error})</span>}
        </div>
      </section>

      <main className="relative min-h-0 flex-1">
        <Map
          bins={visible}
          userLocation={userLocation}
          highlightBin={nearest?.bin ?? null}
          distanceMode={distanceMode}
          onMapClick={tapMode ? handleMapClick : undefined}
          tapMode={tapMode}
        />
      </main>
    </div>
  );
}
