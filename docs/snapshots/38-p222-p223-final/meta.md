---
index: 38
slug: p222-p223-final
date: 2026-05-09
phase: "P2.22 + P2.23 (branch final)"
git_sha: 29d7f52
viewport: 390x844 (mobile) / 1024x1366 (iPad)
---

# 38 — P2.22 + P2.23 branch final state

`feat/p2.22-mobile-toolbar-compact` 브랜치의 모든 작업(P2.22 모바일 툴바 압축 → P2.23 HUD 재배치 → 9 라운드 fix → P2.18 카드 default 접힘 + 에러 토스트 분리 → cycleState 리팩터)이 끝난 최종 상태. PR / main 머지 직전 시각 검수용 마커.

## 캡처

- `screenshot-mobile-light.png` (390×844 light) — 헤더 Sun + 검색+공유 row + 메뉴 한 줄(출발/목적지/속도) + 좌상단 필터 + 우상단 ★/Ruler stack + 좌하단 [+/-/Target] cycle + 우하단 카드(default 접힘) + 데이터 출처
- `screenshot-mobile-dark.png` (390×844 dark) — Moon 헤더 + CartoDB Dark Matter + 모든 SVG 자동 다크 콘트라스트
- `screenshot-ipad-light.png` (1024×1366 light) — iPad Pro viewport, overflow-hidden 적용 후 페이지 스크롤 lock 확인

## 최종 layout 요약

### 상단 영역 (헤더 + 검색 row + 메뉴 한 줄)
- 헤더: 🗑️ 중구 휴지통 지도 [PROTO] | (우측) Sun/Moon 테마 토글
- 검색 row: 풀폭 검색박스 + Share2 (공유) 우측
- 메뉴 한 줄 (h-9 컴팩트): [🎯 출발 | 🏁 목적지] segmented + Footprints 4km/h
- 점유율: 약 17~20%

### 지도 위 floating
- 좌상단: 필터 박스 (🗑️/♻️ 마커 emoji 그대로)
- 우상단 stack: ★/☆ (즐겨찾기) / 📏 (직선·격자) — 2개 (Compass 빠짐, cycle로 통합)
- 좌하단 박스 (`bottom-2 left-2`):
  - `+` (확대)
  - `−` (축소)
  - cycle 버튼: off → gps(Target/sky) → cone(Compass/sky) → head-up(Navigation/violet) → off
- 우하단 카드: `📊 v2026-05-05 · 📍 802/802 ▾` (default 접힘) — 탭하면 출처 → status → 자치구 7행 펼쳐짐

## P2.22 + P2.23 Done 누적

- 칩 형태: rounded-full → rounded-md HUD (5색 accent state + ✓ corner badge 색맹 친화)
- emoji → lucide-react SVG (UI 칩만, 마커/토스트 emoji 유지)
- 메뉴 영역: ~50% → ~17%
- 좌하단 줌 + 위치 + 방향 통합 (4-state cycle)
- 우하단 카드 통합 (출처 + 합계 + 자치구 분포)
- iPad scroll lock + iOS pull-to-refresh 차단
- 다크 Moon 초승달 + Sun
- LocateFixed → Target ('N' 착시 회피)
- cycleState pure 함수 + 6 unit tests

## Verification

- `bun run build` ✓
- `bun run test` ✓ 144 tests (138 + 6 cycle-state)
- iPad viewport (1024×1366): hasV/hasH false (스크롤 lock 검증)
- 다크/라이트 양 테마 정상

## 다음 것

- Vercel preview iPad/iOS Safari 실 디바이스 검수
- OK 시 PR 생성 + main 머지 (`/trash-feature-merge-flow`)
- P2.19+P2.21 hidden feature 안내 묶음 PR
- P2.24 Apple Liquid Glass 디자인 (Open queue)
