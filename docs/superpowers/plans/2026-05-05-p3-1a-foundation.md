# P3.1a Data Partition Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "현재 1개 자치구로도 동작하는 자치구 단위 lazy-load 아키텍처" 도입. 데이터/타입/스토어 모양을 다구 시대에 맞게 갈아끼우되, 시각·UX는 P2 종료 시점과 동일.

**Architecture:** 정적 자원을 `seoul-manifest.json` + `seoul-districts.geojson` + `districts/<code>.json` 3개 축으로 분리. 클라이언트는 부트 시 manifest+geojson 병렬 fetch → GPS·URL·기본값으로 초기 자치구 코드 결정 → 해당 자치구 JSON fetch. 활성 자치구 set은 1개 (다구 진입 트리거는 P3.2/P3.3에서 추가).

**Tech Stack:** Next.js 16 App Router · Bun · TypeScript strict · Vitest 4 · Vercel CDN.

**Spec:** `docs/superpowers/specs/2026-05-05-p3-1-data-partitioning-design.md`

---

## File Structure

**Create (new files):**

| Path | Responsibility |
|------|----------------|
| `src/lib/point-in-district.ts` | `findDistrictForPoint()` ray-casting + `findNearestDistrictCentroid()` 폴백. GeoJSON 좌표 순서(`[lng,lat]`) 변환을 함수 안에 격리 |
| `src/lib/__tests__/point-in-district.test.ts` | centroid in-self / 한강 fallback / 서울 밖 |
| `src/lib/districts.ts` | manifest 로더, version-bust URL, district 메타 lookup |
| `src/lib/__tests__/districts.test.ts` | manifest 파싱·lookup·URL bust |
| `public/data/seoul-manifest.json` | 25구 메타 + version + binCount + adjacent (junggu만 채움, 24개는 placeholder) |
| `public/data/seoul-districts.geojson` | 25구 경계 폴리곤 (Mapshaper 단순화) |
| `public/data/districts/junggu.json` | 기존 `public/data/junggu.json` 이동 |

**Modify:**

| Path | Change |
|------|--------|
| `src/lib/types.ts` | `DistrictCode`, `DistrictMeta`, `Manifest` 타입 추가 |
| `src/lib/data.ts` | `fetchBins()` 제거, `fetchDistrict(code)` + 모듈 캐시로 교체 |
| `src/lib/__tests__/data.test.ts` | 신 시그니처에 맞춰 갱신, 캐시 hit 테스트 추가 |
| `src/app/page.tsx` | `bins` 단일 state → `districtsCache` Map + `activeDistricts` Set, 부트 시퀀스 갱신 |
| `public/data/junggu.json` | 삭제 (districts/로 이동했음) |
| `docs/tasks.md` | P3.1a Done 이동, 함정 메모 3건 추가 |
| `CHANGELOG.md` | `[Unreleased]` Infrastructure에 한 줄 |

**Out of scope (P3.1a 안 건드림):**

- 사용자 panning에 의한 다구 active set 추가 (→ P3.2, 데이터 들어온 뒤)
- markercluster (→ P3.1b)
- 인접 구 prefetch (→ P3.1c)
- `scripts/transform.ts`: 출력 경로만 호출자가 바꾸면 되므로 스크립트 자체는 무수정

---

## Pre-flight

- [ ] **Confirm worktree**

Run: `pwd && git rev-parse --abbrev-ref HEAD`
Expected: `<repo>/.worktrees/p3.1a-foundation` and `feat/p3.1a-data-partition-foundation`

- [ ] **Confirm baseline tests**

Run: `bun run test`
Expected: 7 files, 105 tests passing.

---

## Task 1: 타입 추가 — DistrictCode / DistrictMeta / Manifest

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add types**

Open `src/lib/types.ts` and append at end:

```ts
export type DistrictCode = string; // e.g. "junggu", "jongno"

export type DistrictMeta = {
  code: DistrictCode;
  name: string; // 한글, e.g. "중구"
  binCount: number; // 0 means data not yet imported
  bbox: [number, number, number, number]; // [west, south, east, north] lng/lat
  centroid: [number, number]; // [lng, lat]
  adjacent: DistrictCode[];
};

export type Manifest = {
  version: string; // "YYYY-MM-DD" — bumped on data refresh, used for cache-bust query
  districts: DistrictMeta[];
};
```

- [ ] **Step 2: Type-check passes**

Run: `bun run build`
Expected: build succeeds. (We expose new types; nothing references them yet.)

If a `tsbuildinfo` cache reports stale errors, delete it:

```bash
rm -f tsconfig.tsbuildinfo
bun run build
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(p3.1a): add DistrictCode/DistrictMeta/Manifest types"
```

---

## Task 2: point-in-district 순수 함수 (TDD)

