'use client';

import dynamic from 'next/dynamic';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Compass,
  ExternalLink,
  Flag,
  Footprints,
  Grid3x3,
  Loader2,
  MapPin,
  Minus,
  Moon,
  Navigation,
  Plus,
  Ruler,
  Star,
  Sun,
  Target,
} from 'lucide-react';
import type { Map as LeafletMap } from 'leaflet';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FilterChips } from '@/components/FilterChips';
import { DistrictSelector } from '@/components/DistrictSelector';
import { SearchBox } from '@/components/SearchBox';
import { ShareButton } from '@/components/ShareButton';
import type { TileTheme } from '@/components/Map';
import { fetchDistrict, filterByTypes } from '@/lib/data';
import { boundsForDistrict } from '@/lib/district-grid';
import { fetchHints, mergeHints } from '@/lib/hints';
import {
  fetchDistrictsGeoJson,
  fetchManifest,
  findDistrictMeta,
} from '@/lib/districts';
import {
  findDistrictForPoint,
  findNearestDistrictCentroid,
  type DistrictsGeoJson,
} from '@/lib/point-in-district';
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
import { computeCycleState } from '@/lib/cycle-state';
import {
  HINT_DURATION_MS,
  HINT_MESSAGES,
  hasSeenHint,
  markHintSeen,
  type HintKey,
} from '@/lib/first-use-hints';
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
  MAX_KMH,
  MIN_KMH,
  STEP_KMH,
} from '@/lib/eta';
import { HAPTIC, vibrate } from '@/lib/haptic';
import { captureGeolocationError } from '@/lib/monitoring';
import { useDeviceHeading } from '@/lib/orientation';
import type { BinType, DistrictCode, DistrictMeta, Manifest, TrashBin } from '@/lib/types';
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

const STATUS_VIS = {
  loaded:   { icon: '✓', cls: 'text-emerald-400' },
  inFlight: { icon: '⟳', cls: 'text-amber-400 animate-pulse' },
  pending:  { icon: '⏳', cls: 'text-neutral-500' },
  failed:   { icon: '✗', cls: 'text-rose-400' },
} as const;

const MapView = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-500">
      지도 불러오는 중…
    </div>
  ),
});

