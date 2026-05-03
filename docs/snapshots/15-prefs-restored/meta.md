---
index: 15
slug: prefs-restored
date: 2026-05-03
phase: "hotfix"
git_sha: 94282bf
viewport: 390x844
---

# 15 — 저장된 환경설정 복원 baseline (라이트 + 격자 + 빠름)

P2.12 검색 박스 머지 직후 발견된 hydration mismatch hotfix를 검증하기 위해 캡처. localStorage에 `{distanceMode: manhattan, tileTheme: light, walkingSpeed: fast}`가 박혀있는 사용자가 새로고침했을 때 콘솔 warning 0건, UI는 격자/라이트/빠름으로 정확히 복원되는지 한 컷에 담는다. 이전 인덱스에는 라이트 테마 + 격자 + 빠름이 동시에 적용된 상태가 없었으므로 시각 변종으로도 의미 있음.

## 보이는 것
- 라이트 OSM 타일 (CartoDB Dark Matter ❌, OpenStreetMap 표준 라이트)
- 활성 칩: `📐 격자` (amber), `🏃 빠름 5km/h` (sky), `☀️ 라이트` (amber)
- 검색 박스 비활성 (포커스 없음, placeholder만)
- 통계 바: `📍 59 / 전체 59개`
- 휴지통 마커들이 라이트 배경 위에 보라색 🗑️♻️ 혼합으로 또렷이

## 무엇이 끝났나
- `app/page.tsx`: `useState` 초기자에서 localStorage 읽기 제거 → 기본값으로 초기화 + `useEffect`에서 mount 후 복원
- `prefsHydratedRef`로 초기 persist effect 가드 — default가 saved를 덮어쓰지 않도록
- 검증: 저장된 prefs로 reload, 콘솔 warning/error 0건, UI는 정확히 복원
- `docs/tasks.md` 함정 메모에 "localStorage 초기화 ≠ useState 초기화" 패턴 추가
- `CHANGELOG.md` `[Unreleased] / Fixed` 한 줄

## 다음 것
- P2.5 URL 쿼리스트링 공유 (검색 박스와 자연스럽게 결합)
- 가벼운 셋트 P2.15 시스템 다크 자동 + P2.11 마커 톤 + P2.16 햅틱
- I.1 vitest 인프라 (이번 hotfix 같은 회귀 차단용)
