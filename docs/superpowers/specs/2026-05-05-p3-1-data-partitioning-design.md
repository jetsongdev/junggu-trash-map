# P3.1 데이터 분할 전략 — Design

- **Status**: Approved (2026-05-05)
- **Phase**: 3 진입 직전 / 25개 구 확장 사전 작업
- **Tracker**: `docs/tasks.md` Open — Phase 3
- **Karpathy 가이드라인 적용**: surgical changes, simplicity first, 검증 가능한 성공 기준

---

## 1. Context

현재 데이터는 `public/data/junggu.json` (30KB, 59 그룹) 단일 파일. Phase 3에서 서울 25개 구로 확장하면 이 모델이 깨진다 (총 ~1,500 마커, ~750KB raw / ~250KB gzip 추정). 동시에 Phase 4에서 사용자 제보·사진을 받을 가능성도 있어 read-only 정적 데이터와 read-write 사용자 데이터의 채널 분리가 필요.

본 결정은 **공공 휴지통 데이터의 분할/로딩 전략**만 다룬다. 사용자 제보·사진은 Phase 4에서 사이드카로 별도 채널 (Vercel KV / Supabase 등) — 본 문서 범위 밖.

## 2. 결정 요약

`docs/tasks.md`의 후보 (a/b/c) 중 **(a) 자치구별 정적 JSON, lazy-load** 채택. 단 lazy-load 트리거는 "뷰포트 bbox"가 아니라 **자치구 단위**.

| 결정 | 선택 | 이유 |
|------|------|------|
| 시간 지평 | Phase 4 분리 (하이브리드) | 사용자 제보는 워크로드가 다름 (write·moderation), 같은 스토어에 묶을 이점 적음 |
| 로딩 단위 | 자치구 단위 lazy | 데이터의 자연 단위 = 행정구역, 사용자 시선 단위와 일치, CDN 캐시 키 직관 |
| 좌표 → 구 판정 | GeoJSON 폴리곤 사전 번들 + 클라이언트 point-in-polygon | PWA·오프라인 친화, Nominatim rate limit 회피, GPS tick마다 외부 API 안 두드림 |
| Storage | 정적 JSON (Vercel CDN) | 1MB 임계 미만, read-only, 갱신 빈도 ~연 1회. Postgres/PostGIS는 명백한 over-engineering |

## 3. 작업 분할 (3-PR · 3-worktree)

사용자 지시: 독립 작업 + 독립 워크트리. Karpathy 원칙 (surgical changes)에 부합.

```
P3.1a (foundation)  ─┬→ P3.1b (markercluster)
                     │
                     └→ P3.1c (adjacent prefetch)
```

P3.1a가 b, c의 prereq. b와 c는 a 머지 후 병렬 가능.

### 3.1 Worktree 매핑

```bash
# foundation
git worktree add ../junggu-trash-map.p31a feat/p3.1a-data-partition-foundation main
# markercluster
git worktree add ../junggu-trash-map.p31b feat/p3.1b-markercluster main
# adjacent prefetch
git worktree add ../junggu-trash-map.p31c feat/p3.1c-adjacent-prefetch main
```

`superpowers:using-git-worktrees` 스킬을 따라 각 작업에 워크트리 1개. b, c는 a 머지된 main에서 분기.

### 3.2 Karpathy push-back: 머지 순서 권고

P3.1b (cluster), P3.1c (prefetch)는 **데이터가 1개 구일 때 관측 가능한 효과가 거의 없다**.

- cluster: 마커 59개에선 cluster가 거의 안 잡힘. 줌 아웃 ≤12 정도에서만 묶임.
- prefetch: 활성 자치구가 1개뿐이면 인접 구 fetch 대상이 없음.

