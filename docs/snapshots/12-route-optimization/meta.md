---
index: 12
slug: route-optimization
date: 2026-05-02
phase: "Phase 2.7 — 출발/목적지 + 경유 휴지통 최적화"
git_sha: f6e67fd
viewport: 390x844
state: "출발=시청 부근, 목적지=동쪽(을지로 너머), 경유=을지로입구역 1-1번출구 앞 (+47m)"
---

# 12 — 경로 최적화 (출발 → 휴지통 → 목적지)

기존 "가장 가까운 통" 강조에 더해, **목적지가 정해지면** 경로상에서 가장 우회가 적은 통을 선택. detour cost = `dist(출발,통) + dist(통,목적지) - dist(출발,목적지)`. distanceMode(직선/격자) 따라 자동.

## 보이는 것
- **출발 펄스 점** (sky-500) — 시청 좌표 mock
- **🏁 목적지 마커** — 우측 클릭 좌표
- **청록(`#22d3ee`) 점선 경로** — 출발 → 경유 통 → 목적지 (3 segment, mode-aware)
- **주황 강조 ring** — 경유 통(을지로입구역 1-1번출구 앞)
- **통계 라벨**: `출발→을지로입구역 1-1번출구 앞→목적지 354m (경유 +47m)` (cyan-300)
- 새 칩 **🏁 목적지** — 클릭 시 destination tap mode → 한 번 탭 → 자동 종료
  - destination set 후 라벨 "🏁 목적지 해제"로 바뀜
- 기존 "🎯 지도 탭" → **"🎯 출발 탭"** 으로 rename

## 알고리즘 검증
같은 케이스로 직접 Haversine 계산:
- 시청(출발) → 목적지 직선 거리 약 307m
- 을지로입구역 통(JG-0040) 경유: via1 + via2 = 354m → **detour +47m** ✓
- 다른 후보 통들 모두 더 큰 detour (예: 세종대로124는 출발과 가까워 +219m)

## 변경 파일
- **`src/lib/geo.ts`**: `routePositions(origin, via, dest, mode)` (3-segment polyline points), `detourCost`, `findOptimalDetour`
- **`src/components/DestinationMarker.tsx`** 신규 — 🏁 깃발 divIcon, drop-shadow
- **`src/components/Map.tsx`**: `destination` prop, `RouteLine` 컴포넌트(청록 dashed), `DestinationMarker` 렌더, 경로/거리선 분기 (`showRoute` vs `showDistanceOnly`)
- **`src/app/page.tsx`**:
  - `tapTarget: 'origin' | 'destination' | null` 단일 union state로 통합
  - destination state + 칩 (rose-500 active)
  - 통계 라벨 분기 (route vs nearest)
  - `inactiveChip` / `chipBase` 클래스 토큰 추출 — 가독성

## 함정
- **단일 휴지통만 경유**: TSP가 아니라 단일 detour. 여러 휴지통 거치며 가는 경로는 다른 알고리즘 필요(Phase 3).
- **시각 차별화**: 경로 polyline은 청록(`#22d3ee`), 단순 거리선은 sky(`#0ea5e9`). 둘 다 dashed지만 색·두께(3 vs 4)·gap(6 6 vs 8 6)으로 구분.

## 다음 것
- 다중 휴지통 경유 (TSP 또는 그리디로 N개 추천)
- "도착 예상 시간" — 보행 속도(4 km/h) 곱해 시간 환산
- P2.5 URL 쿼리스트링 (`?origin=lat,lng&dest=lat,lng`)
- P2.3 클러스터링 (25구 확장 시)
