# P3.5 + P2.26 — 자치구 전환 시 routing reset & GPS-anchor zoom

**Date**: 2026-05-10
**Branch**: `feat/p3.5-p2.26-bundle` (예정)
**Tasks 항목**: P3.5 자치구 전환 시 경로 상태 초기화 / P2.26 확대·축소 시 사용자 위치 기준

## 목표

두 개의 Map UX 미세 조정을 한 PR로 묶음. 둘 다 routing state(userLocation/destination)를 다루고 page.tsx의 같은 영역을 건드리므로 한 라운드로 처리해 머지 충돌과 reviewer load를 줄인다.

- **P3.5**: 사용자가 다른 자치구로 의도적으로 이동(검색 / selector tap)하면 stale한 출발·목적지 상태를 자동 초기화한다. 손 드래그(panning)로 살짝 둘러보는 경우는 유지한다.
- **P2.26**: `=`/`-` 키보드 / 좌하단 ➕/➖ 버튼으로 줌 인·아웃할 때, 출발지/목적지가 있으면 viewport center가 아닌 routing anchor(전체 경로 중심 또는 출발지)를 기준으로 줌한다.

## 비목표 (YAGNI)

- 휠/핀치 줌 anchor 변경 — Leaflet 기본(cursor/finger position) 유지. OS-level 인터랙션 기대값을 깨지 않는다.
- snap-back(panning 후 자동 GPS 점으로 복귀) — 작업 영역 강제 이동은 disruptive.
- 자동 reset 안내를 dismissable으로 만들기 — 1회 toast(3s, info)로 충분.
- 셀렉터 grid에 "reset 없이 이동" 옵션 — 명시적 자치구 전환은 항상 reset이 자연스러움.

## 동작 사양

### P3.5 — Reset 트리거

| 트리거 | district 변경 | reset? |
|--------|--------------|--------|
| 손 드래그 (`MapMoveHandler.moveend`) | yes | **no** (그냥 둘러봄) |
| 손 드래그 | no | no |
| Selector tap (populated/empty) | yes | **yes** |
| Selector tap | no | no (어차피 같은 구) |
| 검색 결과 클릭 (`handleSearchSelect`) | yes | **yes** (그 후 새 origin/dest set) |
| 검색 결과 클릭 | no | no |
| LocateButton(GPS auto-locate) | maybe yes | no (방금 잡은 GPS가 다른 구일 수 있어도 wipe하면 안 됨) |
| URL share 첫 로드 | yes (initial) | no (URL에 origin/dest가 있으면 유지) |

핵심: **reset은 "트리거 측"에서 명시 호출.** `handleCenterChange`(panning이 발사하는 path)는 district 추적/fetch만 담당. 따라서 dragstart 플래그 같은 detection 트릭이 불필요해진다.

Reset 실행 내용:
- `setUserLocation(null)` + `stopWatch()` (GPS watch 끄기)
- `setDestination(null)`
- `setTapTarget(null)` (origin/destination 탭 모드 해제)
- info toast 1회: `"{새 자치구명}로 이동 — 출발/목적지 초기화됨"` (3s)

### P2.26 — Zoom anchor 우선순위

Anchor 결정 함수 `getZoomAnchor(origin, dest) → LatLng | null`:

| 상태 | anchor |
|------|--------|
| origin && dest | midpoint = `((o.lat+d.lat)/2, (o.lng+d.lng)/2)` |
| origin only | origin |
| dest only | `null` (무시 — 출발지 없이 도착지만으로는 anchor 활성화 안 함) |
| neither | `null` (기본 viewport center 동작) |

**디자인 의도**: anchor는 사용자가 "지금 내 시작점/경로 중심으로 줌하고 싶다"는 명시적 의사가 있을 때만 작동. 도착지만 찍어둔 상태는 "어디 갈지 정하는 중"이라 viewport 자유 조작이 자연스러움.

적용 트리거:
- 키보드 `=`/`-` (`zoomMap` 콜백)
- 좌하단 ➕/➖ 버튼 (이미 `zoomMap` 호출 — 한 군데만 고치면 둘 다 적용)

**적용 안 함**: 휠/핀치, 더블클릭 줌, programmatic `flyToBounds`/`setView` 등 — Leaflet 기본 유지.

구현: `map.setZoomAround([anchor.lat, anchor.lng], newZoom, opts)`. anchor null이면 기존 `map.zoomIn/Out(1, opts)` fallback.

## 구현 계획

### 새 모듈

`src/lib/zoom-anchor.ts` — 순수 함수, 단위 테스트 가능.