따라서 **권고 머지 순서**: `P3.1a → P3.2 (25구 데이터 transform 일괄) → P3.1b · P3.1c (병렬)`. P3.1a 직후 b, c를 바로 머지해도 회귀는 없지만 사용자 가치 0. 코드는 워크트리에 미리 만들어두고 P3.2 머지 후 merge order 조정 가능.

이는 권고이며 강제가 아니다. 사용자가 "그냥 다 미리 머지"를 선택해도 회귀 없음.

---

## 4. P3.1a — Foundation

### 4.1 범위

> "현재 1개 구로도 동작하는 새 분할 아키텍처" 까지만. 25구 데이터 transform은 P3.2.

### 4.2 신규 정적 자원 (`public/data/`)

```
public/data/
├── seoul-districts.geojson       # 25구 경계 (Mapshaper 단순화, ~50KB)
├── seoul-manifest.json           # 자치구 메타 인덱스 (~2KB)
└── districts/
    └── junggu.json               # 기존 ../junggu.json을 이동
```

`seoul-manifest.json`:
```json
{
  "version": "2026-04-14",
  "districts": [
    {
      "code": "junggu",
      "name": "중구",
      "binCount": 59,
      "bbox": [126.965, 37.546, 127.020, 37.575],
      "centroid": [126.998, 37.563],
      "adjacent": ["jongno", "yongsan", "seongdong", "seodaemun", "mapo"]
    }
  ]
}
```

P3.1a 시점엔 `districts` 배열에 중구 1개만. 나머지 24개는 `binCount: 0` 자리 표시자 (P3.2에서 채움).

### 4.3 신규 코드 (`src/lib/`)

```
src/lib/
├── districts.ts            # manifest 로더, district code 상수, version-bust URL
├── point-in-district.ts    # 좌표 → district code, ray-casting (Turf 의존성 없음)
└── data.ts                 # fetchBins → fetchDistrict(code) + module-level Map 캐시
```

- `point-in-district.ts`: GeoJSON `[lng,lat]` 순서를 함수 내부에서만 처리, 외부 API는 `{lat,lng}` 통일.
- `data.ts` 캐시: in-memory `Map<DistrictCode, TrashBin[]>`. HTTP 캐시는 Vercel CDN에 위임 (`cache: 'force-cache'` 유지).

### 4.4 변경 코드

- `src/app/page.tsx`: state 모양 `TrashBin[]` → `Map<DistrictCode, TrashBin[]>` + `activeDistricts: Set<DistrictCode>`. 필터/검색/route 알고리즘 입력은 활성 구 flat 배열.
- `scripts/transform.ts`: 입력 CSV가 다중 자치구를 포함하면 자동 분할 출력. 단일 자치구 인자 호환 유지.

### 4.5 부트 시퀀스

```
1. 첫 페인트: 빈 지도 + 서울 bbox fitBounds
2. manifest.json + districts.geojson 병렬 fetch
3. 위치 결정:
   ├─ GPS 허용 → point-in-district → 해당 구 fetch
   ├─ GPS 거부 → 기본 구 (junggu) fetch
   └─ URL 쿼리 origin/dest → 해당 좌표의 구 fetch
4. panTo + zoom 14
```

### 4.6 활성 자치구 set 트리거

| 트리거 | 동작 |
|--------|------|
| 사용자 panning → 다른 폴리곤 진입 | 그 구 fetch + activeDistricts에 add |
| Nominatim 검색 결과 panTo | 도착 좌표의 구 fetch |
| 출발/목적지 set (P2.7) | 좌표의 구 fetch (다른 구면 둘 다) |

제거 트리거는 없음. 한 세션 동안 누적, 상한 25개 / ~750KB.

### 4.7 캐시 전략

| 자원 | Cache-Control |
|------|---------------|
| `manifest.json` | `public, max-age=300, s-maxage=300` (짧게 — 갱신 즉시 반영) |
| `seoul-districts.geojson` | `public, max-age=86400, s-maxage=31536000` |
| `districts/*.json` | `public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800` |

