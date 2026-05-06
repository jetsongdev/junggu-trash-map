---
index: 33
slug: hud-rearrange
date: 2026-05-07
phase: "P2.23"
git_sha: 7d68481e0c8166d9dedb7c3d9982feb92da14253 (dirty)
viewport: 390x844
---

# 33 — HUD 재배치 + 출발/목적지 segmented 통합

기능별 컴포넌트를 메뉴 영역에서 빼서 지도 위 floating 영역으로 분산. 둥근 pill에서 각진 HUD 스타일로 시각 언어 통일. 출발/목적지를 두 분리 칩에서 segmented 한 박스로 통합. 메뉴 영역은 한 줄 축약.

## 보이는 것
- **좌상단 floating**: 필터 row (✓/🗑️/♻️ 아이콘 only). 활성 시 amber accent fill. 박스 ~150px (이전 글자 줄바꿈 문제 해결).
- **우상단 floating stack**: ★/☆ (즐겨찾기, 활성 시 filled + count badge) → 📏/📐 (직선·격자) → 🧭 (방향, mode 1/2 corner badge).
- **메뉴 한 줄**: 검색 + 📍 / [🎯 출발 ┃ 🏁 목적지] segmented / 🚶 4km/h / ☀️ / 🔗.
- **좌하단**: 줌 +/- 컨트롤 (P2.22에서 명시).
- **우하단 통합 카드**: `bg-white/45 dark:bg-neutral-900/45` 더 투명. 펼침=자치구 7행+status+출처 / 접힘=한 줄 (`📊 v2026-05-05 · 📍 802/802 ▴`).
- **HUD 시각 언어**:
  - `rounded-md` 각진 모서리
  - `ring-1` thin border
  - 5색 accent state: amber (즐겨찾기·격자·전체) / sky (cone) / violet (head-up·출발) / rose (목적지) / emerald (속도)
  - active = 15% color fill + ring + ✓ corner badge (색맹 친화)
  - mono numerics (`font-mono`)
- **Asterisk `*` 글리프**: `text-3xl leading-none -translate-y-0.5`로 emoji와 시각 weight 매치.

## 무엇이 끝났나
- HUD 헬퍼 도입: `hudInactive`/`hudChip`/`hudIconBtn`/`hudFloatingGroup` + 5색 active 헬퍼 (`hudAmberActive` 등)
- `FilterChips` 아이콘 only 변환 (44×44 정사각, aria-label/title 보강)
- 출발/목적지 segmented control 통합 (한 박스 + 중간 divider, 1️⃣/2️⃣ 뱃지 제거, 슬롯 위치로 순서 시사)
- 즐겨찾기 ★/☆ 상태별 분기 (active=★ filled, inactive=☆ outline)
- 우하단 카드 투명도 `/70` → `/45`
- `LocateButton`/`ShareButton` HUD 스타일 적용 (rounded-md, accent ring, ✓ corner)
- 메뉴 영역 점유율 ~30% → ~20% (헤더 + 검색 + 한 줄 칩)
- `bun run build` ✓, 138 tests ✓

## 다음 것
- Vercel preview 검수 — 모바일 GPS 권한 / iOS Safari 렌더링 / 다크 테마 콘트라스트
- 캡처 fix 진화: `screenshot-default → fix1 → fix2 → fix3` 의 4단계가 같은 폴더에 누적 — 라운드별 비교 가능
- P2.18 통계바 정보 분리, P2.19+P2.21 hidden feature 안내 묶음 PR (별도 라운드)