**Files:**
- Create: `src/lib/point-in-district.ts`
- Create: `src/lib/__tests__/point-in-district.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/point-in-district.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  findDistrictForPoint,
  findNearestDistrictCentroid,
} from '../point-in-district';
import type { DistrictMeta } from '../types';

// Minimal FeatureCollection: junggu = unit square around (127, 37.56)
const FAKE_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { code: 'junggu' },
      geometry: {
        type: 'Polygon',
        // [lng, lat] order, ring closed
        coordinates: [
          [
            [126.99, 37.55],
            [127.01, 37.55],
            [127.01, 37.57],
            [126.99, 37.57],
            [126.99, 37.55],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { code: 'jongno' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [126.97, 37.57],
            [127.00, 37.57],
            [127.00, 37.60],
            [126.97, 37.60],
            [126.97, 37.57],
          ],
        ],
      },
    },
  ],
} as const;

const FAKE_MANIFEST_DISTRICTS: DistrictMeta[] = [
  {
    code: 'junggu',
    name: '중구',
    binCount: 59,
    bbox: [126.99, 37.55, 127.01, 37.57],
    centroid: [127.00, 37.56],
    adjacent: [],
  },
  {
    code: 'jongno',
    name: '종로',
    binCount: 0,
    bbox: [126.97, 37.57, 127.00, 37.60],
    centroid: [126.985, 37.585],
    adjacent: [],
  },
];

describe('findDistrictForPoint', () => {
  it('returns the district whose polygon contains the point', () => {
    const result = findDistrictForPoint(
      { lat: 37.56, lng: 127.0 },
      FAKE_GEOJSON,
    );
    expect(result).toBe('junggu');
  });

  it('returns null when point is outside every polygon', () => {
    const result = findDistrictForPoint(
      { lat: 37.0, lng: 126.0 }, // far west of seoul
      FAKE_GEOJSON,
    );
    expect(result).toBeNull();
  });

  it('handles coordinate input as {lat,lng} but reads geojson [lng,lat] correctly', () => {
    // If someone swapped axes, point (37.585, 126.985) would test as (lng=37, lat=126)
    // and miss every polygon. This guards that bug.
    const result = findDistrictForPoint(
      { lat: 37.585, lng: 126.985 },
      FAKE_GEOJSON,
    );
    expect(result).toBe('jongno');
  });
});

describe('findNearestDistrictCentroid', () => {
  it('returns the closest centroid by haversine when point is outside all polygons', () => {
    // Point south of both districts, slightly closer to junggu centroid (127, 37.56) than to jongno centroid (126.985, 37.585)
    const result = findNearestDistrictCentroid(
      { lat: 37.50, lng: 127.0 },
      FAKE_MANIFEST_DISTRICTS,
    );
    expect(result).toBe('junggu');
  });

  it('breaks ties deterministically by array order', () => {
    // Equidistant midpoint — ensures stable behavior.
    const equidistant = { lat: 37.5725, lng: 126.9925 }; // midpoint between centroids
    const result = findNearestDistrictCentroid(equidistant, FAKE_MANIFEST_DISTRICTS);
    // Either junggu or jongno acceptable, but deterministic across runs:
    expect(['junggu', 'jongno']).toContain(result);
  });
});
```

- [ ] **Step 2: Run test — expect failure**

Run: `bun run test src/lib/__tests__/point-in-district.test.ts`
Expected: FAIL — `Cannot find module '../point-in-district'`.

- [ ] **Step 3: Implement point-in-district**

Create `src/lib/point-in-district.ts`:

```ts
import type { DistrictCode, DistrictMeta } from './types';

type LngLat = [number, number]; // GeoJSON order
type Ring = LngLat[];

type GeoFeature = {
  type: 'Feature';
  properties: { code: DistrictCode };
  geometry:
    | { type: 'Polygon'; coordinates: Ring[] }
    | { type: 'MultiPolygon'; coordinates: Ring[][] };
};

type FeatureCollection = {
  type: 'FeatureCollection';
  features: ReadonlyArray<GeoFeature>;
};

function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  // Standard ray-casting. ring is closed ([first] === [last]).
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInFeature(lng: number, lat: number, feature: GeoFeature): boolean {
  if (feature.geometry.type === 'Polygon') {
    const [outer, ...holes] = feature.geometry.coordinates;
    if (!pointInRing(lng, lat, outer)) return false;
    return holes.every((h) => !pointInRing(lng, lat, h));
  }
  // MultiPolygon
  return feature.geometry.coordinates.some((rings) => {
    const [outer, ...holes] = rings;
    if (!pointInRing(lng, lat, outer)) return false;
    return holes.every((h) => !pointInRing(lng, lat, h));
  });
}

export function findDistrictForPoint(
  point: { lat: number; lng: number },
  geojson: FeatureCollection,
): DistrictCode | null {
  for (const feature of geojson.features) {
    if (pointInFeature(point.lng, point.lat, feature)) {
      return feature.properties.code;
    }
  }
  return null;
}

function haversineMeters(a: { lat: number; lng: number }, bLng: number, bLat: number): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - a.lat);
  const dLng = toRad(bLng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(bLat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function findNearestDistrictCentroid(
  point: { lat: number; lng: number },
  districts: ReadonlyArray<DistrictMeta>,
): DistrictCode {
  if (districts.length === 0) {
    throw new Error('findNearestDistrictCentroid: empty districts');
  }
  let bestCode = districts[0].code;
  let bestDist = Infinity;
  for (const d of districts) {
    const [lng, lat] = d.centroid;
    const dist = haversineMeters(point, lng, lat);
    if (dist < bestDist) {
      bestDist = dist;
      bestCode = d.code;
    }
  }
  return bestCode;
}
```

- [ ] **Step 4: Run test — expect pass**

Run: `bun run test src/lib/__tests__/point-in-district.test.ts`
Expected: 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/point-in-district.ts src/lib/__tests__/point-in-district.test.ts
git commit -m "feat(p3.1a): point-in-polygon district lookup + nearest-centroid fallback"
```

---

## Task 3: districts.ts — manifest 로더 + version-bust URL (TDD)

**Files:**
- Create: `src/lib/districts.ts`
- Create: `src/lib/__tests__/districts.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/districts.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../monitoring', () => ({
  captureLoadBinsError: vi.fn(),
}));

import {
  buildDistrictUrl,
  fetchManifest,
  fetchDistrictsGeoJson,
  findDistrictMeta,
} from '../districts';
import type { Manifest } from '../types';

const FAKE_MANIFEST: Manifest = {
  version: '2026-04-14',
  districts: [
    {
      code: 'junggu',
      name: '중구',
      binCount: 59,
      bbox: [126.99, 37.55, 127.01, 37.57],
      centroid: [127.0, 37.56],
      adjacent: ['jongno'],
    },
    {
      code: 'jongno',
      name: '종로',
      binCount: 0,
      bbox: [126.97, 37.57, 127.0, 37.6],
      centroid: [126.985, 37.585],
      adjacent: [],
    },
  ],
};

