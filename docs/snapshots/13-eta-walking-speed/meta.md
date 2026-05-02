---
index: 13
slug: eta-walking-speed
date: 2026-05-02
phase: "Phase 2.8 — 도착 예상 시간(ETA) + 보행 속도 3단계"
git_sha: TBD (pending commit)
viewport: 390x844
state: "내 위치 명동성당, 보통 4km/h, 가까운 통 121m → 약 1분 49초"
---

# 13 — ETA + 보행 속도 3단계

거리 표시 옆에 도착 예상 시간을 보행 속도 기준으로 환산. 칩 한 번 누르면 다음 단계로 cycle.

## 보이는 것
- **새 칩 "🚶 보통 4km/h"** — 클릭 시 cycle (느림 → 보통 → 빠름 → 느림 ...)
  - 🐢 느림 3 km/h
  - 🚶 보통 4 km/h (기본)
  - 🏃 빠름 5 km/h
- **통계 라벨**: `· 가까운 통 121m · 약 1분 49초 (명동 성당 앞(명동길 79))`
- 같은 칩 그룹(`bg-neutral-800`)이라 시각적으로 다른 토글들과 묶임

## 산식 검증 (121m 가까운 통)
- 보통 4 km/h → 121m ÷ (4000/3600 m/s) = **108.9s ≈ 1분 49초** ✓
- 빠름 5 km/h → 121m ÷ 1.389 = **87.1s ≈ 1분 27초** ✓
- 느림 3 km/h → 121m ÷ 0.833 = **145.2s ≈ 2분 25초** ✓
- Cycle wrap (느림 → 보통) 정상

## 변경 파일
- **`src/lib/eta.ts`** 신규
  - `WalkingSpeed = 'slow' | 'normal' | 'fast'`
  - `WALKING_SPEEDS` 매핑 (kmh, label, emoji) — `as const satisfies` pattern
  - `nextSpeed`, `etaSeconds`, `formatEta` (1분 미만 = N초, 정각 = N분, 그 외 = N분 N초)
- **`src/app/page.tsx`**:
  - `walkingSpeed` state, lazy init from `localStorage`
  - `useEffect`로 영속화
  - 새 cycle 칩 (`bg-neutral-800` 비활성 스타일)
  - 통계 라벨에 `· {formatEta(...)}` append
  - route 모드와 nearest 모드 둘 다 ETA 표시

## 함정
- **보행 속도는 직선 거리 기준 환산** — 실제 도보는 신호등·우회 등으로 더 길어짐. 표시는 "이상적 시간". 실용 추정엔 격자(📐) 모드 + 보통 속도가 보수적.
- **ETA는 destination 모드에서 total 거리 기준** (출발→통→목적지 전체). 사용자가 통만 들렀다 가는 시나리오니까 적절.

## 다음 것
- 다중 휴지통 경유 (그리디/TSP)
- P2.5 URL 쿼리스트링 (`?origin=lat,lng&dest=lat,lng&speed=fast`)
- 보행 속도 사용자 정의 km/h 입력 (현 3단계는 PoC)
- P2.3 클러스터링 (25구 확장 시)
