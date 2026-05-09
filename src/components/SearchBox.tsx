'use client';

import { useEffect, useRef, useState } from 'react';
import { FOCUS_VISIBLE_CLASS } from '@/lib/a11y';
import { HAPTIC, vibrate } from '@/lib/haptic';
import type { NominatimResult } from '@/lib/search';

type SelectMode = 'origin' | 'destination' | null;

type Props = {
  onSelect: (
    lat: number,
    lon: number,
    label: string,
    mode: SelectMode,
  ) => void;
  tapMode: string | null;
  onDropdownChange?: (open: boolean) => void;
};

type SearchApiError = {
  message?: string;
};

function resolveMode(tapMode: string | null): SelectMode {
  if (tapMode === 'origin' || tapMode === 'destination') {
    return tapMode;
  }
  return null;
}

export function SearchBox({ onSelect, tapMode, onDropdownChange }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const skipNextFetchRef = useRef(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }

      const target = event.target;
      if (target instanceof Node && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setResults([]);
      setError(null);
      setLoading(false);
      setOpen(false);
      return;
    }

    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        setOpen(true);

        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmedQuery)}`,
          {
            cache: 'no-store',
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          const payload: SearchApiError = (await response.json()) as SearchApiError;
          throw new Error(payload.message ?? '검색 결과를 가져오지 못했습니다.');
        }

        const data: NominatimResult[] = (await response.json()) as NominatimResult[];
        setResults(data.slice(0, 5));
        setOpen(true);
      } catch (fetchError: unknown) {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === 'AbortError'
        ) {
          return;
        }

        setResults([]);
        setOpen(true);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : '검색 결과를 가져오지 못했습니다.',
        );
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const handleSelect = (result: NominatimResult) => {
    const lat = Number(result.lat);
    const lon = Number(result.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      setError('좌표를 읽지 못했습니다.');
      setOpen(true);
      return;
    }

    vibrate(HAPTIC.SELECT);
    onSelect(lat, lon, result.display_name, resolveMode(tapMode));
    skipNextFetchRef.current = true;
    setQuery(result.display_name);
    setOpen(false);
    setError(null);
  };

  const showDropdown = open && query.trim().length > 0;
  const showEmpty = !loading && !error && results.length === 0;

  useEffect(() => {
    onDropdownChange?.(showDropdown);
  }, [showDropdown, onDropdownChange]);

  return (
    <div ref={rootRef} className="relative w-full">
      <label htmlFor="search-box" className="sr-only">
        주소 또는 랜드마크 검색
      </label>
      <input
        id="search-box"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => {
          if (query.trim()) {
            setOpen(true);
          }
        }}
        placeholder={
          tapMode === 'origin'
            ? '출발지 주소·랜드마크 검색'
            : tapMode === 'destination'
              ? '목적지 주소·랜드마크 검색'
              : '주소·랜드마크 검색'
        }
        className={`min-h-[44px] w-full rounded-2xl border border-neutral-200 bg-white px-4 pr-12 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-500 focus:border-neutral-400 focus:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-500 dark:focus:bg-neutral-800 ${FOCUS_VISIBLE_CLASS}`}
        autoComplete="off"
        spellCheck={false}
      />
      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs text-neutral-500 dark:text-neutral-400">
        {loading ? '검색중' : '검색'}
      </div>

      {showDropdown && (
        <div className="absolute top-full z-[1000] mt-2 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
          {loading && (
            <div className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">검색 중…</div>
          )}
          {!loading && error && (
            <div className="px-4 py-3 text-sm text-red-600 dark:text-red-300">{error}</div>
          )}
          {!loading && showEmpty && (
            <div className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
              검색 결과가 없습니다.
            </div>
          )}
          {!loading &&
            !error &&
            results.map((result) => (
              <button
                key={result.place_id}
                type="button"
                onClick={() => handleSelect(result)}
                className={`flex min-h-[44px] w-full items-start gap-3 border-t border-neutral-100 px-4 py-3 text-left text-sm text-neutral-900 first:border-t-0 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-800 ${FOCUS_VISIBLE_CLASS}`}
              >
                <span aria-hidden className="pt-0.5 text-neutral-500 dark:text-neutral-400">
                  📍
                </span>
                <span className="line-clamp-2">{result.display_name}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