describe('buildDistrictUrl', () => {
  it('appends version as cache-bust query', () => {
    expect(buildDistrictUrl('junggu', '2026-04-14')).toBe(
      '/data/districts/junggu.json?v=2026-04-14',
    );
  });
});

describe('findDistrictMeta', () => {
  it('returns the meta entry by code', () => {
    expect(findDistrictMeta(FAKE_MANIFEST, 'jongno')?.name).toBe('종로');
  });

  it('returns undefined for unknown code', () => {
    expect(findDistrictMeta(FAKE_MANIFEST, 'nowhere')).toBeUndefined();
  });
});

describe('fetchManifest', () => {
  afterEach(() => vi.restoreAllMocks());

  it('fetches and parses the manifest', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => FAKE_MANIFEST,
      } as Response),
    );

    const m = await fetchManifest();
    expect(m.version).toBe('2026-04-14');
    expect(m.districts).toHaveLength(2);
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response),
    );
    await expect(fetchManifest()).rejects.toThrow();
  });
});

describe('fetchDistrictsGeoJson', () => {
  afterEach(() => vi.restoreAllMocks());

  it('fetches the geojson FeatureCollection', async () => {
    const fc = { type: 'FeatureCollection', features: [] };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => fc } as Response),
    );
    const result = await fetchDistrictsGeoJson();
    expect(result.type).toBe('FeatureCollection');
  });
});
```

- [ ] **Step 2: Run test — expect failure**

Run: `bun run test src/lib/__tests__/districts.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement districts.ts**

Create `src/lib/districts.ts`:

```ts
import { captureLoadBinsError } from './monitoring';
import type { DistrictCode, DistrictMeta, Manifest } from './types';

const MANIFEST_URL = '/data/seoul-manifest.json';
const GEOJSON_URL = '/data/seoul-districts.geojson';

export function buildDistrictUrl(code: DistrictCode, version: string): string {
  return `/data/districts/${code}.json?v=${encodeURIComponent(version)}`;
}

export function findDistrictMeta(
  manifest: Manifest,
  code: DistrictCode,
): DistrictMeta | undefined {
  return manifest.districts.find((d) => d.code === code);
}

export async function fetchManifest(): Promise<Manifest> {
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'force-cache' });
    if (!res.ok) {
      throw new Error(`Failed to load manifest: ${res.status}`);
    }
    return (await res.json()) as Manifest;
  } catch (error) {
    captureLoadBinsError(error);
    throw error;
  }
}

export async function fetchDistrictsGeoJson(): Promise<unknown> {
  try {
    const res = await fetch(GEOJSON_URL, { cache: 'force-cache' });
    if (!res.ok) {
      throw new Error(`Failed to load districts geojson: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    captureLoadBinsError(error);
    throw error;
  }
}
```

- [ ] **Step 4: Run test — expect pass**

Run: `bun run test src/lib/__tests__/districts.test.ts`
Expected: 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/districts.ts src/lib/__tests__/districts.test.ts
git commit -m "feat(p3.1a): manifest loader + geojson loader + version-bust URL"
```

---

## Task 4: data.ts 리팩터 — fetchDistrict + 모듈 캐시 (TDD)

**Files:**
- Modify: `src/lib/data.ts`
- Modify: `src/lib/__tests__/data.test.ts`

- [ ] **Step 1: Replace data.test.ts**

Overwrite `src/lib/__tests__/data.test.ts` with:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../monitoring', () => ({
  captureLoadBinsError: vi.fn(),
}));

import { _resetDistrictCache, fetchDistrict, filterByTypes } from '../data';
import { captureLoadBinsError } from '../monitoring';
import type { TrashBin } from '../types';

const SAMPLE_BINS: TrashBin[] = [
  {
    id: 'JG-0001',
    name: '테스트 휴지통',
    sido: '서울특별시',
    sigungu: '중구',
    roadAddress: '',
    lat: 37.56,
    lng: 127.0,
    types: ['일반'],
    updatedAt: '2026-04-14',
  },
];

describe('fetchDistrict', () => {
  beforeEach(() => _resetDistrictCache());
  afterEach(() => vi.restoreAllMocks());

  it('fetches bins for a district code with version-bust URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => SAMPLE_BINS,
    } as Response);
    vi.stubGlobal('fetch', fetchMock);

    const bins = await fetchDistrict('junggu', '2026-04-14');
    expect(bins).toEqual(SAMPLE_BINS);
    expect(fetchMock).toHaveBeenCalledWith(
      '/data/districts/junggu.json?v=2026-04-14',
      expect.objectContaining({ cache: 'force-cache' }),
    );
  });

  it('caches by district code — second call does not refetch', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => SAMPLE_BINS } as Response);
    vi.stubGlobal('fetch', fetchMock);

    await fetchDistrict('junggu', '2026-04-14');
    await fetchDistrict('junggu', '2026-04-14');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('captures and rethrows on network failure', async () => {
    const error = new Error('network failed');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));

    await expect(fetchDistrict('junggu', '2026-04-14')).rejects.toThrow(
      'network failed',
    );
    expect(captureLoadBinsError).toHaveBeenCalledWith(error);
  });

  it('throws when district response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response),
    );
    await expect(fetchDistrict('junggu', '2026-04-14')).rejects.toThrow();
  });
});