```ts
import type { LatLng } from './geo';

export function getZoomAnchor(
  origin: LatLng | null,
  dest: LatLng | null,
): LatLng | null {
  if (origin && dest) return { lat: (origin.lat + dest.lat) / 2, lng: (origin.lng + dest.lng) / 2 };
  if (origin) return origin;
  return null; // dest만 있는 경우는 무시 (출발지 없이는 anchor 비활성)
}
```

`src/lib/zoom-anchor.test.ts` — vitest 4 케이스 (둘 다 / origin만 / dest만 / 둘 다 null).

### page.tsx 변경

1. **`userLocationRef`/`destinationRef` 추가** — `zoomMap` useCallback이 `[]` deps로 stable하게 유지되어야 키보드 listener 재바인딩 안 일어나므로 ref 패턴 사용. 기존 `activeDistrictsRef` 등과 동일 패턴.

2. **`zoomMap` 수정** (page.tsx ~185):
```ts
const zoomMap = useCallback((shortcut: MapZoomShortcut) => {
  const map = mapRef.current;
  if (!map) return;
  const options = prefersReducedMotion() ? { animate: false } : undefined;
  const delta = shortcut === 'in' ? 1 : -1;
  const anchor = getZoomAnchor(userLocationRef.current, destinationRef.current);
  if (anchor) {
    map.setZoomAround([anchor.lat, anchor.lng], map.getZoom() + delta, options);
  } else if (shortcut === 'in') {
    map.zoomIn(1, options);
  } else {
    map.zoomOut(1, options);
  }
}, []);
```

3. **`resetRouting` 헬퍼 추가** (page.tsx, district handler들 근처):
```ts
const resetRouting = useCallback((newDistrictName: string | null) => {
  stopWatch();
  setUserLocation(null);
  setDestination(null);
  setTapTarget(null);
  if (newDistrictName) {
    showToast(`${newDistrictName}로 이동 — 출발/목적지 초기화됨`, 3000, 'info');
  }
}, [showToast]);
```

4. **`handleDistrictSelectPopulated`/`handleDistrictSelectEmpty` 수정**:
```ts
const handleDistrictSelectPopulated = (meta: DistrictMeta) => {
  if (meta.code !== viewingDistrict) {
    resetRouting(meta.name);
  }
  // ... 기존 fly 로직
};
// Empty도 동일 패턴
```

5. **`handleSearchSelect` 수정**:
```ts
const handleSearchSelect = (lat, lon, _label, mode) => {
  const target = { lat, lng: lon };
  // 새 위치가 다른 자치구면 reset 먼저 (그 후 새 origin/dest set이 같은 tick에 적용)
  if (manifest && districtsGeo) {
    const newCode = findDistrictForPoint(target, districtsGeo);
    if (newCode && newCode !== viewingDistrict) {
      const meta = findDistrictMeta(manifest, newCode);
      resetRouting(meta?.name ?? null);
    }
  }
  // ... 기존 setUserLocation/setDestination + setMapFocusTarget
};
```

6. **`handleCenterChange` 변경 없음** — district 추적/fetch만 담당.

### Map.tsx 변경 없음
zoom 버튼은 page.tsx에 inline. MapMoveHandler는 그대로.

## 엣지 케이스 검증

- **검색에서 origin set + 다른 자치구**: `resetRouting` → `setUserLocation(null)` queued → `setUserLocation(target)` queued → 최종 target. React batching 정상 작동.
- **검색에서 destination set + 다른 자치구**: `resetRouting`이 origin도 null로 → user의 기존 origin이 사라짐. **의도적** — 다른 구로 점프했으니 새로 시작.
- **URL share 첫 로드**: page.tsx의 boot 시퀀스에서 `setViewingDistrict(initialCode)` 호출. 그러나 reset은 이 useEffect와 무관 (트리거 핸들러에서만 호출). URL로 복원된 origin/dest는 보존.
- **GPS auto-locate가 다른 구 잡음**: LocateButton/cycleLocate는 `setUserLocation`만 호출, district 핸들러 안 호출. 따라서 reset 안 됨. ✅
- **셀렉터 탭 = 같은 자치구**: `meta.code === viewingDistrict` guard로 reset skip.
- **anchor zoom이 max/min 줌에 도달**: Leaflet `setZoomAround`가 자체 clamp. 추가 가드 불필요.
- **anchor 점이 화면 밖**: Leaflet은 그 점 기준으로 viewport를 이동시키며 줌. 사용자 입장에서 "내 위치/경로 중심으로 끌려가며 줌" — 의도적 동작.

