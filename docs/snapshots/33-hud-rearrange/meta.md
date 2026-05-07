---
index: 33
slug: hud-rearrange
date: 2026-05-07
phase: "P2.23 + P2.18"
git_sha: 50ebd23
viewport: 390x844
---

# 33 — HUD 재배치 + 9 라운드 fix 누적

P2.23 HUD 재배치 시작 → 9 라운드 점진적 fix가 같은 폴더에 누적된 가장 큰 시각 마일스톤. 둥근 pill에서 각진 HUD 스타일로 시각 언어 통일 + emoji → SVG 아이콘 + floating 컴포넌트 재배치 + 우하단 카드 토글 + 라이트/다크 양 테마. 마지막에 Codex review로 발견된 회귀(P2.18 카드 default 펼침 + 에러 미노출) 정리.

## 캡처 진화

| 라운드 | 파일 | 변경 핵심 |
|--------|------|----------|
| 0 (P2.23 시작) | `screenshot-default.png` / `screenshot-collapsed.png` | 좌상단 글자 줄바꿈 문제 (max-w-[60%] + 한국어 wrap) |
| fix1 | `screenshot-fix1-default.png` / `fix1-collapsed.png` | FilterChips 아이콘 only(✓/🗑️/♻️) + 출발/목적지 segmented 통합 |
| fix2 | `screenshot-fix2-default.png` | 전체 ✓ → `*` 변경 (코너 ✓ 뱃지와 시각 충돌 해소) |
| fix3 | `screenshot-fix3-default.png` | `*` 크게(text-3xl) + ☆/★ 상태별 분기 |
| fix4 | `screenshot-fix4-default.png` / `fix4-dark.png` | emoji → lucide SVG 아이콘 통일 (12개 매핑) |
| fix5 | `screenshot-fix5-light.png` / `fix5-dark.png` | 테마 토글 메뉴→헤더 우측, 다크 Moon 초승달 |
| fix6 | `screenshot-fix6-light.png` / `fix6-dark.png` | 위치 메뉴→좌상단 + 메뉴 h-9 + 토글 ChevronUp/Down + 카드 swap(출처 위 / 자치구 아래) |
| fix7 | `screenshot-fix7-light.png` | 위치 좌상단→좌하단 (Naver Map GPS 패턴, 줌 위) |
| fix8 | `screenshot-fix8-ipad.png` | iPad 1024×1366 viewport 검증 — 스크롤 lock(`overflow-hidden`) 후 hasV/hasH false |
| fix9 (현재) | `screenshot-fix9-icons.png` / `fix9-icons-dark.png` | LocateButton MapPin → LocateFixed (정밀 GPS 시맨틱) + 출발 Crosshair → MapPin / 카드 default 접힘(P2.18) + 에러 토스트 분리(P2.18) |

## 최종(fix9) 보이는 것

### 라이트 모드 (`screenshot-fix9-icons.png`)
- **헤더 우측**: Sun (라이트 → 클릭 시 다크 전환)
- **검색 row**: 풀폭 검색박스 + Share2 (공유)
- **메뉴 칩 한 줄 (h-9)**: [🎯 출발 ┃ 🏁 목적지] segmented (MapPin/Flag) + 🚶 4km/h (Footprints + 텍스트)
- **좌상단 floating**: 필터 박스 단독 (🗑️/♻️ emoji, 마커와 시각 일관성)
- **우상단 floating stack**: ☆ (Star outline) / 📏 (Ruler) / 🧭 (Compass)
- **좌하단 floating**: LocateFixed (십자선 + 중앙 점, 정밀 GPS) + 줌 +/- 컨트롤
- **우하단 카드 (default 접힘)**: `📊 v2026-05-05 · 📍 802/802 ▾` 한 줄 — 첫 방문 시 지도 가시 영역 최대 (P2.18 fix)

### 다크 모드 (`screenshot-fix9-icons-dark.png`)
- 헤더 토글 Moon (초승달, 사용자 요구)
- CartoDB Dark Matter 타일
- 모든 SVG 아이콘 다크 콘트라스트 자동 분기 (`currentColor` + dark:text-*)
- 우하단 카드 `bg-neutral-900/45` 다크 배경에서 더 명확

## P2.18 / 회귀 fix (Codex review 반영)

`fix9` 라운드에서 함께 처리:
- **카드 default 접힘**: `useState(false)` → `useState(true)`. localStorage `'false'` 명시 시에만 펼침 복원. 첫 방문자가 펼친 카드에 지도 일부 가리던 회귀 해결.
- **에러 토스트 분리** (P2.18 Done): `ToastVariant` 타입 도입(`info`|`emphatic`|`error`). `locateError`/`error` → 빨간 토스트(⚠ + role=alert + 6초). 카드 안 에러 영역 제거. 카드 펼침 영역은 route/savings 성공 상태만. (에러 토스트 시각 캡처는 navigator.geolocation 모킹 brower policy 한계로 별도 보존 X — 실 디바이스 GPS 거부 시나리오로 검증 권장.)

## HUD 시각 언어 (전체 마일스톤 정리)

- `rounded-md` 각진 모서리 (둥근 pill 폐기)
- `ring-1` thin border + 5색 accent state (amber/sky/violet/rose/emerald)
- active = 15% color fill + ring + ✓ corner badge (색맹 친화)
- mono numerics (km/h, count 등)
- emoji → lucide-react SVG (12개 매핑) — OS별 렌더링 차이 제거, currentColor로 테마 자동 분기
- 마커 emoji (🗑️/♻️) + 토스트/aria-label emoji는 유지 (시각 정체성 + 메시지 톤)

## 무엇이 끝났나

- HUD 헬퍼 도입: `hudInactive`/`hudChip`/`hudIconBtn`/`hudFloatingGroup` + 5색 active 헬퍼
- 메뉴 영역 점유율 ~50% (P2.22 이전) → ~30% (P2.22) → ~20% (P2.23) → ~17% (P2.18 fix 후 default 접힘)
- 좌상단 / 우상단 / 좌하단 / 우하단 4코너 floating 분산
- 카드 토글 가독성 (text-xs + ChevronUp/Down)
- 출처 link 외부 시그널 (ExternalLink 아이콘 + underline)
- 펼침 카드 swap (출처 위 / 자치구 아래)
- iPad Safari overflow lock (`<html>`/`<body>` overflow-hidden + overscroll-none)
- 라이트/다크 양 테마 + Sun/Moon 초승달
- LocateFixed (GPS 정밀) vs MapPin (지점 마커) 시맨틱 분리
- `bun run build` ✓, 138 tests ✓ (모든 라운드)

## 다음 것

- Vercel preview iPad/iOS Safari 실 디바이스 검수 (GPS 권한 / 다크 테마 / 검색 / segmented)
- OK 시 PR 생성 + main 머지 (`/trash-feature-merge-flow`)
- P2.19+P2.21 hidden feature 안내 묶음 PR (별도 라운드)
- P2.24 Apple Liquid Glass 디자인 언어 (Open queue)
