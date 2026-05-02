---
index: 05
slug: realtime-tracking
date: 2026-05-02
phase: "Phase 2.1 — 실시간 추적 + 거리 선"
git_sha: 3dbf94e
viewport: 390x844
state: "watchPosition 활성, 좌표 시퀀스 시청→명동성당→DDP, 강조 ring + sky 점선 거리 선"
---

# 05 — 실시간 위치 추적 + 거리 선

`watchPosition`으로 사용자가 움직일 때마다 가까운 휴지통·강조·거리 선이 즉시 갱신되는 동작. 한 사용자 좌표(시청, 명동성당, DDP) 시퀀스로 발사해 동일한 코드가 어떻게 다른 화면으로 이어지는지 보임.

## 프레임

| 파일 | 좌표 | 가까운 통 | 거리 |
|------|------|----------|------|
| `screenshot.png` | 시청 (37.5660, 126.9778) | 세종대로124(서울신문사) | 158m |
| `frame-myeongdong.png` | 명동성당 (37.5634, 126.9870) | 명동 성당 앞(명동길 79) | 121m |
| `frame-ddp.png` | DDP (37.5673, 127.0095) | DDP 서울시티투어버스 정류장 02-920 | 52m |

각 프레임 동일 구조:
- 사용자 펄스 점 (sky-500 + ripple)
- 주황 강조 ring (`#f97316` + 노랑 fill, `highlight-pulse` 애니메이션)
- **sky-300 점선** 거리 선 (점-점 연결)
- 통계 바 라벨 자동 갱신

## 보이는 것
- `<Polyline>` `dashArray='6 6'`, `weight 3`, `opacity 0.75`, `color #0ea5e9`
- 사용자 좌표가 바뀌면 selectedNearest 자동 재계산 → 마커 ring과 line 즉시 이동
- panTo 자동: 새 위치로 부드럽게 이동 (zoom ≥16)

## 무엇이 끝났나
- `lib/geo.ts`에 `DistanceMode = 'euclidean'|'manhattan'`, `manhattanMeters`, `distanceMeters` 디스패처, `pathPositions(mode)` 추가 (Manhattan UI 토글은 추후)
- `page.tsx`: `getCurrentPosition` → `watchPosition` 전환, `useRef`로 watch ID 관리, unmount 시 자동 `clearWatch`
- `Map.tsx`: `<Polyline>` 추가, `pathPositions(mode)`로 모드별 모양 결정 (mode='manhattan'이면 L자 3점)

## 다음 것
- (추후) Manhattan 거리 토글 UI — `setDistanceMode` 한 줄로 연결
- P2.2 PWA / P2.4 다크 타일 / P2.5 URL 필터