데이터 갱신은 transform 재실행 + manifest `version` 한 줄 bump → district fetch URL에 `?v=2026-04-14` query 부착해 cache bust.

### 4.8 에러 / 폴백

- manifest 404: 빈 지도 + 토스트 + `captureLoadBinsError` + 재시도 (P1.4 패턴 재사용)
- district 404 또는 binCount=0: 토스트 1회 ("이 구는 데이터 미수급"), UI는 정상 작동
- point-in-district miss (서울 밖): 가장 가까운 centroid로 폴백
- GPS 거부: 기존 P2.1 폴백 (🎯 출발 탭) 유지

### 4.9 URL 공유 (P2.5) 호환

기존 origin/dest 좌표 쿼리만 사용 → 자치구는 좌표에서 즉시 판정 가능 → URL 스키마 변경 0.

### 4.10 P3.1a 성공 기준 (verifiable)

1. `bun run build` 통과
2. `bun run test` 통과 — 신규 순수 함수 테스트 추가:
   - `point-in-district.ts`: 25구 centroid → 자기 구 판정 / 한강 한가운데 fallback / 서울 밖 좌표 (~10 case)
   - `districts.ts`: manifest 파싱 / version-bust URL / 인접 구 lookup (~5 case)
   - `data.ts`: 같은 코드 두 번 호출 시 fetch 1회 / 404 graceful (~5 case)
3. preview URL: 첫 진입 시 중구 자동 감지 → 마커 59개. 새로고침 후 disk cache 히트 (네트워크 0회 또는 304만).
4. Lighthouse perf ≥0.70 유지 (현 baseline 0.75).
5. `CHANGELOG.md` `[Unreleased]` + snapshot 갱신.
6. 함정 메모 항목 추가 (좌표 순서·자치구 코드 슬러그·manifest 캐시 짧게).

---

## 5. P3.1b — markercluster

### 5.1 범위

`leaflet.markercluster` 도입. 활성 자치구 flat 배열을 cluster group에 그대로 붙임.

### 5.2 동작

- 줌 ≥15: 개별 마커. 기존 Top-3 dimming(P2.10)·헤드업 회전(P2.13b)·즐겨찾기 색 모두 유지.
- 줌 <15: cluster. 카운트만 표시.
- divIcon 캐시 (현 패턴) 와 cluster의 `iconCreateFunction` 충돌 없음 — cluster는 자체 아이콘 사용.

### 5.3 P3.1b 성공 기준

1. `bun run build` 통과
2. preview URL에서 다음을 시각 검증 + snapshot:
   - 줌 13 (서울 시 단위): cluster ≥3개로 묶임
   - 줌 16 (동 단위): 모든 마커 개별 표시
3. 기존 P2.10 (Top-3) / P2.13b (헤드업) / P2.14 (즐겨찾기) 시각 회귀 없음
4. Lighthouse perf ≥0.70 유지 (cluster 추가 후 측정값 기록 — markercluster 라이브러리 ~30KB)
5. 함정 메모: cluster ↔ Top-3 dimming의 줌 임계 일치 (둘 다 줌 ≥15에서 활성)

### 5.4 의존성 추가

```
+ leaflet.markercluster
+ @types/leaflet.markercluster
```

번들 영향: ~30KB raw, gzip 후 ~10KB. unused-javascript Lighthouse audit 통과 확인.

---

## 6. P3.1c — Adjacent district prefetch

### 6.1 범위

활성 자치구 set이 변할 때, manifest의 `adjacent` 배열에 있는 구를 백그라운드 prefetch. P2.7 detour 알고리즘이 구 경계 근처에서 정확도 잃지 않게.

### 6.2 동작

```ts
// 의사코드
function onActiveDistrictChange(code: DistrictCode) {
  const adjacent = manifest.districts.find(d => d.code === code)?.adjacent ?? [];
  for (const adj of adjacent) {
    if (cache.has(adj)) continue;
    requestIdleCallback(() => fetchDistrict(adj), { timeout: 2000 });
  }
}
```