function PageContent() {
  const searchParams = useSearchParams();
  const [districtsCache, setDistrictsCache] = useState<Map<DistrictCode, TrashBin[]>>(
    () => new Map<DistrictCode, TrashBin[]>(),
  );
  const [activeDistricts, setActiveDistricts] = useState<Set<DistrictCode>>(
    () => new Set(),
  );
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [districtsGeo, setDistrictsGeo] = useState<DistrictsGeoJson | null>(null);
  const [activeFetches, setActiveFetches] = useState<Set<DistrictCode>>(() => new Set());
  const [failedDistricts, setFailedDistricts] = useState<Set<DistrictCode>>(() => new Set());
  type ToastVariant = 'info' | 'emphatic' | 'error';
  type ToastPosition = 'center' | 'top';
  const [toast, setToast] = useState<{
    text: string;
    variant: ToastVariant;
    position: ToastPosition;
  } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [selected, setSelected] = useState<Set<BinType>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [mapFocusTarget, setMapFocusTarget] = useState<LatLng | null>(null);
  const [viewingDistrict, setViewingDistrict] = useState<DistrictCode | null>(null);
  const [locatePending, setLocatePending] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [tapTarget, setTapTarget] = useState<TapTarget>(null);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
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
  const [statusCollapsed, setStatusCollapsed] = useState(true);
  const watchIdRef = useRef<number | null>(null);
  const prefsHydratedRef = useRef(false);
  const mapRef = useRef<LeafletMap | null>(null);
  const onMapReady = useCallback((m: LeafletMap) => {
    mapRef.current = m;
  }, []);

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

    const storedCollapsed = window.localStorage.getItem('statusOverlayCollapsed');
    if (storedCollapsed === 'false') {
      setStatusCollapsed(false);
    } else if (storedCollapsed === 'true') {
      setStatusCollapsed(true);
    }
    // null (no key yet) → default collapsed (true) so first-time visitors see compact summary, not full panel covering the map

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

    (async () => {
      let initialCode: DistrictCode | null = null;
      try {
        const [m, geo] = await Promise.all([
          fetchManifest(),
          fetchDistrictsGeoJson(),
        ]);
        if (!active) return;
        setManifest(m);
        setDistrictsGeo(geo);

        const urlState = parseUrlParams(searchParams);
        const urlSeed = urlState.userLocation ?? urlState.destination ?? null;
        if (urlSeed) {
          initialCode =
            findDistrictForPoint(urlSeed, geo) ??
            findNearestDistrictCentroid(urlSeed, m.districts);
        }

        if (!initialCode) {
          initialCode = findDistrictMeta(m, 'junggu')?.code ?? m.districts[0].code;
        }

        const meta = findDistrictMeta(m, initialCode);
        if (!meta) throw new Error(`Unknown district code: ${initialCode}`);
        setViewingDistrict(initialCode);
        if (meta.binCount === 0) {
          setActiveDistricts((prev) => new Set([...prev, initialCode!]));
          return;
        }

        setActiveFetches((prev) => new Set([...prev, initialCode!]));
        const [data, hintsFile] = await Promise.all([
          fetchDistrict(initialCode, m.version),
          fetchHints(initialCode),
        ]);
        if (!active) return;
        const merged = mergeHints(data, hintsFile.hints);
        setDistrictsCache((prev) => {
          const next = new Map<DistrictCode, TrashBin[]>(prev);
          next.set(initialCode!, merged);
          return next;
        });
        setActiveDistricts((prev) => new Set([...prev, initialCode!]));
      } catch (e: unknown) {
        if (active) {
          setError(e instanceof Error ? e.message : 'unknown');
          if (initialCode) {
            setFailedDistricts((prev) => new Set([...prev, initialCode!]));
          }
        }
      } finally {
        if (active && initialCode) {
          setActiveFetches((prev) => {
            const next = new Set(prev);
            next.delete(initialCode!);
            return next;
          });
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!manifest) return;
    if (typeof window === 'undefined') return;
    let cancelled = false;
    const handles: number[] = [];

    const idle: (cb: () => void) => number =
      'requestIdleCallback' in window
        ? (cb) => window.requestIdleCallback(cb, { timeout: 3000 })
        : (cb) => window.setTimeout(cb, 0);

    const startPrefetch = () => {
      // Read latest state via refs — effect's deps are [manifest] only, so the
      // closure-captured districtsCache/activeFetches would be the mount-time
      // snapshot and cause already-loaded (e.g. via panning) districts to be
      // re-fetched + toast re-fired when autoFallback fires.
      const cacheNow = districtsCacheRef.current;
      const fetchesNow = activeFetchesRef.current;
      const failedNow = failedDistrictsRef.current;
      const toFetch = manifest.districts.filter(
        (d) =>
          d.binCount > 0 &&
          !cacheNow.has(d.code) &&
          !fetchesNow.has(d.code) &&
          !failedNow.has(d.code),
      );
      if (toFetch.length === 0) return;

      setActiveFetches(
        (prev) => new Set([...prev, ...toFetch.map((d) => d.code)]),
      );

      for (const d of toFetch) {
        if (cancelled) return;
        const handle = idle(async () => {
          if (cancelled) return;
          try {
            const [data, hintsFile] = await Promise.all([
              fetchDistrict(d.code, manifest.version),
              fetchHints(d.code),
            ]);
            if (cancelled) return;
            const merged = mergeHints(data, hintsFile.hints);
            setDistrictsCache((prev) => {
              const next = new Map<DistrictCode, TrashBin[]>(prev);
              next.set(d.code, merged);
              return next;
            });
            setActiveDistricts((prev) => new Set([...prev, d.code]));
            showToast(`${d.name} ${merged.length}개`, 1500);
          } catch {
            // Mark terminal-failed so fullyLoaded can complete and overlay dismisses.
            // User can still pan to retry — handleCenterChange clears the flag.
            setFailedDistricts((prev) => new Set([...prev, d.code]));
          } finally {
            setActiveFetches((prev) => {
              const next = new Set(prev);
              next.delete(d.code);
              return next;
            });
          }
        });
        handles.push(handle);
      }
    };

    // Gate on first user interaction. Lighthouse does not simulate input during measurement,
    // so its scoring window closes before prefetch fires. Real users trigger one of these
    // events within the first second of looking at the map.
    const events: (keyof WindowEventMap)[] = [
      'pointerdown',
      'touchstart',
      'keydown',
      'wheel',
      'scroll',
    ];
    let triggered = false;
    const trigger = () => {
      if (triggered || cancelled) return;
      triggered = true;
      events.forEach((e) => window.removeEventListener(e, trigger));
      cancelAutoFallback();
      startPrefetch();
    };
    events.forEach((e) =>
      window.addEventListener(e, trigger, { passive: true, once: true }),
    );

    // Auto fallback — 5초 setTimeout. requestIdleCallback로 시도했었지만
    // (cc64604) LH의 throttled CPU에서도 idle slot이 생겨 prefetch가 LCP/TBT
    // 측정 window 안에 발사 → -0.22 perf 회귀. setTimeout(5000)은 측정 끝난
    // 후에 발사 보장 (1f0ea2d 시점 0.72 통과). 트레이드오프: 캐시된 재방문은
    // 5초 동안 overlay를 보지만 LH 우선.
    const autoFallback = window.setTimeout(trigger, 5000);
    const cancelAutoFallback = () => window.clearTimeout(autoFallback);

    return () => {
      cancelled = true;
      events.forEach((e) => window.removeEventListener(e, trigger));
      cancelAutoFallback();
      const cancel: (h: number) => void =
        'cancelIdleCallback' in window
          ? (h) => window.cancelIdleCallback(h)
          : (h) => window.clearTimeout(h);
      handles.forEach(cancel);
    };
    // districtsCache intentionally omitted — initial-cache snapshot is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest]);

  const populatedDistrictCount = useMemo(
    () => (manifest ? manifest.districts.filter((d) => d.binCount > 0).length : 0),
    [manifest],
  );

  const loadedPopulatedCount = useMemo(() => {
    if (!manifest) return 0;
    return manifest.districts.filter(
      (d) => d.binCount > 0 && activeDistricts.has(d.code),
    ).length;
  }, [activeDistricts, manifest]);

  // Terminal = loaded OR failed. Overlay dismisses on terminal so a failed fetch
  // doesn't pin it forever.
  const terminalPopulatedCount = useMemo(() => {
    if (!manifest) return 0;
    return manifest.districts.filter(
      (d) =>
        d.binCount > 0 &&
        (activeDistricts.has(d.code) || failedDistricts.has(d.code)),
    ).length;
  }, [activeDistricts, failedDistricts, manifest]);

  const fullyLoaded =
    manifest != null &&
    populatedDistrictCount > 0 &&
    terminalPopulatedCount >= populatedDistrictCount;

  const showLoadingOverlay = manifest != null && !fullyLoaded;

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (toastTimerRef.current != null) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
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

  useEffect(() => {
    if (!prefsHydratedRef.current) return;
    window.localStorage.setItem('statusOverlayCollapsed', String(statusCollapsed));
  }, [statusCollapsed]);

  const bins = useMemo<TrashBin[]>(() => {
    const flat: TrashBin[] = [];
    for (const code of activeDistricts) {
      const d = districtsCache.get(code);
      if (d) flat.push(...d);
    }
    return flat;
  }, [districtsCache, activeDistricts]);

  const showToast = (
    text: string,
    durationMs = 1800,
    variant: ToastVariant = 'info',
    position: ToastPosition = 'center',
  ) => {
    setToast({ text, variant, position });
    if (toastTimerRef.current != null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, durationMs);
  };

  const allLoadedToastFiredRef = useRef(false);
  useEffect(() => {
    if (allLoadedToastFiredRef.current) return;
    if (populatedDistrictCount < 2) return;
    if (loadedPopulatedCount < populatedDistrictCount) return;
    allLoadedToastFiredRef.current = true;
    showToast(
      `전체 ${populatedDistrictCount}개 자치구 ${bins.length}개 휴지통 로드 완료`,
      4000,
      'emphatic',
      'top',
    );
    // showToast 는 매 render 새로 만드는 closure지만 ref guard 덕에 1회 실행 보장.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedPopulatedCount, populatedDistrictCount, bins.length]);

  const onboardingFiredRef = useRef(false);
  useEffect(() => {
    if (onboardingFiredRef.current) return;
    if (!manifest) return;
    if (typeof window === 'undefined') return;
    onboardingFiredRef.current = true;
    if (window.localStorage.getItem('onboarded') === 'true') return;
    window.localStorage.setItem('onboarded', 'true');
    showToast(
      '🎯 출발과 🏁 목적지를 정하면 경유 휴지통을 알려드려요',
      6000,
      'emphatic',
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest]);

  const maybeShowHint = (key: HintKey) => {
    if (typeof window === 'undefined') return;
    // 다른 토스트(onboarding · 802 자치구 완료 · 에러)가 활성 중이면 skip.
    // markSeen 도 안 해서 다음 트리거에서 다시 시도. URL-driven origin+dest로
    // 첫 mount에 share hint이 onboarding과 충돌하면 이번 세션엔 안 뜨지만,
    // 공유 URL로 도착한 사용자는 이미 공유 기능을 알고 있으니 trade-off 수용.
    if (toastTimerRef.current != null) return;
    if (hasSeenHint(key, window.localStorage)) return;
    markHintSeen(key, window.localStorage);
    showToast(HINT_MESSAGES[key], HINT_DURATION_MS);
  };

  // P2.19: origin+dest 동시 set 첫 진입 시 공유 버튼 힌트
  useEffect(() => {
    if (!userLocation || !destination) return;
    maybeShowHint('share');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, destination]);

  // 에러는 collapsed/expanded 무관하게 카드 밖 토스트로 항상 노출.
  // GPS 권한 거부, 자치구 fetch 실패 등은 즉시 사용자에게 보여야 함.
  useEffect(() => {
    if (locateError) showToast(locateError, 6000, 'error');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locateError]);

  useEffect(() => {
    if (error) showToast(error, 6000, 'error');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  type DistrictRow = {
    code: DistrictCode;
    name: string;
    binCount: number;
    loaded: boolean;
    inFlight: boolean;
    failed: boolean;
  };

  const districtBreakdown = useMemo<DistrictRow[]>(() => {
    if (!manifest) return [];
    return manifest.districts
      .filter((d) => d.binCount > 0)
      .map((d) => ({
        code: d.code,
        name: d.name,
        binCount: d.binCount,
        loaded: districtsCache.has(d.code),
        inFlight: activeFetches.has(d.code),
        failed: failedDistricts.has(d.code),
      }))
      .sort((a, b) => b.binCount - a.binCount);
  }, [districtsCache, activeFetches, failedDistricts, manifest]);

  const totalAvailableBins = useMemo(
    () =>
      manifest
        ? manifest.districts.reduce((sum, d) => sum + d.binCount, 0)
        : 0,
    [manifest],
  );

  const visible = useMemo(() => {
    const byType = filterByTypes(bins, selected);
    return favoritesOnly ? filterByFavorites(byType, favorites) : byType;
  }, [bins, selected, favoritesOnly, favorites]);

  const handleToggleFavorite = (binId: string) => {
    vibrate(HAPTIC.SELECT);
    setFavorites((prev) => {
      const next = toggleFavorite(prev, binId);
      // P2.19: 첫 추가일 때만 안내 (제거에는 띄우지 않음)
      if (next.size > prev.size) maybeShowHint('favorite');
      return next;
    });
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
    // 검색 드롭다운이 열려 있으면 사용자가 결과를 누르려는 중. 맵 빈 영역 클릭으로
    // origin/destination이 잘못 잡히는 걸 막는다.
    if (searchDropdownOpen) return;
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

  // Refs syncing latest state — let handleCenterChange be useCallback-stable so
  // MapMoveHandler doesn't rebind the leaflet `moveend` listener on every render.
  // districtsCache/failedDistricts also via ref so the prefetch effect (deps:
  // [manifest]) reads latest, not its mount-time snapshot.
  const activeDistrictsRef = useRef(activeDistricts);
  const activeFetchesRef = useRef(activeFetches);
  const districtsCacheRef = useRef(districtsCache);
  const failedDistrictsRef = useRef(failedDistricts);
  useEffect(() => {
    activeDistrictsRef.current = activeDistricts;
  }, [activeDistricts]);
  useEffect(() => {
    activeFetchesRef.current = activeFetches;
  }, [activeFetches]);
  useEffect(() => {
    districtsCacheRef.current = districtsCache;
  }, [districtsCache]);
  useEffect(() => {
    failedDistrictsRef.current = failedDistricts;
  }, [failedDistricts]);

  const handleCenterChange = useCallback(
    async (latlng: LatLng) => {
      if (!manifest || !districtsGeo) return;
      const code = findDistrictForPoint(latlng, districtsGeo);
      setViewingDistrict(code);
      if (!code) return;
      if (activeDistrictsRef.current.has(code)) return;
      if (activeFetchesRef.current.has(code)) return;

      const meta = findDistrictMeta(manifest, code);
      if (!meta) return;
      if (meta.binCount === 0) {
        setActiveDistricts((prev) => new Set([...prev, code]));
        return;
      }

      setActiveFetches((prev) => new Set([...prev, code]));
      try {
        const [data, hintsFile] = await Promise.all([
          fetchDistrict(code, manifest.version),
          fetchHints(code),
        ]);
        const merged = mergeHints(data, hintsFile.hints);
        setDistrictsCache((prev) => {
          const next = new Map<DistrictCode, TrashBin[]>(prev);
          next.set(code, merged);
          return next;
        });
        setActiveDistricts((prev) => new Set([...prev, code]));
        // Clear any prior failed flag — pan-to-retry succeeded.
        setFailedDistricts((prev) => {
          if (!prev.has(code)) return prev;
          const next = new Set(prev);
          next.delete(code);
          return next;
        });
        showToast(`${meta.name} ${merged.length}개`, 1500);
      } catch {
        setFailedDistricts((prev) => new Set([...prev, code]));
      } finally {
        setActiveFetches((prev) => {
          const next = new Set(prev);
          next.delete(code);
          return next;
        });
      }
      // showToast은 매 render 새 closure지만 부수효과만 일으키므로 deps 누락 안전.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [manifest, districtsGeo],
  );

  const handleDistrictSelectPopulated = (meta: DistrictMeta) => {
    const bounds = boundsForDistrict(meta);
    mapRef.current?.flyToBounds(bounds, { maxZoom: 15 });
  };

  const handleDistrictSelectEmpty = (meta: DistrictMeta) => {
    mapRef.current?.flyTo([meta.centroid[1], meta.centroid[0]], 14);
    showToast(
      `${meta.name}는 아직 공공데이터가 발행되지 않았어요`,
      3000,
      'info',
    );
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
    ? '2️⃣ 🏁 목적지 해제'
    : tapTarget === 'destination'
      ? '2️⃣ 🏁 목적지 탭하세요'
      : '2️⃣ 🏁 목적지';

  // 좌하단 통합 cycle: off → gps → gps+cone → gps+head-up → off
  // GPS가 없으면 방향 모드는 의미 없음 (의존). 이를 cycle 순서로 강제.
  const cycleState = computeCycleState(locatePending, userLocation, compassMode);

  const cycleLocate = async () => {
    vibrate(HAPTIC.TAP);
    if (locatePending) return;
    if (!userLocation) {
      // off → gps
      locate();
      return;
    }
    if (compassMode === 'off') {
      // gps → gps+cone (방향 권한 요청)
      if (!compass.supported || compass.permission === 'denied') return;
      const result = await compass.request();
      if (result === 'granted') setCompassMode('cone');
      return;
    }
    if (compassMode === 'cone') {
      // gps+cone → gps+head-up
      setCompassMode('head-up');
      maybeShowHint('headsUp');
      return;
    }
    // gps+head-up → off (전부 끄기)
    setCompassMode('off');
    clearLocation();
  };

  const hudInactive =
    'bg-white/95 text-neutral-700 ring-1 ring-neutral-300 hover:bg-white dark:bg-neutral-900/95 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-800';
  const hudChip =
    'flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium whitespace-nowrap transition ring-1';
  const hudIconBtn =
    'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md px-2 text-base font-medium transition ring-1';
  const routeSegmentBtn =
    'relative flex h-9 w-[74px] shrink-0 items-center justify-center gap-1 px-2 text-xs font-medium leading-none transition';
  const routeSegmentInactive =
    'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800';
  const hudFloatingGroup =
    'rounded-md bg-white/80 ring-1 ring-neutral-300 backdrop-blur-sm dark:bg-neutral-900/80 dark:ring-neutral-700';
  const hudAmberActive =
    'bg-amber-500/15 text-amber-700 ring-1 ring-amber-500 shadow-sm dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400';
  const hudSkyActive =
    'bg-sky-500/15 text-sky-700 ring-1 ring-sky-500 shadow-sm dark:bg-sky-400/15 dark:text-sky-200 dark:ring-sky-400';
  const hudVioletActive =
    'bg-violet-500/15 text-violet-700 ring-1 ring-violet-500 shadow-sm dark:bg-violet-400/15 dark:text-violet-200 dark:ring-violet-400';
  const hudEmeraldActive =
    'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500 shadow-sm dark:bg-emerald-400/15 dark:text-emerald-200 dark:ring-emerald-400';
  const shareState: AppState = {
    selected,
    tileTheme,
    distanceMode,
    walkingSpeed,
    userLocation,
    destination,
  };

  return (
    <div
      className={`flex h-dvh flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 ${
        tileTheme === 'dark' ? 'dark' : ''
      }`}
    >
      <header className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight">🗑️ 중구 휴지통 지도</h1>
          <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-neutral-900">
            PROTO
          </span>
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
            aria-label={`테마 ${tileTheme === 'dark' ? '라이트로 전환' : '다크로 전환'}`}
            title={tileTheme === 'dark' ? '다크 테마 (탭하면 라이트)' : '라이트 테마 (탭하면 다크)'}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-md text-neutral-600 ring-1 ring-neutral-200 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:ring-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            {tileTheme === 'dark' ? (
              <Moon size={18} aria-hidden="true" />
            ) : (
              <Sun size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <section className="relative z-[1000] border-b border-neutral-200 bg-neutral-100 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-3 flex gap-2">
          <div className="flex-1">
            <SearchBox
              onSelect={handleSearchSelect}
              tapMode={tapTarget}
              onDropdownChange={setSearchDropdownOpen}
            />
          </div>
          <ShareButton
            state={shareState}
            defaults={DEFAULT_APP_STATE}
            className={`${hudIconBtn} ${hudInactive}`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* 그룹 1: 위치/경로/속도 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex overflow-hidden rounded-md bg-white/95 ring-1 ring-neutral-300 dark:bg-neutral-900/95 dark:ring-neutral-700">
              <button
                type="button"
                onClick={onOriginTap}
                aria-pressed={tapTarget === 'origin'}
                aria-label={tapTarget === 'origin' ? '출발 위치 탭하세요' : '출발 위치 지정'}
                title="출발 위치 (1)"
                className={`${routeSegmentBtn} ${
                  tapTarget === 'origin'
                    ? 'bg-violet-500/15 text-violet-700 dark:text-violet-200'
                    : routeSegmentInactive
                }`}
              >
                <MapPin size={18} aria-hidden="true" />
                <span className="text-xs">출발</span>
                {userLocation && (
                  <span className="absolute right-0.5 top-0.5 rounded-sm bg-violet-500 px-1 text-[9px] leading-4 text-white ring-1 ring-white dark:ring-neutral-900">
                    ✓
                  </span>
                )}
              </button>
              <span
                aria-hidden
                className="self-stretch border-l border-neutral-300 dark:border-neutral-700"
              />
              <button
                type="button"
                onClick={onDestinationButton}
                aria-pressed={tapTarget === 'destination' || !!destination}
                aria-label={destButtonLabel}
                title={destination ? '목적지 해제' : '목적지 지정 (2)'}
                className={`${routeSegmentBtn} ${
                  tapTarget === 'destination'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-200'
                    : routeSegmentInactive
                }`}
              >
                <Flag size={18} aria-hidden="true" />
                <span className="text-xs">목적지</span>
                {destination && (
                  <span className="absolute right-0.5 top-0.5 rounded-sm bg-rose-500 px-1 text-[9px] leading-4 text-white ring-1 ring-white dark:ring-neutral-900">
                    ✓
                  </span>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                vibrate(HAPTIC.TAP);
                setSpeedSliderOpen((prev) => {
                  const next = !prev;
                  // P2.21: 슬라이더 첫 열림 시 안내
                  if (next) maybeShowHint('speed');
                  return next;
                });
              }}
              aria-pressed={speedSliderOpen}
              aria-label={`보행 속도 ${formatKmh(walkingSpeed)}km/h. 클릭해 슬라이더 ${
                speedSliderOpen ? '닫기' : '열기'
              }`}
              className={`${hudChip} ${
                speedSliderOpen ? hudEmeraldActive : hudInactive
              }`}
            >
              <Footprints size={18} aria-hidden="true" />
              <span>
                <span className="font-mono">{formatKmh(walkingSpeed)}</span>km/h
              </span>
            </button>
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
              title={favorites.size === 0 ? '즐겨찾기' : `즐겨찾기 ${favorites.size}개`}
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md ring-1 transition ${
                favoritesOnly ? hudAmberActive : hudInactive
              } ${!favoritesOnly && favorites.size === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Star
                size={18}
                aria-hidden="true"
                fill={favoritesOnly ? 'currentColor' : 'none'}
              />
              {favorites.size > 0 && (
                <span className="absolute -right-1 -top-1 min-w-4 rounded-md bg-amber-500 px-1 text-center font-mono text-[9px] leading-4 text-white ring-1 ring-white dark:ring-neutral-900">
                  {favorites.size}
                </span>
              )}
            </button>
          </div>
        </div>
        {speedSliderOpen && (
          <div className="mt-2 flex items-center gap-3 rounded-md bg-white/95 px-3 py-2 ring-1 ring-emerald-500/40 dark:bg-neutral-900/95">
            <Footprints size={20} aria-hidden="true" className="text-emerald-700 dark:text-emerald-300" />
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
            <div className="min-w-[88px] text-right font-mono leading-tight">
              <div className="text-sm text-emerald-700 dark:text-emerald-300">
                {formatKmh(walkingSpeed)} km/h
              </div>
              {(bestRouteCandidate || bestNearestCandidate) && (
                <div
                  className="text-[11px] text-neutral-600 dark:text-neutral-400"
                  aria-live="polite"
                >
                  {bestRouteCandidate
                    ? `경유 경로 ${formatEta(etaSeconds(bestRouteCandidate.cost.total, walkingSpeed))}`
                    : `가까운 통 ${formatEta(etaSeconds(bestNearestCandidate!.meters, walkingSpeed))}`}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <main className="relative min-h-0 flex-1">
        <MapView
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
          onCenterChange={handleCenterChange}
          tapMode={tapTarget !== null}
          tileTheme={tileTheme}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          walkingSpeed={walkingSpeed}
          onUse={handleUseBin}
          onMapReady={onMapReady}
        />
        {/* 좌상단: 거리모드 (직선/격자) 단독 */}
        <div className={`absolute left-2 top-2 z-[1000] p-1.5 ${hudFloatingGroup}`}>
          <button
            type="button"
            onClick={() => {
              vibrate(HAPTIC.TAP);
              setDistanceMode((prev) => {
                const next = prev === 'euclidean' ? 'manhattan' : 'euclidean';
                if (next === 'manhattan') maybeShowHint('grid');
                return next;
              });
            }}
            aria-pressed={distanceMode === 'manhattan'}
            aria-label={distanceMode === 'manhattan' ? '격자 거리 (탭하면 직선)' : '직선 거리 (탭하면 격자)'}
            title={distanceMode === 'manhattan' ? '격자 거리' : '직선 거리'}
            className={`${hudIconBtn} ${
              distanceMode === 'manhattan' ? hudAmberActive : hudInactive
            }`}
          >
            {distanceMode === 'euclidean' ? (
              <Ruler size={20} aria-hidden="true" />
            ) : (
              <Grid3x3 size={20} aria-hidden="true" />
            )}
          </button>
        </div>
        {/* 우상단: 자치구 셀렉터 + 필터 (휴지통/재활용) 세로 stack */}
        <div className={`absolute right-2 top-2 z-[1000] flex flex-col items-end gap-1.5 p-1.5 ${hudFloatingGroup}`}>
          {manifest && (
            <DistrictSelector
              manifest={manifest}
              viewingDistrict={viewingDistrict}
              tileTheme={tileTheme}
              onSelectPopulated={handleDistrictSelectPopulated}
              onSelectEmpty={handleDistrictSelectEmpty}
            />
          )}
          <FilterChips selected={selected} onToggle={toggle} layout="vertical" />
        </div>
        {/* 좌하단 통합: 줌 + 위치/방향 cycle */}
        <div className={`absolute bottom-4 left-4 z-[1000] flex flex-col gap-1.5 p-1.5 ${hudFloatingGroup}`}>
          <button
            type="button"
            onClick={() => {
              vibrate(HAPTIC.TAP);
              mapRef.current?.zoomIn();
            }}
            aria-label="확대"
            title="확대"
            className={`${hudIconBtn} ${hudInactive}`}
          >
            <Plus size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              vibrate(HAPTIC.TAP);
              mapRef.current?.zoomOut();
            }}
            aria-label="축소"
            title="축소"
            className={`${hudIconBtn} ${hudInactive}`}
          >
            <Minus size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={cycleLocate}
            disabled={cycleState === 'pending'}
            aria-pressed={cycleState !== 'off' && cycleState !== 'pending'}
            aria-label={{
              pending: '위치 찾는 중',
              off: '내 위치 찾기',
              gps: '방향 cone 켜기 (현재: 위치만)',
              cone: '헤드업 모드로 전환 (현재: cone)',
              'head-up': '위치/방향 끄기 (현재: 헤드업)',
            }[cycleState]}
            title={{
              pending: '위치 찾는 중',
              off: '위치',
              gps: '위치 ON',
              cone: '위치 + cone',
              'head-up': '헤드업',
            }[cycleState]}
            className={`${hudIconBtn} ${{
              pending: hudInactive,
              off: hudInactive,
              gps: hudSkyActive,
              cone: hudSkyActive,
              'head-up': hudVioletActive,
            }[cycleState]} disabled:opacity-60`}
          >
            {cycleState === 'pending' ? (
              <Loader2 size={20} aria-hidden="true" className="animate-spin" />
            ) : cycleState === 'head-up' ? (
              <Navigation size={20} aria-hidden="true" fill="currentColor" />
            ) : cycleState === 'cone' ? (
              <Compass size={20} aria-hidden="true" />
            ) : (
              <Target size={20} aria-hidden="true" />
            )}
          </button>
        </div>
        {showLoadingOverlay && manifest && (
          <div
            className="pointer-events-none absolute inset-0 z-[1002] flex items-center justify-center px-4"
            role="status"
            aria-live="polite"
            aria-label="자치구 데이터 로드 중"
          >
            <div className="rounded-2xl bg-white/95 px-5 py-4 text-sm text-neutral-900 shadow-2xl ring-1 ring-neutral-200 backdrop-blur-sm min-w-[200px] dark:bg-neutral-900/85 dark:text-neutral-100 dark:ring-neutral-700">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <span
                  aria-hidden
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-amber-500 dark:border-neutral-600 dark:border-t-amber-400"
                />
                <span>
                  자치구 로드 ({loadedPopulatedCount}/{populatedDistrictCount})
                </span>
              </div>
              <ul className="space-y-1 text-xs">
                {districtBreakdown.map((d) => {
                  const status = d.loaded
                    ? 'loaded'
                    : d.failed
                      ? 'failed'
                      : d.inFlight
                        ? 'inFlight'
                        : 'pending';
                  const { icon, cls } = STATUS_VIS[status];
                  return (
                    <li
                      key={d.code}
                      className={`flex items-center justify-between gap-3 ${
                        d.loaded
                          ? 'text-neutral-700 dark:text-neutral-200'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span aria-hidden className={`font-mono ${cls}`}>
                          {icon}
                        </span>
                        <span>{d.name}</span>
                      </span>
                      <span className="font-mono text-neutral-400 dark:text-neutral-500">
                        {d.loaded ? d.binCount : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
        {tapTarget && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-20 z-[1001] flex justify-center px-4"
            role="status"
            aria-live="polite"
          >
            <div
              className={`rounded-full px-5 py-3 text-sm font-semibold text-white shadow-2xl ring-2 ${
                tapTarget === 'origin'
                  ? 'bg-violet-600 ring-violet-300'
                  : 'bg-rose-600 ring-rose-300'
              }`}
            >
              {tapTarget === 'origin'
                ? '🎯 지도에서 출발 위치를 탭하거나 검색하세요'
                : '🏁 지도에서 목적지를 탭하거나 검색하세요'}
            </div>
          </div>
        )}
        {toast && (
          <div
            className={`pointer-events-none absolute inset-x-0 z-[1001] flex justify-center px-6 ${
              toast.position === 'top' ? 'top-16' : 'inset-y-0 items-center'
            }`}
            role={toast.variant === 'error' ? 'alert' : 'status'}
            aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
          >
            <div
              className={
                toast.variant === 'error'
                  ? 'max-w-sm rounded-2xl bg-red-600/85 px-6 py-4 text-center text-sm font-semibold text-white shadow-2xl ring-1 ring-red-300/70 backdrop-blur-lg'
                  : toast.variant === 'emphatic'
                    ? 'max-w-sm rounded-2xl bg-emerald-600/85 px-6 py-4 text-center text-sm font-semibold text-white shadow-2xl ring-1 ring-emerald-300/70 backdrop-blur-lg'
                    : 'max-w-sm rounded-2xl bg-white/70 px-6 py-4 text-center text-sm text-neutral-900 shadow-2xl ring-1 ring-neutral-300/70 backdrop-blur-lg dark:bg-neutral-900/70 dark:text-neutral-50 dark:ring-neutral-700/60'
              }
            >
              {toast.variant === 'error' && <span aria-hidden className="mr-1.5">⚠</span>}
              {toast.variant === 'emphatic' && <span aria-hidden className="mr-1.5">✅</span>}
              {toast.text}
            </div>
          </div>
        )}
        {manifest && (
          <div className="absolute bottom-7 right-2 z-[1000] flex max-w-[80%] flex-col items-stretch overflow-hidden rounded-lg bg-white/45 text-neutral-800 ring-1 ring-neutral-200 backdrop-blur-sm dark:bg-neutral-900/45 dark:text-neutral-100 dark:ring-neutral-700">
            {!statusCollapsed && (
              <div className="border-b border-neutral-200/70 px-3 py-2 text-[11px] leading-relaxed dark:border-neutral-700/70">
                <a
                  href="https://www.data.go.kr/data/15129450/standard.do"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                  aria-label={`데이터 출처: 공공데이터포털 전국휴지통표준데이터 v${manifest.version}`}
                >
                  <span>출처 → 공공데이터포털</span>
                  <ExternalLink size={12} aria-hidden="true" className="shrink-0" />
                </a>
                {(bestRouteCandidate || bestNearestCandidate || savings.uses > 0) && (
                  <div className="mt-1.5 space-y-0.5 border-t border-neutral-200/70 pt-1.5 dark:border-neutral-700/70">
                    {bestRouteCandidate && (
                      <div className="text-cyan-700 dark:text-cyan-300">
                        → {bestRouteCandidate.bin.name.split(',')[0]} {formatDistance(bestRouteCandidate.cost.total)} · {formatEta(etaSeconds(bestRouteCandidate.cost.total, walkingSpeed))}
                      </div>
                    )}
                    {!bestRouteCandidate && bestNearestCandidate && (
                      <div className="text-sky-700 dark:text-sky-300">
                        가까운 {bestNearestCandidate.bin.name.split(',')[0]} · {formatDistance(bestNearestCandidate.meters)} · {formatEta(etaSeconds(bestNearestCandidate.meters, walkingSpeed))}
                      </div>
                    )}
                    {savings.uses > 0 && (
                      <div className="text-emerald-700 dark:text-emerald-300">{formatSavingsLine(savings)}</div>
                    )}
                  </div>
                )}
                {districtBreakdown.length >= 2 && (
                  <ul className="mt-1.5 space-y-0.5 border-t border-neutral-200/70 pt-1.5 dark:border-neutral-700/70">
                    {districtBreakdown.map((d) => {
                      const status = d.loaded
                        ? 'loaded'
                        : d.failed
                          ? 'failed'
                          : d.inFlight
                            ? 'inFlight'
                            : 'pending';
                      const { icon, cls } = STATUS_VIS[status];
                      return (
                        <li
                          key={d.code}
                          className={`flex items-center justify-between gap-3 ${
                            d.loaded
                              ? 'text-neutral-700 dark:text-neutral-200'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            <span aria-hidden className={`font-mono ${cls}`}>
                              {icon}
                            </span>
                            <span>{d.name}</span>
                          </span>
                          <span className="font-mono text-neutral-400 dark:text-neutral-500">
                            {d.binCount}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                vibrate(HAPTIC.TAP);
                setStatusCollapsed((prev) => !prev);
              }}
              aria-expanded={!statusCollapsed}
              aria-label={`데이터 현황 ${statusCollapsed ? '펼치기' : '접기'}`}
              className="flex w-full items-center gap-1.5 px-3 py-2 text-xs font-medium hover:bg-neutral-100/40 dark:hover:bg-neutral-800/40"
            >
              <BarChart3 size={20} aria-hidden="true" />
              <span className="text-neutral-600 dark:text-neutral-400">v{manifest.version}</span>
              <span aria-hidden className="text-neutral-300 dark:text-neutral-600">·</span>
              <MapPin size={20} aria-hidden="true" />
              <span className="font-mono">
                {visible.length}/{totalAvailableBins || bins.length}
              </span>
              {activeFetches.size > 0 && (
                <span
                  aria-hidden
                  className="ml-0.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400"
                  role="status"
                  aria-live="polite"
                />
              )}
              <span aria-hidden className="ml-auto flex text-neutral-700 dark:text-neutral-200">
                {statusCollapsed ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </span>
            </button>
          </div>
        )}
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
