# P3.3 — 25구 셀렉터 그리드 디자인

> Status: 디자인 확정 (2026-05-09). 구현은 Codex 위임.

## 1. 배경

P3.2에서 `<MapMoveHandler>` panning auto-add가 들어가 있어 사용자가 지도를 끌어 다른 자치구로 진입하면 그 구가 자동 fetch된다. 그러나:

- 25구 중 어느 구가 데이터 있고 없는지 발견할 길이 panning뿐.
- 미발행 18구를 우연히 panning하면 "휴지통이 한 개도 없는 구"처럼 보이고 이유가 안 보인다.
- "강남으로 가보고 싶다"는 명시적 의도를 한 탭으로 처리할 진입점이 없다.

## 2. 목적

- 25구를 한 화면에서 보고 데이터 있는 구를 발견할 수 있게 한다.
- 한 탭으로 자치구 이동.
- 미발행 18구를 탭했을 때 "왜 비어있는지" 즉시 안내한다.

## 3. 범위

**In scope:**
- 우상단 HUD stack에 🗺 아이콘 칩 추가 (트리거)
- 25구 그리드 패널 (지리 위치 반영 5x5)
- populated 7구 vs empty 18구 시각 구분
- populated 탭 → `flyToBounds(bbox, { maxZoom: 15 })`
- empty 탭 → `flyTo(centroid, 14)` + info 토스트

**Out of scope:**
- 자치구 폴리곤 hover/highlight 변경
- 새로운 자치구 데이터 추가 (P3.x 후속)
- 자치구 정렬/검색 (그리드 한 화면이면 충분)

## 4. UI

### 4.1 트리거 칩
- 위치: 우상단 floating stack 맨 위 (즐겨찾기 위)
- 스타일: 기존 `hudIconBtn` 헬퍼 재사용
- 라벨: 🗺 (이모지)
- 활성 색: amber 계열 (다른 모드 칩과 구별 — favorites=amber, distance=sky, compass=violet 사용 중. amber 충돌 → **slate** 또는 **teal** 채택. 구현 시 결정)

### 4.2 그리드 패널
- 트리거 아래로 floating, `mt-1`
- 5x5 grid (`grid grid-cols-5`), 칸 크기 ~44px (모바일 터치타겟)
- 자치구 한 칸 = `<button>` (자치구명 한 줄 + 옵션 binCount)
- 빈 셀 (grid 두 칸): 빈 div placeholder

**셀 상태:**
- **populated** (`binCount > 0`): 색 fill (다크 = sky-600/30, 라이트 = sky-100), 자치구명 + binCount
- **empty** (`binCount === 0`): 다크 = neutral-800 / 라이트 = neutral-200 dim, 자치구명만, opacity 70%
- **viewing** (현재 지도 center가 속한 구): ring-2 ring-amber-400 강조 (모드별 색과 충돌 안 하는 선택)

### 4.3 5x5 그리드 매핑 (1차안)

```
| 도봉   | 노원   | 강북   | 성북   | -      |
| 은평   | 종로   | 동대문 | 중랑   | 광진   |
| 서대문 | 중구   | 용산   | 성동   | -      |
| 마포   | 영등포 | 동작   | 강남   | 강동   |
| 강서   | 양천   | 구로   | 금천   | 관악   |
```

빈 칸 2개. 정확한 서울 cartogram은 아니지만 서울 모양 인지는 가능.

> 구현 노트: 매핑 변경 가능성 있으니 상수로 추출 (`src/lib/district-grid.ts`).

### 4.4 토스트
- empty district 탭 시: `showToast('${name}는 아직 공공데이터가 발행되지 않았어요', 3000, 'info')`
- 기존 `showToast` infra (`src/app/page.tsx`) 그대로 사용. 'info' variant 이미 있음.

## 5. 인터랙션

| 액션 | 결과 |
|------|------|
| 트리거 칩 탭 | 패널 토글 (열림/닫힘) |
| 패널 외부 탭 | 패널 닫힘 |
| Esc 키 | 패널 닫힘 |
| populated 자치구 탭 | `flyToBounds(bbox, { maxZoom: 15 })` → 패널 자동 닫힘. panning auto-add가 자연스레 fetch 트리거 |
| empty 자치구 탭 | `flyTo(centroid, 14)` + info 토스트 → 패널 자동 닫힘 |

**flyToBounds maxZoom cap이 중요.** 작은 자치구(중구·용산)에서 cap 없으면 줌 17까지 들어가 markercluster 풀린 채 200+ 마커 동시 노출 → 끊김. P3.1b의 `disableClusteringAtZoom: 15`와 정렬해서 15로 cap.

## 6. 코드 구조

### 신규 파일

**`src/lib/district-grid.ts`** — 순수 함수
```typescript
export const GU_GRID_LAYOUT: (DistrictCode | null)[][];
export function getDistrictForCell(row: number, col: number): DistrictCode | null;
export function getCellForDistrict(code: DistrictCode): { row: number; col: number } | null;
export function boundsForDistrict(meta: DistrictMeta): [[number, number], [number, number]];
// bbox: [w, s, e, n] → leaflet bounds: [[s, w], [n, e]]
```