- `requestIdleCallback` 미지원 브라우저(iOS Safari)는 `setTimeout(_, 0)` 폴백.
- prefetch 실패는 silent (다음에 사용자가 그 구로 이동하면 정식 fetch가 다시 시도).
- prefetched district는 즉시 activeDistricts에 추가하지 않음 — 마커는 안 보임. 캐시만 채움.

### 6.3 P3.1c 성공 기준

1. `bun run build` 통과
2. `bun run test`: prefetch 단위 테스트 (cache hit 시 fetch 0회, 인접 구 lookup 정확) ~3 case
3. preview URL DevTools Network 검증:
   - 중구 진입 → idle 후 종로/용산/성동/서대문/마포 5개 GET (200 OK)
   - 종로 panning 진입 → 캐시 히트 0 네트워크
4. Lighthouse 회귀 없음. 주의: idle prefetch가 LH 측정 window(~5s) 안에 발사되면 total bytes 점수에 영향 가능 → measure 후 perf 점수 비교, 0.70 미만이면 prefetch 우선순위 1개로 throttle

### 6.4 Out of scope

- prefetch를 끄는 사용자 setting (data-saver). 필요해지면 별도 task.
- prefetch 우선순위 (가까운 구 먼저). 5개 동시 fetch가 부담이라는 증거 나오면 추가.

---

## 7. 함정 (예상)

`docs/tasks.md` 함정 메모에 P3.1a 머지 시점에 동시 추가:

- **GeoJSON 좌표 순서는 `[lng, lat]`** (ISO 표준). Leaflet은 `[lat, lng]`. point-in-polygon 헬퍼 안에서만 갈아끼고 외부 API는 `{lat, lng}` 통일. 한 번 헷갈리면 전 구가 '서울 밖' 판정.
- **자치구 영문 슬러그 통일 규칙**: 행정안전부 표준은 숫자 시군구코드만 정의, 영문은 미정. manifest에서 직접 정의 (`junggu`, `gangnam`, `seocho`...). URL/파일명에 영구 박힘 — 한 번 정하면 변경 불가. `*-gu` 접미사 없이 통일.
- **Vercel CDN cache는 manifest만 짧게**: manifest는 데이터 갱신 진입점이므로 `max-age=300`. 나머지 자원(geojson/district JSON)은 `s-maxage=31536000` 영구. manifest version만 한 줄 bump하면 자동 cascade.

## 8. Phase 4 hook (지금은 만들지 않음)

`TrashBin.source: 'standard' | 'report'` 필드는 **추가하지 않는다**. P4 진입 시점에 마이그레이션. 지금 추가하면 모든 transform 출력에 무의미한 `"source": "standard"` 가 붙고, 그게 진짜 필요해질 때 fields 가 안 맞아 또 갈아엎게 된다 (YAGNI).

## 9. Open questions / risks

- **GeoJSON 정밀도 vs 파일 크기 trade-off**: Mapshaper로 단순화 정도 결정 (5%? 10%?). 50KB 안에 들면 OK. 너무 단순화하면 경계 5m 오차로 인접 구로 오판정. 손으로 단순화 진행하며 visual diff.
- **점유 구가 인천이라면?** (예: 구글 지도 검색이 인천으로 panTo) 폴리곤 폴백 = 가장 가까운 centroid (서울 25구 중). UX는 "서울 밖 좌표입니다" 토스트 + 가장 가까운 구로 강제 진입. P3.3 진입 가이드에서 정식 처리.

## 10. Implementation plan

본 spec 승인 후 `superpowers:writing-plans` 스킬로 P3.1a, P3.1b, P3.1c 각각의 단계별 구현 계획 (test-first, file-by-file) 작성. 워크트리는 a 먼저 생성, a 머지 후 b·c.
