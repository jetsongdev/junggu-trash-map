---
index: 16
slug: polish-bundle
date: 2026-05-03
phase: "P2.11 + P2.15 + P2.16"
git_sha: 812331f (dirty)
viewport: 390x844
---

# 16 — 폴리싱 셋트 (마커 톤 + 시스템 다크 자동 + 햅틱)

P2.12 검색 박스 production 배포 직후 폴리싱 라운드. 세 작은 task를 한 PR로 묶어 처리. 시각적으로 가장 큰 차이는 (a) 마커 색이 새 blue/emerald/violet-400 톤으로 바뀐 것, (b) localStorage가 빈 상태에서는 시스템 prefers-color-scheme에 맞춰 첫 화면이 결정되는 것 (이 캡처는 라이트 시스템 환경).

## 보이는 것
- 라이트 OSM 타일 — `localStorage['tileTheme']`이 비어있고 시스템이 라이트라 자동 선택됨
- 활성 테마 칩: `☀️ 라이트` (이전 다크 baseline 대비 자동)
- 새 마커 색 — 혼합 보라가 `#c084fc` (violet-400)로 한 단계 밝아짐. 라이트 배경 위에서도 또렷, 다크 위에서도 충돌 없음
- 검색 박스/필터/위치/거리 모드/탭 칩 등 기존 헤더는 그대로
- 통계 바: `📍 59 / 전체 59개`

## 무엇이 끝났나
- **P2.11** 마커 색 — `#3b82f6→#60a5fa` (일반/blue-400), `#10b981→#34d399` (재활용/emerald-400), `#a855f7→#c084fc` (혼합/violet-400). divIcon 캐시 키에 color 포함시켜 cache 정합 유지
- **P2.15** 시스템 다크 자동 — localStorage `tileTheme`이 비었을 때만 mount 후 useEffect에서 `prefers-color-scheme: dark` 결과 적용. 칩 토글 시점부터 명시 선택을 localStorage에 저장 → 이후 시스템 변경에 영향받지 않음
- **P2.16** 햅틱 — `BinMarker` 클릭 핸들러에 `navigator.vibrate(12)` (12ms). iOS Safari 미지원 → silent skip
- 콘솔 warning/error 0건 (P2.12 hotfix의 hydration mismatch 패턴 그대로 따라 회피)
- `bun run build` Turbopack 통과

## 다음 것
- P2.5 URL 쿼리스트링 공유 (검색 + prefs까지 링크 한 줄)
- P2.13 방향 화살표 / P2.14 즐겨찾기 — 남은 가벼운 잔여
- I.1 vitest 테스트 인프라 (이번 hotfix·prefs 회귀 차단)
