---
index: 03
slug: geolocation
date: 2026-05-01
phase: "Phase 2 — P2.1 Geolocation + 가까운 휴지통 강조"
git_sha: 3dbf94e
viewport: 390x844
state: "내 위치 ON, 명동성당 좌표(37.5634, 126.9870) 주입, 가장 가까운 통 121m"
---

# 03 — 내 위치 + 가까운 휴지통 강조

P2.1 완료 직후. 사용자가 "📍 내 위치" 버튼을 누르면 권한 요청 → 위치 받기 → 지도가 해당 위치로 panTo + 펄스 점 표시 + 가장 가까운 휴지통에 노란 ring + 통계 바에 거리/이름 라벨.

## 보이는 것
- **새 칩**: "📍 위치 끄기" (활성 시 파란색 `#0ea5e9`, 비활성 시 흰색)
- **사용자 마커**: 파란 점(`#0ea5e9`) + 펄스 ring (1.6s ease-out 무한 반복)
- **강조 ring**: 가장 가까운 휴지통 둘레 노란 Circle(`#facc15`, radius 28m, weight 3)
- **거리 라벨**: 통계 바에 "· 가까운 통 121m (명동 성당 앞(명동길 79))" 추가, sky-300 색
- **panTo**: 사용자 위치로 자동 줌(zoom ≥16) + 0.6초 flyTo 애니메이션

## 무엇이 끝났나
- `src/lib/geo.ts` — Haversine 거리 + `findNearest` + `formatDistance` (m/km 자동 전환)
- `src/components/LocateButton.tsx` — 권한 흐름 + pending/active/clear 토글
- `src/components/UserMarker.tsx` — 펄스 점 (CSS-only animation, JS 노이즈 없음)
- `src/components/Map.tsx` — `userLocation`/`highlightBinId` props, `useMap()` 훅으로 flyTo, `<Circle>`로 ring
- `src/app/page.tsx` — locate 핸들러, 에러 상태(권한 거부/미지원), `findNearest` 메모

## 다음 것
`docs/tasks.md` Phase 2 잔여 후보:
- P2.2 PWA manifest + 설치 프롬프트 (모바일 사용성)
- P2.4 다크 타일 (CartoDB Dark Matter)
- P2.5 URL 쿼리스트링으로 필터 상태 공유

또는 P2.1 보강:
- 권한 거부 후 재시도 안내
- `watchPosition`으로 실시간 추적 (배터리 비용 vs 가치 결정 필요)
- 가까운 N개 강조 (현재 1개)
