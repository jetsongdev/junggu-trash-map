# React `setState(value)` vs `setState(prev => …)` — 동시 비동기 setState 사이의 race

**일자**: 2026-05-05
**프로젝트**: junggu-trash-map
**관련 작업**: P3.2 6/7 표시 버그 (`daabc8b`)

## 문제

P3.2 데이터 합류 후 UI에 `자치구 로드 (6/7)` 표시 + 통계 바 `📍 775 / 전체 802개`. 그런데 자치구별 status 리스트는 7개 모두 ✓. "다 들어왔는데 1개 빠진 것처럼 보이는" 모순.

```
✓ 마포구 198    ← 모두 ✓
✓ 구로구 188
✓ 노원구 128
✓ 성북구 119
✓ 서초구 83
✓ 중구 59
✓ 중랑구 27

자치구 로드 (6/7)   ← 헤더는 6/7
📍 775 / 전체 802개  ← 27 (중랑구) 분량 빠짐
```

## 진단

두 React state가 동일 도메인을 추적:

- `districtsCache: Map<DistrictCode, TrashBin[]>` — 어떤 자치구의 데이터가 메모리에 있나
- `activeDistricts: Set<DistrictCode>` — 어떤 자치구가 지도에 표시되는가

두 state는 **함께 갱신**되어야 함. 그런데 boot path와 prefetch path가 비대칭:

```ts
// boot path
setDistrictsCache((prev) => new Map(prev).set(initialCode, data));   // ← functional updater
setActiveDistricts(new Set([initialCode]));                          // ← 직접 값 (REPLACES!)

// prefetch path
setDistrictsCache((prev) => new Map(prev).set(d.code, data));        // ← functional updater
setActiveDistricts((prev) => new Set([...prev, d.code]));            // ← functional updater
```

`requestIdleCallback`로 prefetch가 boot 완료와 거의 동시에 fire되면 React batch에서 setState들이 섞임:

```
대기열:
  1. prefetch_mapo:      setActiveDistricts(prev => Set([...prev, 'mapo']))
  2. prefetch_guro:      setActiveDistricts(prev => Set([...prev, 'guro']))
  3. prefetch_nowon:     setActiveDistricts(prev => Set([...prev, 'nowon']))
  4. prefetch_seongbuk:  setActiveDistricts(prev => Set([...prev, 'seongbuk']))
  5. prefetch_seocho:    setActiveDistricts(prev => Set([...prev, 'seocho']))
  6. prefetch_jungnang:  setActiveDistricts(prev => Set([...prev, 'jungnang']))
  7. boot_junggu:        setActiveDistricts(new Set(['junggu']))      ← REPLACES, 5개 prefetch가 배치 후 묻혀버림 — 또는 누가 먼저 평가되느냐에 따라 다른 자치구 1개가 빠짐
```

`districtsCache`는 functional updater라 모든 add가 누적되어 7개 정상. `activeDistricts`만 race 노출. 결과: cache 7 ≠ active 6, 사용자 UI에 `6/7` + ✓ 7개 모순.

`Map`/`Set` 같은 reference value를 **직접 값**으로 setState하면 React batch는 그 값으로 단순 덮어씀 (다른 functional update의 결과를 무시). functional updater는 서로의 결과를 chain으로 받아 누적.

## 해결

boot의 두 path 모두 functional updater로 통일:

```ts
// before
setActiveDistricts(new Set([initialCode]));

// after
setActiveDistricts((prev) => new Set([...prev, initialCode!]));
```

수정 후 prefetch와 동일 패턴 → 모든 add가 누적, 6/7 race 사라짐.

## 교훈

- **둘 이상의 비동기 path가 같은 collection state를 갱신할 가능성이 있으면 무조건 functional updater**. `setX(newValue)`는 전체 덮어쓰기, `setX(prev => …)`는 누적.
- **State pair가 동시에 갱신되어야 한다면 한 쪽만 functional updater인 비대칭은 폭탄**. 한 쌍을 묶을 땐 패턴을 통일해야 race-free.
- requestIdleCallback / Promise.all / event-driven 등 **동시성을 만드는 모든 API**가 이 race의 원인이 될 수 있음. 비동기 동시성 도입 시 모든 setState를 functional updater로 점검.
- 디버깅 trick: "두 state가 항상 함께 갱신되어야 하는데 한 쪽만 빠져있다"는 미스매치를 보면 **첫 번째 의심은 setState updater 비대칭**.

## 김동현 원펀치

**collection state는 항상 functional updater**. 비동기 path 두 개 이상이 같은 set/map을 건드리면 직접값 setState는 race로 일부를 묻어버린다. 한 쌍의 state를 동시 갱신할 땐 둘 다 같은 패턴.
