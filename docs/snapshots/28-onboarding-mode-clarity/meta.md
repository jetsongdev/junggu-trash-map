---
index: 28
slug: onboarding-mode-clarity
date: 2026-05-05
phase: "P2.17"
git_sha: eed65ab (clean, pre-commit)
viewport: 390x844
---

# 28 — onboarding & 모드 명확화

P2.17 라운드. 신규 사용자가 첫 진입에서 "무엇을 해야 하는지" 알 수 있도록 세 가지 가드를 박았다.

## 보이는 것

- **칩 라벨에 1️⃣/2️⃣ 순서 뱃지**: `1️⃣ 🎯 출발 탭` / `2️⃣ 🏁 목적지` — 두 칩이 mutually-exclusive 모드라는 점을 시각적 시퀀스로 명확화. 이번 캡처는 라이트 테마(시스템 자동 감지) + 어떤 모드도 켜지지 않은 default 상태.
- 그 외는 snapshot 27 이후 변화 없음 — 검색 박스, 통계 바 (`📍 802 / 전체 802개` + 7구 breakdown), 데이터 출처 핀 (`📊 공공데이터포털 · v2026-05-05`), 802 마커 panning 인프라.

## 캡처되지 않은 동적 상태 (text로 기술)

- **emerald onboarding 토스트** (첫 방문 1회): `🎯 출발과 🏁 목적지를 정하면 경유 휴지통을 알려드려요` — manifest 로드 직후 emerald-600 강조 토스트로 6초 표시 후 자동 dismiss. localStorage `onboarded=true` 가드로 두 번째 방문부터 skip. 캡처 timing이 까다롭고 (6초 window) 일회성이라 별도 스크린샷 생략.
- **하단 고정 banner** (tap mode 활성 동안 영구): 출발 탭 모드 → 보라 (`bg-violet-600`) banner `🎯 지도에서 출발 위치를 탭하거나 검색하세요`. 목적지 탭 모드 → 장미 (`bg-rose-600`) banner. 자동 dismiss 없이 모드 종료(좌표 확정·재토글) 시에만 사라짐. Playwright screenshot이 click 후 font reflow에서 timeout — 코드 확인 후 manual 검증 권장.

## 무엇이 끝났나

- **U1** localStorage 가드 onboarding 토스트 (`onboardingFiredRef` + `onboarded` 키)
- **U2** 출발/목적지 칩 1️⃣/2️⃣ 뱃지 + tap mode 활성 시 하단 고정 안내 banner (보라/장미 컬러 코딩)
- **U3** 검색 드롭다운 열려있을 때 `handleMapClick` 가드 — `searchDropdownOpen` state, SearchBox에 `onDropdownChange` prop 추가

## 다음 것

- **P2.18** 통계바 정보 분리 — 에러는 빨간 토스트, 통계바는 성공 상태만
- **P2.19** hidden feature 발견 경로 (즐겨찾기·헤드업·격자·공유)
- **P2.20** Top-N 거리선 색맹 친화 패턴 (굵기/대시)
- **P3.1b** markercluster — 802 bins 시점에서 본격 효과
