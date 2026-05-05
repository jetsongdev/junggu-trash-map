'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FilterChips } from '@/components/FilterChips';
import { LocateButton } from '@/components/LocateButton';
import { SearchBox } from '@/components/SearchBox';
import { ShareButton } from '@/components/ShareButton';
import type { TileTheme } from '@/components/Map';
import { fetchBins, filterByTypes } from '@/lib/data';
import {
  filterByFavorites,
  loadFavorites,
  saveFavorites,
  toggleFavorite,
} from '@/lib/favorites';
import {
  addUse,
  formatSavingsLine,
  loadSavings,
  saveSavings as persistSavings,
  type Savings,
} from '@/lib/savings';
import {
  findTopDetours,
  findTopNearest,
  formatDistance,
  type DistanceMode,
  type LatLng,
} from '@/lib/geo';
import {
  clampKmh,
  DEFAULT_KMH,
  etaSeconds,
  formatEta,
  formatKmh,
  getSpeedDisplay,
  MAX_KMH,
  MIN_KMH,
  STEP_KMH,
} from '@/lib/eta';
import { HAPTIC, vibrate } from '@/lib/haptic';
import { captureGeolocationError } from '@/lib/monitoring';
import { useDeviceHeading } from '@/lib/orientation';
import type { BinType, TrashBin } from '@/lib/types';
import {
  parseUrlParams,
  type AppState,
} from '@/lib/url-share';

type TapTarget = 'origin' | 'destination' | null;

const DEFAULT_APP_STATE: AppState = {
  selected: new Set<BinType>(),
  tileTheme: 'dark',
  distanceMode: 'euclidean',
  walkingSpeed: DEFAULT_KMH,
  userLocation: null,
  destination: null,
};

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-500">
      지도 불러오는 중…
    </div>
  ),
});

