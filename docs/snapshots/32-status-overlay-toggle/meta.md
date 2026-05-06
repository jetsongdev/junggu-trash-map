---
index: 32
slug: status-overlay-toggle
date: 2026-05-06
phase: "P2.22+"
git_sha: 7d68481e0c8166d9dedb7c3d9982feb92da14253
viewport: 390x844
---

# 32 — 데이터 현황 + 출처 통합 토글 카드

`📍 802 / 전체 802개` 합계와 자치구별 분포(`마포 198 · 구로 188 · ...`)를 메뉴 영역에서 빼고, 우하단의 출처 배지 하나로 통합. 한 카드가 [버전 + 합계 + 자치구 분포 + 출처]를 모두 담고, 한 줄 토글로 펼침/접힘. 메뉴 영역은 검색 + 3개 칩 그룹만 남아 ~250px 수준으로 다시 압축.

## 보이는 것
- **접힘 (기본 칩 1줄)**: `📊 v2026-05-05 · 📍 802/802 ▴` — 우하단 `bottom-7 right-2`. 데이터 메타 한 호흡으로 읽힘.
- **펼침 (카드 위로 stack)**: 자치구 7행 (이름 + ✓/⟳/✗ 상태 + 카운트, 정렬 binCount desc) → 추가 status (route/savings/error 조건부) → "출처 → 공공데이터포털" 링크.
- **투명도**: `bg-white/70 dark:bg-neutral-900/70` (이전 출처 배지 `/85`보다 더 투명) + `backdrop-blur-sm`. 지도 마커가 카드 뒤로 비치며 시야 부담 적음.
- **상태 영속화**: `localStorage.statusOverlayCollapsed` — 사용자가 접으면 다음 방문도 접힌 상태.
- **활성 fetch**: `activeFetches.size > 0` 일 때 토글 줄 카운트 옆 amber pulse dot (가벼운 hint, 자치구별 ⟳ 아이콘은 펼침 영역에서 본격 표시).
- **a11y**: 버튼 `aria-expanded` + `aria-label`, 펼침 영역의 link는 새 탭 + `noopener`, status pulse dot은 `role="status" aria-live="polite"` 유지.

## 무엇이 끝났나
- 좌상단 status 카드 (이전 시도) 폐기 → 우하단 출처 위치에 통합
- 메뉴 영역에서 status 줄 + breakdown 행 제거 (헤더 + 검색 + 3개 칩 그룹만 남음)
- 출처 link를 펼침 영역 보조 줄로 이동 — "출처 → 공공데이터포털" 한 줄
- `STATUS_VIS` 패턴 (loaded/inFlight/pending/failed) 재사용으로 자치구 상태 일관 표시
- `statusCollapsed` state + hydration + persist 추가 (`localStorage.statusOverlayCollapsed`)
- `bun run build` ✓, 모바일 viewport 양 상태(펼침/접힘) 캡처 보존

## 다음 것
- 펼침 상태에서 카드 너비가 모바일(390px)에서 약 312px(80%) — 더 좁히고 싶으면 `max-w-[60%]` 조정 검토
- P2.18 통계바 정보 분리 (에러 토스트 분기) — 이번 변경으로 status가 카드 안에 모였으니 에러는 토스트로 빼고 카드는 정상 데이터만 두는 형태로 후속 가능
- P2.19+P2.21 hidden feature 안내 묶음 PR
