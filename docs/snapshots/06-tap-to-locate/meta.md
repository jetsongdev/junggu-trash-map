---
index: 06
slug: tap-to-locate
date: 2026-05-02
phase: "Phase 2.1+ — iPad/Safari fallback: 지도 탭으로 위치 지정"
git_sha: 8d6a4a3 (dirty)
viewport: 390x844
state: "탭 모드로 명동성당 부근 클릭, 112m 강조, 위치 끄기 활성"
---

# 06 — 탭으로 위치 지정 (iPad/GPS 거부 우회)

iPad Safari에서 GPS 권한이 한 번 거부되면 설정으로 들어가야 다시 풀려서 마찰이 큼. 또 LAN HTTP 환경에서는 prompt 자체가 안 뜨기도 함. 두 가지 개선:

1. **에러 코드별 안내 메시지** — `PERMISSION_DENIED`/`POSITION_UNAVAILABLE`/`TIMEOUT` 구분, 거부 시 "Safari 설정 > 위치 허용 후 새로고침, 또는 🎯 지도 탭 사용"
2. **🎯 지도 탭 모드** — 버튼 토글 → 지도 cursor `crosshair` → 한 번 클릭으로 사용자 위치 설정 → 모드 자동 종료

시뮬레이션·테스트·iOS GPS 우회·실내 사용 등 시나리오 모두 커버.

## 보이는 것
- 새 칩 **"🎯 지도 탭"** (활성 시 보라 `bg-violet-500`, "지도 탭하세요" 라벨)
- 클릭 후: 사용자 펄스 점이 클릭 좌표에 표시 + 가까운 휴지통 강조 ring + 거리 선 자동 그어짐
- "위치 끄기" 칩도 자동 활성 (탭으로 설정해도 GPS와 동일 흐름)

## 무엇이 끝났나
- `Map.tsx`: `useMapEvents` 훅으로 `MapClickHandler` 컴포넌트, `onMapClick` prop, 래퍼 div의 `tap-mode-active` 클래스
- `page.tsx`: `tapMode` state, `toggleTapMode`, `handleMapClick` (GPS watcher가 살아있으면 자동 정리)
- `globals.css`: `.tap-mode-active` 자손에 `cursor: crosshair`
- 에러 메시지: `err.PERMISSION_DENIED`/`POSITION_UNAVAILABLE`/`TIMEOUT` 분기, 각 분기가 탭 모드 우회 안내 포함

## 함정
- **react-leaflet `MapContainer.className` prop은 마운트 시점에만 적용** — runtime 토글 안 됨. 래퍼 div로 우회.
- 탭 모드 켜진 상태에서 `내 위치` 누르면 탭 모드 자동 해제 (mutually exclusive flow).

## 다음 것
- iPad 실기기에서 https://junggu-trash-map.vercel.app 열어 GPS 거부 → 탭 모드 우회 시나리오 검증 (사용자 직접)
- P2.2 PWA / P2.4 다크 타일 / P2.5 URL 필터 / Manhattan 토글 등 잔여 작업