function PageContent() {
  const searchParams = useSearchParams();
  const [bins, setBins] = useState<TrashBin[]>([]);
  const [selected, setSelected] = useState<Set<BinType>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [mapFocusTarget, setMapFocusTarget] = useState<LatLng | null>(null);
  const [locatePending, setLocatePending] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [tapTarget, setTapTarget] = useState<TapTarget>(null);
  const [distanceMode, setDistanceMode] = useState<DistanceMode>('euclidean');
  const [tileTheme, setTileTheme] = useState<TileTheme>('dark');
  const [walkingSpeed, setWalkingSpeed] = useState<number>(DEFAULT_KMH);
  const [speedSliderOpen, setSpeedSliderOpen] = useState(false);
  const [compassMode, setCompassMode] = useState<'off' | 'cone' | 'head-up'>('off');
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [savings, setSavings] = useState<Savings>({
    totalMeters: 0,
    totalSeconds: 0,
    uses: 0,
  });
  const watchIdRef = useRef<number | null>(null);
  const prefsHydratedRef = useRef(false);

  const compass = useDeviceHeading(compassMode !== 'off');

  useEffect(() => {
    if (prefsHydratedRef.current) return;

    const urlState = parseUrlParams(searchParams);

    if (searchParams.has('types') && urlState.selected) {
      setSelected(new Set(urlState.selected));
    }

    if (searchParams.has('mode')) {
      if (urlState.distanceMode) {
        setDistanceMode(urlState.distanceMode);
      }
    } else {
      const storedDistanceMode = window.localStorage.getItem('distanceMode');
      if (storedDistanceMode === 'manhattan') {
        setDistanceMode('manhattan');
      }
    }

    if (searchParams.has('theme')) {
      if (urlState.tileTheme) {
        setTileTheme(urlState.tileTheme);
      }
    } else {
      const storedTheme = window.localStorage.getItem('tileTheme');
      if (storedTheme === 'dark' || storedTheme === 'light') {
        setTileTheme(storedTheme);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTileTheme('dark');
      } else {
        setTileTheme('light');
      }
    }

    if (searchParams.has('speed')) {
      if (urlState.walkingSpeed != null) {
        setWalkingSpeed(urlState.walkingSpeed);
      }
    } else {
      const stored = window.localStorage.getItem('walkingSpeed');
      if (stored != null) {
        // Legacy preset names → kmh
        if (stored === 'slow') setWalkingSpeed(3);
        else if (stored === 'fast') setWalkingSpeed(5);
        else if (stored === 'normal') setWalkingSpeed(4);
        else {
          const num = Number.parseFloat(stored);
          if (Number.isFinite(num)) setWalkingSpeed(clampKmh(num));
        }
      }
    }

    if (searchParams.has('origin') && urlState.userLocation) {
      stopWatch();
      setUserLocation(urlState.userLocation);
    }

    if (searchParams.has('dest') && urlState.destination) {
      setDestination(urlState.destination);
    }

    if (searchParams.has('origin') || searchParams.has('dest')) {
      setMapFocusTarget(urlState.destination ?? urlState.userLocation ?? null);
    }

    setFavorites(loadFavorites());
    setSavings(loadSavings());

    queueMicrotask(() => {
      prefsHydratedRef.current = true;
    });
  }, [searchParams]);

  useEffect(() => {
    if (!prefsHydratedRef.current) return;
    saveFavorites(favorites);
  }, [favorites]);

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
    if (!prefsHydratedRef.current) return;
    window.localStorage.setItem('distanceMode', distanceMode);
  }, [distanceMode]);

  useEffect(() => {
    if (!prefsHydratedRef.current) return;
    window.localStorage.setItem('walkingSpeed', formatKmh(walkingSpeed));
  }, [walkingSpeed]);

  const visible = useMemo(() => {
    const byType = filterByTypes(bins, selected);
    return favoritesOnly ? filterByFavorites(byType, favorites) : byType;
  }, [bins, selected, favoritesOnly, favorites]);

  const handleToggleFavorite = (binId: string) => {
    vibrate(HAPTIC.SELECT);
    setFavorites((prev) => toggleFavorite(prev, binId));
  };

  const handleUseBin = (_binId: string, meters: number, seconds: number) => {
    setSavings((prev) => {
      const next = addUse(prev, meters, seconds);
      persistSavings(next);
      return next;
    });
  };

  const routeCandidates = useMemo(() => {
    if (!userLocation || !destination) return null;
    return findTopDetours(visible, userLocation, destination, distanceMode, 3);
  }, [visible, userLocation, destination, distanceMode]);

  const nearestCandidates = useMemo(() => {
    if (!userLocation || destination) return [];
    return findTopNearest(visible, userLocation, distanceMode, 3);
  }, [visible, userLocation, destination, distanceMode]);

  const bestRouteCandidate = routeCandidates?.[0] ?? null;
  const bestNearestCandidate = nearestCandidates[0] ?? null;
  const highlights = routeCandidates?.map(({ bin }) => bin) ?? nearestCandidates.map(({ bin }) => bin);

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

  const stopWatch = () => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setLocateError('이 브라우저는 위치를 지원하지 않습니다');
      return;
    }
    if (watchIdRef.current !== null) return;

    setLocatePending(true);
    setLocateError(null);
    setTapTarget(null);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocatePending(false);
      },
      (err) => {
        setLocatePending(false);
        captureGeolocationError(err);
        const msg =
          err.code === err.PERMISSION_DENIED
            ? '위치 권한 거부됨 — Safari 설정 > 위치 허용 후 새로고침, 또는 🎯 출발 탭 사용'
            : err.code === err.POSITION_UNAVAILABLE
              ? '위치 신호 없음 — 🎯 출발 탭으로 지정 가능'
              : err.code === err.TIMEOUT
                ? '위치 가져오기 타임아웃 — 🎯 출발 탭 사용'
                : '위치 가져오기 실패';
        setLocateError(msg);
        stopWatch();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
    watchIdRef.current = id;
  };
  const clearLocation = () => {
    stopWatch();
    setUserLocation(null);
    setLocateError(null);
  };

  const handleMapClick = (latlng: LatLng) => {
    if (tapTarget === 'origin') {
      stopWatch();
      setUserLocation(latlng);
      vibrate(HAPTIC.CONFIRM);
    } else if (tapTarget === 'destination') {
      setDestination(latlng);
      vibrate(HAPTIC.CONFIRM);
    }
    setTapTarget(null);
  };

  const handleSearchSelect = (
    lat: number,
    lon: number,
    _label: string,
    mode: TapTarget,
  ) => {
    const target = { lat, lng: lon };

    if (mode === 'origin') {
      stopWatch();
      setUserLocation(target);
    } else if (mode === 'destination') {
      setDestination(target);
    } else {
      setDestination(target);
    }

    setTapTarget(null);
    setLocateError(null);
    setMapFocusTarget(target);
  };

  const onOriginTap = () => {
    vibrate(HAPTIC.TAP);
    setTapTarget((prev) => (prev === 'origin' ? null : 'origin'));
    setLocateError(null);
  };
  const onDestinationButton = () => {
    vibrate(HAPTIC.TAP);
    if (destination) {
      setDestination(null);
    } else {
      setTapTarget((prev) => (prev === 'destination' ? null : 'destination'));
    }
  };

  const destButtonLabel = destination
    ? '🏁 목적지 해제'
    : tapTarget === 'destination'
      ? '🏁 목적지 탭하세요'
      : '🏁 목적지';

  const inactiveChip =
    'bg-neutral-800 text-neutral-200 ring-1 ring-neutral-700 hover:bg-neutral-700';
  const chipBase =
    'min-h-[44px] rounded-full px-4 text-sm font-medium transition flex items-center gap-1.5';
  const shareState: AppState = {
    selected,
    tileTheme,
    distanceMode,
    walkingSpeed,
    userLocation,
    destination,
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
        <div className="mb-3">
          <SearchBox onSelect={handleSearchSelect} tapMode={tapTarget} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChips selected={selected} onToggle={toggle} onClear={clearTypes} />
          <button
            type="button"
            onClick={() => {
              vibrate(HAPTIC.TAP);
              setFavoritesOnly((prev) => !prev);
            }}
            disabled={!favoritesOnly && favorites.size === 0}
            aria-pressed={favoritesOnly}
            aria-label={
              favorites.size === 0
                ? '즐겨찾기 없음 (마커 팝업의 ☆ 클릭)'
                : favoritesOnly
                  ? '즐겨찾기 필터 끄기'
                  : `즐겨찾기 ${favorites.size}개만 보기`
            }
            className={`${chipBase} ${
              favoritesOnly ? 'bg-amber-500 text-white shadow' : inactiveChip
            } ${!favoritesOnly && favorites.size === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span aria-hidden>{favoritesOnly ? '★' : '☆'}</span>
            <span>즐겨찾기{favorites.size > 0 ? ` ${favorites.size}` : ''}</span>
          </button>
          <LocateButton
            active={!!userLocation}
            pending={locatePending}
            onLocate={locate}
            onClear={clearLocation}
          />
          <button
            type="button"
            onClick={() => {
              vibrate(HAPTIC.TAP);
              setDistanceMode((prev) =>
                prev === 'euclidean' ? 'manhattan' : 'euclidean',
              );
            }}
            aria-pressed={distanceMode === 'manhattan'}
            className={`${chipBase} ${
              distanceMode === 'manhattan'
                ? 'bg-amber-500 text-white shadow'
                : inactiveChip
            }`}
          >
            <span>{distanceMode === 'euclidean' ? '📏 직선' : '📐 격자'}</span>
          </button>
          <button
            type="button"
            onClick={onOriginTap}
            aria-pressed={tapTarget === 'origin'}
            className={`${chipBase} ${
              tapTarget === 'origin'
                ? 'bg-violet-500 text-white shadow'
                : inactiveChip
            }`}
          >
            <span aria-hidden>🎯</span>
            <span>{tapTarget === 'origin' ? '출발 탭하세요' : '출발 탭'}</span>
          </button>
          <button
            type="button"
            onClick={onDestinationButton}
            aria-pressed={tapTarget === 'destination' || !!destination}
            className={`${chipBase} ${
              destination
                ? 'bg-rose-500 text-white shadow'
                : tapTarget === 'destination'
                  ? 'bg-rose-500 text-white shadow'
                  : inactiveChip
            }`}
          >
            <span>{destButtonLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              vibrate(HAPTIC.TAP);
              setSpeedSliderOpen((prev) => !prev);
            }}
            aria-pressed={speedSliderOpen}
            aria-label={`보행 속도 ${formatKmh(walkingSpeed)}km/h. 클릭해 슬라이더 ${
              speedSliderOpen ? '닫기' : '열기'
            }`}
            className={`${chipBase} ${
              speedSliderOpen ? 'bg-emerald-600 text-white shadow' : inactiveChip
            }`}
          >
            <span aria-hidden>{getSpeedDisplay(walkingSpeed).emoji}</span>
            <span>{formatKmh(walkingSpeed)}km/h</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              vibrate(HAPTIC.TAP);
              const next =
                compassMode === 'off'
                  ? 'cone'
                  : compassMode === 'cone'
                    ? 'head-up'
                    : 'off';
              if (compassMode === 'off') {
                const result = await compass.request();
                if (result !== 'granted') return;
              }
              setCompassMode(next);
            }}
            disabled={!compass.supported || compass.permission === 'denied'}
            aria-pressed={compassMode !== 'off'}
            aria-label={
              !compass.supported
                ? '방향 센서 미지원'
                : compass.permission === 'denied'
                  ? '방향 권한 거부됨'
                  : compassMode === 'off'
                    ? '방향 cone 켜기'
                    : compassMode === 'cone'
                      ? '헤드업 모드로 전환'
                      : '방향 표시 끄기'
            }
            className={`${chipBase} ${
              compassMode === 'head-up'
                ? 'bg-violet-500 text-white shadow'
                : compassMode === 'cone'
                  ? 'bg-sky-500 text-white shadow'
                  : inactiveChip
            } ${!compass.supported || compass.permission === 'denied' ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span aria-hidden>🧭</span>
            <span>
              {compassMode === 'head-up' ? '헤드업' : compassMode === 'cone' ? '방향' : '방향'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              vibrate(HAPTIC.TAP);
              setTileTheme((prev) => {
                const next = prev === 'dark' ? 'light' : 'dark';
                window.localStorage.setItem('tileTheme', next);
                return next;
              });
            }}
            aria-label={`타일 테마 ${tileTheme === 'dark' ? '라이트로 전환' : '다크로 전환'}`}
            className={`${chipBase} ${inactiveChip}`}
          >
            <span aria-hidden>{tileTheme === 'dark' ? '🌑' : '☀️'}</span>
            <span>{tileTheme === 'dark' ? '다크' : '라이트'}</span>
          </button>
          <ShareButton
            state={shareState}
            defaults={DEFAULT_APP_STATE}
            className={`${chipBase} ${inactiveChip}`}
          />
        </div>
        {speedSliderOpen && (
          <div className="mt-2 flex items-center gap-3 rounded-lg bg-neutral-800/80 px-3 py-2">
            <span aria-hidden className="text-base">
              {getSpeedDisplay(walkingSpeed).emoji}
            </span>
            <input
              type="range"
              min={MIN_KMH}
              max={MAX_KMH}
              step={STEP_KMH}
              value={walkingSpeed}
              onChange={(e) => setWalkingSpeed(clampKmh(Number.parseFloat(e.target.value)))}
              className="flex-1 accent-emerald-500"
              aria-label="보행 속도 km/h"
            />
            <span className="min-w-[64px] text-right font-mono text-sm text-emerald-300">
              {formatKmh(walkingSpeed)} km/h
            </span>
          </div>
        )}
        <div className="mt-2 text-xs text-neutral-400">
          📍 {visible.length} / 전체 {bins.length}개
          {bestRouteCandidate && (
            <span className="ml-2 text-cyan-300">
              · 출발→{bestRouteCandidate.bin.name.split(',')[0]}→목적지 {formatDistance(bestRouteCandidate.cost.total)} · {formatEta(etaSeconds(bestRouteCandidate.cost.total, walkingSpeed))} (경유 +{formatDistance(bestRouteCandidate.cost.extra)})
            </span>
          )}
          {!bestRouteCandidate && bestNearestCandidate && (
            <span className="ml-2 text-sky-300">
              · 가까운 통 {formatDistance(bestNearestCandidate.meters)} · {formatEta(etaSeconds(bestNearestCandidate.meters, walkingSpeed))} ({bestNearestCandidate.bin.name.split(',')[0]})
            </span>
          )}
          {savings.uses > 0 && (
            <span className="ml-2 text-emerald-300">{formatSavingsLine(savings)}</span>
          )}
          {locateError && <span className="ml-2 text-red-400">({locateError})</span>}
          {error && <span className="ml-2 text-red-400">({error})</span>}
        </div>
      </section>

      <main className="relative min-h-0 flex-1">
        <Map
          bins={visible}
          userLocation={userLocation}
          userHeading={compassMode !== 'off' ? compass.heading : null}
          mapBearing={
            compassMode === 'head-up' && compass.heading != null
              ? -compass.heading
              : null
          }
          destination={destination}
          highlights={highlights}
          focusTarget={mapFocusTarget}
          distanceMode={distanceMode}
          onMapClick={tapTarget ? handleMapClick : undefined}
          tapMode={tapTarget !== null}
          tileTheme={tileTheme}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          walkingSpeed={walkingSpeed}
          onUse={handleUseBin}
        />
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PageContent />
    </Suspense>
  );
}