**`src/components/DistrictSelector.tsx`** — UI 컴포넌트
```typescript
type Props = {
  manifest: Manifest;
  viewingDistrict: DistrictCode | null;  // 현재 지도 center가 속한 구
  tileTheme: TileTheme;
  onSelectPopulated: (meta: DistrictMeta) => void;
  onSelectEmpty: (meta: DistrictMeta) => void;
};
// 자체 open state 관리 (useState).
// 외부 탭/Esc 닫힘은 컴포넌트 내부 useEffect로.
```

### 통합

**`src/app/page.tsx`:**
- 우상단 floating stack에 `<DistrictSelector ... />` 마운트 (즐겨찾기/거리모드/나침반 위)
- `handleDistrictSelectPopulated(meta)`:
  ```typescript
  mapInstanceRef.current?.flyToBounds(boundsForDistrict(meta), { maxZoom: 15 });
  ```
- `handleDistrictSelectEmpty(meta)`:
  ```typescript
  mapInstanceRef.current?.flyTo([meta.centroid[1], meta.centroid[0]], 14);
  showToast(`${meta.name}는 아직 공공데이터가 발행되지 않았어요`, 3000, 'info');
  ```
- `viewingDistrict`는 기존 `mapCenter` state + `findDistrictAt(point, geo)` 조합으로 유도. 또는 P3.2 panning 처리에서 이미 산출되는 값 재사용.

## 7. 테스트

### 단위 (vitest)
- `getDistrictForCell` / `getCellForDistrict` round-trip
- `boundsForDistrict`: bbox `[126.965, 37.546, 127.02, 37.575]` → `[[37.546, 126.965], [37.575, 127.02]]`
- 25구 모두 grid에 매핑됨 (검증 테스트로 강제)
- empty cell 좌표 (row, col) → null 반환

### E2E (수동, dev)
1. 칩 탭 → 패널 열림
2. 노원(populated) 탭 → 노원 bbox로 이동, 패널 닫힘, bin 마커 로드 (P3.2 panning trigger)
3. 종로(empty) 탭 → 종로 centroid로 이동, "종로구는 아직..." 토스트, 패널 닫힘
4. 패널 외부 탭 → 패널 닫힘
5. 라이트/다크 양 테마에서 색 가독성 확인

## 8. snapshot

`docs/snapshots/35-district-selector/`:
- `default.png` — 패널 닫힘 (칩만 stack 위)
- `opened.png` — 패널 열림 (5x5 grid, populated 색별 / empty dim)
- `empty-toast.png` — empty 자치구 탭 후 토스트 노출

## 9. 함정 후보

- **flyToBounds maxZoom 누락** — 작은 자치구에서 줌 17까지 들어가 markercluster 풀려 끊김. `{ maxZoom: 15 }` 필수.
- **5x5 grid 좌표 매핑 hard-coded** — 서울 25구 정렬은 사람이 결정해야 함 (centroid 기준 자동 생성하면 어색한 칸 발생). 수정 가능성 위해 상수로 분리.
- **viewing district 표시 깜빡임** — `mapCenter`가 moveend에서 갱신되므로 fly 애니메이션 중에는 viewingDistrict가 출발지 → 도착지로 한 번에 점프. 깜빡임 없음. 단 panning 도중 polygon 경계 통과 시 ring이 깜빡일 수 있음 — 무시 가능.
- **panel open localStorage 미적용** — 의도. 모바일 화면 점유 우려, 매 세션 닫힘 default가 자연.
- **트리거 색 충돌** — amber(즐겨찾기)·sky(거리)·violet(나침반) 사용 중. 신규 칩은 slate/teal 채택해 시각 충돌 회피.
- **markercluster auto-add 트리거** — populated 탭 시 P3.2 `MapMoveHandler`가 moveend에 fetch 트리거하므로 추가 작업 불필요.

## 10. 작업 분할

| 단계 | 산출물 | 의존 |
|------|--------|------|
| A | `src/lib/district-grid.ts` + vitest | — |
| B | `src/components/DistrictSelector.tsx` | A |
| C | `src/app/page.tsx` 통합 (stack 마운트 + 핸들러 2개) | A, B |
| D | snapshot 3장 + tasks/CHANGELOG | C |

A·B 동시 작업 가능. C는 둘 머지 후. D는 마지막.

## 11. 관련 파일

- `public/data/seoul-manifest.json` — 25구 메타 (bbox/centroid/binCount)
- `src/lib/districts.ts` — `DistrictCode`, `DistrictMeta`, `Manifest` 타입
- `src/app/page.tsx` — `mapInstanceRef`, `showToast`, `mapCenter` 등
- `src/components/Map.tsx` — `onMapReady`로 leaflet map 인스턴스 노출 (이미 있음)