describe('filterByTypes (regression)', () => {
  it('returns all bins when no filter selected', () => {
    expect(filterByTypes(SAMPLE_BINS, new Set())).toEqual(SAMPLE_BINS);
  });

  it('filters by type intersection', () => {
    const recyclingOnly: TrashBin[] = [{ ...SAMPLE_BINS[0], types: ['재활용'] }];
    expect(filterByTypes(recyclingOnly, new Set(['일반']))).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test — expect failure**

Run: `bun run test src/lib/__tests__/data.test.ts`
Expected: FAIL — `_resetDistrictCache`/`fetchDistrict` not exported.

- [ ] **Step 3: Replace data.ts**

Overwrite `src/lib/data.ts`:

```ts
import { buildDistrictUrl } from './districts';
import { captureLoadBinsError } from './monitoring';
import type { BinType, DistrictCode, TrashBin } from './types';

const cache = new Map<DistrictCode, TrashBin[]>();

export async function fetchDistrict(
  code: DistrictCode,
  version: string,
): Promise<TrashBin[]> {
  const cached = cache.get(code);
  if (cached) return cached;

  try {
    const res = await fetch(buildDistrictUrl(code, version), {
      cache: 'force-cache',
    });
    if (!res.ok) {
      throw new Error(`Failed to load district ${code}: ${res.status}`);
    }
    const bins = (await res.json()) as TrashBin[];
    cache.set(code, bins);
    return bins;
  } catch (error) {
    captureLoadBinsError(error);
    throw error;
  }
}

/** Test-only: reset the in-memory cache so each test starts clean. */
export function _resetDistrictCache(): void {
  cache.clear();
}

export function filterByTypes(bins: TrashBin[], selected: Set<BinType>): TrashBin[] {
  if (selected.size === 0) return bins;
  return bins.filter((bin) => bin.types.some((t) => selected.has(t)));
}
```

- [ ] **Step 4: Run test — expect pass**

Run: `bun run test src/lib/__tests__/data.test.ts`
Expected: 6 tests passing.

- [ ] **Step 5: Run full suite — expect ALL old + new tests pass except page.tsx caller**

Run: `bun run test`
Expected: tests pass except possibly page-level (page.tsx will fail to type-check at build time because it imports the now-missing `fetchBins`). vitest unit suite alone should be green. We fix `page.tsx` next.

- [ ] **Step 6: Commit**

```bash
git add src/lib/data.ts src/lib/__tests__/data.test.ts
git commit -m "feat(p3.1a): fetchDistrict + module-level cache (replaces fetchBins)"
```

---

## Task 5: 정적 자원 배치 — manifest, geojson, district JSON 이동

**Files:**
- Move: `public/data/junggu.json` → `public/data/districts/junggu.json`
- Create: `public/data/seoul-manifest.json`
- Create: `public/data/seoul-districts.geojson`

- [ ] **Step 1: Move junggu.json into districts/ subdirectory**

```bash
mkdir -p public/data/districts
git mv public/data/junggu.json public/data/districts/junggu.json
```

Verify: `ls public/data/districts/junggu.json` → exists. `ls public/data/junggu.json` → no such file.

- [ ] **Step 2: Create seoul-manifest.json**

Create `public/data/seoul-manifest.json` with all 25 Seoul districts. Only `junggu` has full data; the other 24 are placeholders (`binCount: 0`, `adjacent: []` filled in P3.1c).

```json
{
  "version": "2026-04-14",
  "districts": [
    { "code": "junggu", "name": "중구", "binCount": 59, "bbox": [126.965, 37.546, 127.020, 37.575], "centroid": [126.998, 37.563], "adjacent": ["jongno", "yongsan", "seongdong", "seodaemun", "mapo"] },
    { "code": "jongno", "name": "종로구", "binCount": 0, "bbox": [126.939, 37.571, 127.030, 37.628], "centroid": [126.979, 37.594], "adjacent": [] },
    { "code": "yongsan", "name": "용산구", "binCount": 0, "bbox": [126.966, 37.518, 127.027, 37.557], "centroid": [126.990, 37.532], "adjacent": [] },
    { "code": "seongdong", "name": "성동구", "binCount": 0, "bbox": [127.015, 37.536, 127.085, 37.572], "centroid": [127.037, 37.563], "adjacent": [] },
    { "code": "gwangjin", "name": "광진구", "binCount": 0, "bbox": [127.060, 37.524, 127.114, 37.566], "centroid": [127.082, 37.538], "adjacent": [] },
    { "code": "dongdaemun", "name": "동대문구", "binCount": 0, "bbox": [127.020, 37.566, 127.077, 37.602], "centroid": [127.040, 37.574], "adjacent": [] },
    { "code": "jungnang", "name": "중랑구", "binCount": 0, "bbox": [127.071, 37.578, 127.128, 37.625], "centroid": [127.092, 37.606], "adjacent": [] },
    { "code": "seongbuk", "name": "성북구", "binCount": 0, "bbox": [126.997, 37.586, 127.060, 37.652], "centroid": [127.017, 37.589], "adjacent": [] },
    { "code": "gangbuk", "name": "강북구", "binCount": 0, "bbox": [127.000, 37.620, 127.062, 37.670], "centroid": [127.025, 37.640], "adjacent": [] },
    { "code": "dobong", "name": "도봉구", "binCount": 0, "bbox": [127.022, 37.640, 127.072, 37.703], "centroid": [127.047, 37.668], "adjacent": [] },
    { "code": "nowon", "name": "노원구", "binCount": 0, "bbox": [127.045, 37.612, 127.110, 37.690], "centroid": [127.075, 37.654], "adjacent": [] },
    { "code": "eunpyeong", "name": "은평구", "binCount": 0, "bbox": [126.886, 37.596, 126.957, 37.660], "centroid": [126.929, 37.617], "adjacent": [] },
    { "code": "seodaemun", "name": "서대문구", "binCount": 0, "bbox": [126.911, 37.561, 126.969, 37.612], "centroid": [126.936, 37.579], "adjacent": [] },
    { "code": "mapo", "name": "마포구", "binCount": 0, "bbox": [126.870, 37.535, 126.972, 37.575], "centroid": [126.908, 37.566], "adjacent": [] },
    { "code": "yangcheon", "name": "양천구", "binCount": 0, "bbox": [126.836, 37.510, 126.900, 37.554], "centroid": [126.866, 37.517], "adjacent": [] },
    { "code": "gangseo", "name": "강서구", "binCount": 0, "bbox": [126.764, 37.530, 126.866, 37.601], "centroid": [126.850, 37.551], "adjacent": [] },
    { "code": "guro", "name": "구로구", "binCount": 0, "bbox": [126.815, 37.480, 126.910, 37.516], "centroid": [126.887, 37.495], "adjacent": [] },
    { "code": "geumcheon", "name": "금천구", "binCount": 0, "bbox": [126.880, 37.439, 126.929, 37.490], "centroid": [126.900, 37.457], "adjacent": [] },
    { "code": "yeongdeungpo", "name": "영등포구", "binCount": 0, "bbox": [126.876, 37.491, 126.957, 37.547], "centroid": [126.896, 37.526], "adjacent": [] },
    { "code": "dongjak", "name": "동작구", "binCount": 0, "bbox": [126.917, 37.478, 126.985, 37.521], "centroid": [126.951, 37.512], "adjacent": [] },
    { "code": "gwanak", "name": "관악구", "binCount": 0, "bbox": [126.910, 37.443, 126.989, 37.499], "centroid": [126.951, 37.478], "adjacent": [] },
    { "code": "seocho", "name": "서초구", "binCount": 0, "bbox": [126.984, 37.443, 127.057, 37.510], "centroid": [127.032, 37.483], "adjacent": [] },
    { "code": "gangnam", "name": "강남구", "binCount": 0, "bbox": [127.019, 37.464, 127.115, 37.541], "centroid": [127.047, 37.517], "adjacent": [] },
    { "code": "songpa", "name": "송파구", "binCount": 0, "bbox": [127.075, 37.476, 127.180, 37.530], "centroid": [127.105, 37.514], "adjacent": [] },
    { "code": "gangdong", "name": "강동구", "binCount": 0, "bbox": [127.110, 37.520, 127.193, 37.567], "centroid": [127.147, 37.530], "adjacent": [] }
  ]
}
```

> **Note**: bbox/centroid는 대략값 (Wikipedia/Naver Map 추정). P3.1a 동작에는 정확도 무관 — junggu만 활용. P3.1c 인접 prefetch 도입 시 GeoJSON에서 정확한 centroid를 계산해 manifest에 갱신할 것.

- [ ] **Step 3: Create seoul-districts.geojson**

GeoJSON 폴리곤 데이터 출처: [southkorea/seoul-maps](https://github.com/southkorea/seoul-maps) (KOSTAT 2013, public domain). 다운로드 + Mapshaper 단순화 + properties 통일.

```bash
# 1. 원본 다운로드 (~1.5MB)
curl -L -o /tmp/seoul-raw.geojson \
  https://raw.githubusercontent.com/southkorea/seoul-maps/master/kostat/2013/json/seoul_municipalities_geo_simple.json

# 2. Mapshaper로 단순화 + property 통일 (npx 첫 실행 시 ~30s)
npx -y mapshaper@0.6 /tmp/seoul-raw.geojson \
  -simplify 8% keep-shapes \
  -rename-fields code=name_eng \
  -filter-fields code \
  -o public/data/seoul-districts.geojson format=geojson
```

`name_eng` 필드는 영문 자치구명 (`Jung-gu`, `Jongno-gu` 등). manifest의 `code`(예: `junggu`)와 매칭하려면 변환 필요. 위 명령은 `name_eng`를 `code`로 rename하기만 하므로 후속 정규화가 필요하다:

```bash
# 3. 영문 매핑을 manifest 코드로 정규화
node --input-type=module -e "
import { readFileSync, writeFileSync } from 'node:fs';
const ENG_TO_CODE = {
  'Jung-gu': 'junggu', 'Jongno-gu': 'jongno', 'Yongsan-gu': 'yongsan',
  'Seongdong-gu': 'seongdong', 'Gwangjin-gu': 'gwangjin', 'Dongdaemun-gu': 'dongdaemun',
  'Jungnang-gu': 'jungnang', 'Seongbuk-gu': 'seongbuk', 'Gangbuk-gu': 'gangbuk',
  'Dobong-gu': 'dobong', 'Nowon-gu': 'nowon', 'Eunpyeong-gu': 'eunpyeong',
  'Seodaemun-gu': 'seodaemun', 'Mapo-gu': 'mapo', 'Yangcheon-gu': 'yangcheon',
  'Gangseo-gu': 'gangseo', 'Guro-gu': 'guro', 'Geumcheon-gu': 'geumcheon',
  'Yeongdeungpo-gu': 'yeongdeungpo', 'Dongjak-gu': 'dongjak', 'Gwanak-gu': 'gwanak',
  'Seocho-gu': 'seocho', 'Gangnam-gu': 'gangnam', 'Songpa-gu': 'songpa',
  'Gangdong-gu': 'gangdong',
};
const fc = JSON.parse(readFileSync('public/data/seoul-districts.geojson', 'utf8'));
for (const f of fc.features) {
  const eng = f.properties.code;
  const mapped = ENG_TO_CODE[eng];
  if (!mapped) throw new Error('unmapped: ' + eng);
  f.properties.code = mapped;
}
writeFileSync('public/data/seoul-districts.geojson', JSON.stringify(fc));
console.log('normalized', fc.features.length, 'features');
"
```

Verify:
```bash
ls -la public/data/seoul-districts.geojson  # < 100KB
```

If file > 100KB, re-run mapshaper with stronger simplification (e.g. `5%` instead of `8%`).

If `name_eng` field is absent in the source, fall back to looking at the actual properties first:
```bash
# discovery (run if normalize fails with 'unmapped: undefined')
node --input-type=module -e "
import { readFileSync } from 'node:fs';
const fc = JSON.parse(readFileSync('/tmp/seoul-raw.geojson','utf8'));
console.log(Object.keys(fc.features[0].properties));
console.log(fc.features[0].properties);
"
```

If the property name differs, adjust the mapshaper `-rename-fields` source field accordingly and rerun. The 25 mapping codes don't change.

- [ ] **Step 4: Sanity-check the geojson against manifest**

```bash
node --input-type=module -e "
import { readFileSync } from 'node:fs';
const fc = JSON.parse(readFileSync('public/data/seoul-districts.geojson','utf8'));
const m = JSON.parse(readFileSync('public/data/seoul-manifest.json','utf8'));
const fcCodes = new Set(fc.features.map(f => f.properties.code));
const mCodes = new Set(m.districts.map(d => d.code));
const missingInGeo = [...mCodes].filter(c => !fcCodes.has(c));
const missingInManifest = [...fcCodes].filter(c => !mCodes.has(c));
console.log('manifest districts:', mCodes.size);
console.log('geojson features:', fcCodes.size);
console.log('manifest codes missing in geojson:', missingInGeo);
console.log('geojson codes missing in manifest:', missingInManifest);
if (missingInGeo.length || missingInManifest.length) process.exit(1);
"
```

Expected: 25 / 25, both empty arrays.

- [ ] **Step 5: Commit**

```bash
git add public/data/districts/junggu.json public/data/seoul-manifest.json public/data/seoul-districts.geojson
git rm public/data/junggu.json 2>/dev/null || true
git commit -m "feat(p3.1a): add seoul-manifest + seoul-districts geojson, move junggu.json to districts/"
```

---

## Task 6: page.tsx — manifest+geojson+district 부트 시퀀스

**Files:**
- Modify: `src/app/page.tsx`

이 task는 P3.1a에서 가장 위험. 한 번에 끝내려 하지 말고 작은 step으로 쪼갠다. 기존 시각/UX는 100% 유지가 목표.

- [ ] **Step 1: Replace bin-loading state and effect**

`src/app/page.tsx` 73-74행:

```tsx
const searchParams = useSearchParams();
const [bins, setBins] = useState<TrashBin[]>([]);
```

→ 다음으로 교체:

```tsx
const searchParams = useSearchParams();
const [districtsCache, setDistrictsCache] = useState<Map<DistrictCode, TrashBin[]>>(
  () => new Map(),
);
const [activeDistricts, setActiveDistricts] = useState<Set<DistrictCode>>(
  () => new Set(),
);
const [manifest, setManifest] = useState<Manifest | null>(null);
const [districtsGeo, setDistrictsGeo] = useState<unknown | null>(null);
```

`bins`는 `useMemo`로 파생:

```tsx
const bins = useMemo<TrashBin[]>(() => {
  const flat: TrashBin[] = [];
  for (const code of activeDistricts) {
    const d = districtsCache.get(code);
    if (d) flat.push(...d);
  }
  return flat;
}, [districtsCache, activeDistricts]);
```

위 `useMemo`는 기존 `visible` 계산 직전(213행 부근, `const visible = useMemo(...)` 위)에 둔다.

- [ ] **Step 2: Update imports**

`src/app/page.tsx` 11행:
```tsx
import { fetchBins, filterByTypes } from '@/lib/data';
```
→ 교체:
```tsx
import { fetchDistrict, filterByTypes } from '@/lib/data';
import { fetchManifest, fetchDistrictsGeoJson, findDistrictMeta } from '@/lib/districts';
import {
  findDistrictForPoint,
  findNearestDistrictCentroid,
} from '@/lib/point-in-district';
```

46행:
```tsx
import type { BinType, TrashBin } from '@/lib/types';
```
→ 교체:
```tsx
import type { BinType, DistrictCode, Manifest, TrashBin } from '@/lib/types';
```

- [ ] **Step 3: Replace the bin-fetch useEffect with manifest+geojson+district sequence**

Locate the existing block (180-192행):
```tsx
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
```

→ 교체:

```tsx
useEffect(() => {
  let active = true;

  (async () => {
    try {
      const [m, geo] = await Promise.all([
        fetchManifest(),
        fetchDistrictsGeoJson(),
      ]);
      if (!active) return;
      setManifest(m);
      setDistrictsGeo(geo);

      // Decide initial district code
      let initialCode: DistrictCode | null = null;

      // Priority 1: URL origin/dest
      const urlState = parseUrlParams(searchParams);
      const urlSeed = urlState.userLocation ?? urlState.destination ?? null;
      if (urlSeed) {
        initialCode = findDistrictForPoint(urlSeed, geo as never);
      }

      // Priority 2: synchronous GPS check via permissions API is not reliable in all browsers,
      // so we just fall back to default if no URL seed. The async GPS watcher in `locate()`
      // will independently update userLocation; if that triggers panning into another district,
      // P3.2 will pick up that signal. For initial paint, default to junggu.
      if (!initialCode) {
        initialCode = findDistrictMeta(m, 'junggu')?.code ?? m.districts[0].code;
      }

      const meta = findDistrictMeta(m, initialCode);
      if (!meta) throw new Error(`Unknown district code: ${initialCode}`);
      if (meta.binCount === 0) {
        // Data not yet imported for this district — show empty UI without throwing.
        setActiveDistricts(new Set([initialCode]));
        return;
      }

      const data = await fetchDistrict(initialCode, m.version);
      if (!active) return;
      setDistrictsCache((prev) => {
        const next = new Map(prev);
        next.set(initialCode!, data);
        return next;
      });
      setActiveDistricts(new Set([initialCode]));
    } catch (e: unknown) {
      if (active) setError(e instanceof Error ? e.message : 'unknown');
    }
  })();

  return () => {
    active = false;
  };
}, [searchParams]);
```

- [ ] **Step 4: Verify the rest of page.tsx still type-checks**

`bins` is now derived via `useMemo` so existing references (e.g. `📍 {visible.length} / 전체 {bins.length}개` at line 560) still work.

Run: `bun run build`
Expected: succeeds. If TypeScript complains about `unknown` for `districtsGeo` when passed into `findDistrictForPoint`, narrow it via `geo as never` (already done at Step 3 — the call site uses the freshly-fetched local `geo`, not the state, to avoid the Promise/state ordering trap).

If a "fetchBins is not defined" error appears anywhere, grep for stragglers:
```bash
grep -rn "fetchBins" src/
```
Expected: zero matches.

- [ ] **Step 5: Run full test suite**

Run: `bun run test`
Expected: all tests pass (16+ in lib/__tests__, plus existing favorites/savings = 105 + new ~16 = ~121).

- [ ] **Step 6: Manual local dev check**

```bash
bun run dev
```
Open http://localhost:3000 (or 3001). Verify:
- 마커 59개 렌더 (filter "전체" 활성)
- 필터 칩 토글 동작
- 좌표 클릭 → 출발/목적지 지정 동작
- 🎯 GPS 동작 (권한 허용 시 panTo)
- 검색 동작
- 즐겨찾기 ☆ 동작

기능 회귀 없으면 다음.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(p3.1a): wire manifest + geojson + initial district fetch into page boot"
```

---

## Task 7: 함정 메모 + tasks.md + CHANGELOG

**Files:**
- Modify: `docs/tasks.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Move P3.1 to Done in docs/tasks.md**

`docs/tasks.md`의 "🌏 Open — Phase 3" 섹션에서:
```md
- [ ] **P3.1** 데이터 분할 전략 결정 — 후보:
  - (a) 자치구별 정적 JSON, 뷰포트 bbox로 lazy-load
  - (b) Next API Route + 단일 JSON in-memory
  - (c) Postgres + PostGIS, `ST_Within(viewport)` 쿼리
```

→ Phase 2 Done의 끝에 추가 (혹은 Phase 3 Done 신규 섹션 만들기):
```md
### Phase 3 — 25개 구 확장
- [x] **P3.1** 데이터 분할 전략 결정 — 자치구 단위 정적 JSON + GeoJSON 폴리곤 클라이언트 판정. spec: `docs/superpowers/specs/2026-05-05-p3-1-data-partitioning-design.md`
- [x] **P3.1a** Foundation — manifest/geojson/district 3축 정적 자원 + `point-in-district`/`districts`/`fetchDistrict` 모듈 + page boot 시퀀스. 25구 데이터는 P3.2.
```

원래 P3.1·P3.2·P3.3 줄에서 P3.1 줄을 제거, P3.2·P3.3은 그대로.

- [ ] **Step 2: Add 함정 메모 entries**

`docs/tasks.md`의 "⚠️ 함정 메모" 섹션 끝에 추가:

```md
- **GeoJSON 좌표 순서는 `[lng, lat]`** (ISO 표준). Leaflet/우리 코드는 `{lat, lng}` 일관. point-in-polygon 헬퍼 안에서만 한 번 갈아끼고 외부 API는 절대 swap 금지. 한 번 헷갈리면 전 구가 '서울 밖' 판정으로 침묵 실패.
- **자치구 영문 슬러그는 manifest가 SoT**: 행정안전부 표준 영문 표기는 일관 안 됨 (`Jung-gu` vs `Junggu` vs `Jung Gu`). `public/data/seoul-manifest.json`이 단일 진실. `*-gu` 접미사 없음, 모두 lowercase. 한 번 정해진 이상 URL/파일명에 영구 박혀 변경 불가.
- **manifest는 짧게, 나머지는 영구 캐시**: Vercel CDN `Cache-Control` 운영 — `seoul-manifest.json`만 `max-age=300` (데이터 갱신 진입점), `seoul-districts.geojson`/`districts/*.json`은 `s-maxage=31536000` 영구 + manifest의 `version` query bust로 cascade.
```

- [ ] **Step 3: Update CHANGELOG**

`CHANGELOG.md`의 `[Unreleased]` 섹션에 추가 (Infrastructure 또는 Changed 카테고리):

```md
### Infrastructure
- P3.1a 데이터 분할 foundation — `seoul-manifest.json`/`seoul-districts.geojson`/`districts/<code>.json` 3축 정적 자원 + 클라이언트 point-in-polygon 자치구 판정. 25구 데이터 적재(P3.2)와 markercluster(P3.1b)·인접 prefetch(P3.1c)는 후속.
```

- [ ] **Step 4: Update Phase line in tasks.md "현재 상태"**

`docs/tasks.md` 6-7행 부근의 "현재 상태" Phase 라인:
```md
- **Phase**: 2 전체 완료 ... Phase 3 진입 시점 (데이터 분할 전략 결정 P3.1).
```
→
```md
- **Phase**: 3 진입. P3.1a Foundation 완료 (manifest/geojson/district 3축 자원, point-in-district 판정, page boot 갱신). 다음 P3.2 (25구 데이터 transform), P3.1b (markercluster), P3.1c (인접 prefetch).
```

날짜 라인 `(2026-05-05)`은 그대로.

- [ ] **Step 5: Commit**

```bash
git add docs/tasks.md CHANGELOG.md
git commit -m "docs(p3.1a): tasks/CHANGELOG/함정 메모 갱신"
```

---

## Task 8: 빌드 + 푸시 + preview 검증

**Files:** none

- [ ] **Step 1: Final build + test**

```bash
bun run build
bun run test
```
Expected: 둘 다 성공.

- [ ] **Step 2: Push branch**

```bash
git push -u origin feat/p3.1a-data-partition-foundation
```

Vercel preview 빌드 시작 (16~22초).

- [ ] **Step 3: Preview 검증 (HTTPS 필수)**

Branch alias: `https://junggu-trash-map-git-feat-p31a-data-partition-foundation-jetsongdev.vercel.app`

iPad/iPhone Safari에서 열어 다음 검증:
- [ ] 첫 진입 → 마커 59개 표시 (junggu)
- [ ] DevTools Network: `seoul-manifest.json` (200, ~2KB), `seoul-districts.geojson` (200, ~50KB), `districts/junggu.json?v=2026-04-14` (200, ~30KB) — 3개 이상 GET
- [ ] 새로고침 → 위 3개 모두 disk cache hit (200 with "(disk cache)" 또는 304)
- [ ] GPS 허용 → 위치 점, 가까운 통 강조
- [ ] 검색 → 검색 결과 panTo
- [ ] 출발/목적지 탭 → detour 알고리즘 동작
- [ ] 즐겨찾기 ☆/★ 동작
- [ ] URL 공유 (`?origin=...&dest=...`)로 진입 → 좌표가 junggu 안이면 마커 표시, 밖이면 토스트 (P3.1a에선 그래도 junggu fetch — fallback to nearest centroid)

- [ ] **Step 4: Snapshot 캡처 (시각 회귀 보호)**

P3.1a는 시각 변경 없음이지만 인프라 마일스톤이라 snapshot 1장 남기기:

```bash
# 글로벌 snapshot 스킬 호출 — Skill tool로 invoke
# 인덱스에는 "P3.1a foundation — visual identical to X.1, infra-only milestone" 한 줄
```

(snapshot 스킬은 자동으로 dev/preview 띄워 모바일 캡처 후 `docs/snapshots/NN-p3-1a-foundation/` 추가.)

- [ ] **Step 5: SHA 정합 + push**

snapshot의 `git_sha`는 capture 시점 parent HEAD. commit 직후 새 SHA로 갱신:

```bash
SHA=$(git rev-parse HEAD)
# snapshot meta 파일에서 git_sha 항목 SHA로 업데이트
# (snapshot 스킬이 자동으로 처리하지 않으면 수동 sed)
git add docs/snapshots/
git commit -m "docs: snapshot P3.1a SHA 정합"
git push
```

- [ ] **Step 6: Lighthouse CI 확인**

PR을 main 대상으로 만들면 Lighthouse CI 게이트 자동 트리거.

```bash
gh pr create --base main --head feat/p3.1a-data-partition-foundation \
  --title "P3.1a: 데이터 분할 foundation (manifest + geojson + per-district JSON)" \
  --body "$(cat <<'BODY'
## Summary
- `public/data/`를 manifest/geojson/districts 3축으로 재배치 (junggu만 데이터 보유, 나머지 24구는 placeholder)
- `point-in-district` ray-casting + `findNearestDistrictCentroid` 폴백
- `fetchBins` → `fetchDistrict(code, version)` + 모듈 캐시
- page.tsx 부트: manifest+geojson 병렬 fetch → 자치구 코드 결정 → district JSON fetch
- spec: `docs/superpowers/specs/2026-05-05-p3-1-data-partitioning-design.md`
- 후속: P3.2 (25구 데이터 transform), P3.1b (markercluster), P3.1c (인접 prefetch)

## Test plan
- [ ] preview에서 첫 진입 → 마커 59개
- [ ] DevTools Network: manifest/geojson/district 3개 200, 새로고침 시 disk cache
- [ ] GPS·검색·detour·즐겨찾기 회귀 없음
- [ ] Lighthouse perf ≥0.70 유지

🤖 Generated with [Claude Code](https://claude.com/claude-code)
BODY
)"
```

`trash-lighthouse-pr-watch` 스킬을 부르거나, `gh pr checks` 폴링으로 결과 확인. perf < 0.70이면 중단하고 원인 조사 (geojson 사이즈 / 파싱 비용 / fetch waterfall).

---

## Done definition checklist (P3.1a)

- [ ] `bun run build` 통과
- [ ] `bun run test` 통과 (신규 16개 + 기존 105개 = 121개 이상)
- [ ] preview URL에서 마커 59개 + 모든 P2 기능 회귀 0
- [ ] 새로고침 시 manifest/geojson/district 모두 disk cache
- [ ] Lighthouse perf ≥0.70 유지
- [ ] `docs/tasks.md` P3.1·P3.1a Done + 함정 3건 추가
- [ ] `CHANGELOG.md` `[Unreleased]` 한 줄
- [ ] snapshot `docs/snapshots/NN-p3-1a-foundation/` 추가
- [ ] PR 머지 + main 자동 production 배포 확인

---

## Self-review notes

- 스펙 §4.5 "부트 시퀀스" 4개 분기 중 GPS/URL/기본 3개를 Task 6에서 처리. GPS 분기는 기존 `locate()` 핸들러가 비동기적으로 userLocation을 갱신 → P3.2의 panning 트리거가 자치구 add. P3.1a는 첫 페인트만 책임 (의도적).
- 스펙 §4.7 캐시 전략의 `Cache-Control` 헤더는 정적 자산이므로 Next.js 16/Vercel 기본 정책으로 처리됨. 명시적 `next.config.ts` 헤더 작성은 P3.1a에 포함하지 않음 (필요 시 별도 task — 측정 결과 dirty cache 보이면 추가).
- 스펙 §6 인접 prefetch는 본 plan에 포함 안 함 (P3.1c 별도 plan).
- Task 5 Step 3의 mapshaper 단순화 비율(`8%`)은 첫 시도값. 결과 파일 크기 보고 조정. 너무 작으면 경계 부정확, 너무 크면 LH bytes 점수 영향.
- 본 plan은 P3.1a에 한정. P3.1b/P3.1c plan은 P3.1a 머지 후 각자의 worktree에서 별도 writing-plans 호출로 작성.