## 테스트

### 단위 테스트 (vitest)
- `lib/zoom-anchor.test.ts` (4 케이스: origin+dest / origin만 / dest만(null) / 둘 다 null)

### 수동 검증 체크리스트
- [ ] 키보드 `=` 눌러 줌 in — origin 없으면 viewport center, origin만 있으면 origin 기준, origin+dest면 midpoint 기준, dest만 있으면 viewport center(무시)
- [ ] ➕ 버튼 동일 동작
- [ ] `-` / ➖ 동일 동작
- [ ] 휠 줌은 cursor 기준 유지 (변경 없음)
- [ ] 손 드래그로 다른 구 진입 → 출발/목적지 유지, viewing district만 자동 갱신, fetch 트리거
- [ ] 검색 결과 클릭(다른 구) → "{새 구}로 이동 — 출발/목적지 초기화됨" toast → 새 origin/dest set
- [ ] 검색 결과 클릭(같은 구) → reset 없음
- [ ] 셀렉터 populated 탭(다른 구) → reset toast + flyToBounds
- [ ] 셀렉터 empty 탭(다른 구) → reset toast + 미발행 안내 toast (P2.25 stacking으로 같이 노출)
- [ ] LocateButton 켰을 때 GPS가 다른 구 잡아도 origin/dest 보존
- [ ] URL share 링크로 첫 로드 — URL에 origin/dest 있으면 보존

### Lighthouse
이번 PR은 logic-only(새 컴포넌트/이미지 없음). 임계 회귀 가능성 낮음. 기존 게이트(perf ≥0.62 / a11y ≥0.95) 통과 확인.

### Snapshot
시각 변화 없음(toast는 P2.25 인프라 재사용). snapshot 추가 불필요. 단, "다른 구 진입 + reset toast" 흐름이 새 UX이므로 GIF 1장 정도는 PR에 첨부 검토.

## 위험 / 함정

- **`getZoomAnchor`가 거리 단위 보정 없이 lat/lng 평균** — 위도가 가까운 두 점에서 OK이지만, 위도 차이가 크면 (서울 안에서는 ~0.2°) 직선 midpoint와 great-circle midpoint 차이가 미세하게 발생. 서울 자치구 스케일에선 무시 가능 (≤10m 오차).
- **`setZoomAround`는 Leaflet 1.x API** — `react-leaflet` v5 + Leaflet 1.9 사용 중이므로 호환. typings에 포함 확인 필요.
- **`stopWatch()`가 reset 시 항상 호출** — GPS watch가 안 켜져있어도 no-op 안전. 이미 패턴 검증됨(`clearLocation` 등).
- **Toast가 3초인데 미발행 toast(3초)와 겹침** — P2.25 stacking 큐가 두 토스트 위·아래로 쌓아주므로 OK.
- **검색 결과 클릭 직후 setMapFocusTarget으로 fly → moveend → handleCenterChange가 district fetch 트리거** — 이 fetch 자체는 정상 (panning과 같은 path). reset은 이미 트리거 측에서 한 번 했으니 중복 toast 없음.

## 결정 사항 요약

- ✅ Selector 탭 + 검색 결과는 reset 트리거 / 손 드래그는 유지
- ✅ Empty 자치구 탭도 reset (consistency)
- ✅ Reset toast 1회 노출 (3s, info)
- ✅ Zoom anchor: origin+dest midpoint > origin > viewport center (dest만 있는 경우는 무시)
- ✅ 키보드 + 좌하단 버튼만 anchor 적용 / 휠·핀치는 Leaflet 기본
- ✅ 새 컴포넌트 없음 — 기존 lucide Plus/Minus 버튼의 onClick(`zoomMap`) 한 군데만 변경
- ✅ snap-back 안 함 (panning 후 GPS로 자동 복귀 안 함)

## 변경 파일

- 새 파일: `src/lib/zoom-anchor.ts`, `src/lib/zoom-anchor.test.ts`
- 수정: `src/app/page.tsx` (zoomMap, resetRouting 헬퍼 추가, 3개 핸들러에 reset 호출 추가, ref 2개 추가)
- 미변경: `src/components/Map.tsx` (MapMoveHandler 등 기존 유지)

## 후속

- P3.5 머지 후 사용자 피드백에 따라 "panning으로 다른 구 진입 시 toast 안내(reset 없이)" 추가 검토 가능
- P2.26 머지 후 anchor가 화면 밖일 때 UX 점검 (anchor 위치까지 화면이 끌려가며 줌 — 의도대로지만 first-time 사용자 confusing 가능)
