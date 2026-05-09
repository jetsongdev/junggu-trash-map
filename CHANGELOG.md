# Changelog

이 프로젝트의 모든 주목할 변경사항은 이 파일에 기록된다.

포맷은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 기반.
버전은 [Semantic Versioning](https://semver.org/lang/ko/)을 따른다.

엔트리는 사용자/리뷰어 관점에서 변화를 한 줄로 적는다 — 구현 디테일이 아니라 "사용자가 보거나 느낄 차이". 한 글머리 기호 = 한 변경.

## [Unreleased]

### Fixed
- 키보드로 지도 HUD, 검색, 팝업, 마커와 클러스터를 이동할 때 포커스 링이 더 명확하게 보입니다. `=`/`-` 키로 지도 확대·축소도 가능해졌습니다. 마커와 클러스터의 스크린리더 이름도 숫자·이모지 대신 위치명 또는 "휴지통 N개 그룹"으로 읽히며, `prefers-reduced-motion` 사용자는 지도 이동·줌과 반복 애니메이션이 줄어듭니다 (I.6 2차).

## [0.19.1] - 2026-05-09

### Added
- `docs/snapshots/40-district-selector/screenshot-empty-toast.png` — P3.3 셀렉터에서 미발행 자치구(예: 동대문)를 탭했을 때 뜨는 안내 토스트의 모바일 다크 캡처. P3.3 본 세션에서 빠졌던 한 장이 채워져 visual history가 default · opened · empty-toast 3장으로 완결됩니다 (P3.3-fix1).
- 현재 보고 있는 자치구의 외곽선을 지도에 점선으로 띄우고, 폴리곤 중앙에 자치구 이름을 함께 표시합니다. 외곽선은 halo + 점선 두 겹으로 그려 라이트·다크 양 테마의 어떤 도로·배경 위에서도 명확히 보입니다(라이트 = 흰 halo + deep blue 점선, 다크 = 검정 halo + amber 점선). 라이트 모드 외곽선 색은 Top-3 거리선 톤(blue-800)과 동일해 시각 일관성을 유지합니다. 자치구 이름은 지도 위 폴리곤 중앙에 큰 글씨로 떠서 HUD 너비를 흔들지 않고 패닝 따라 자연스럽게 이동합니다 (P3.4).

### Fixed
- 검색박스를 감싸는 영역이 어떤 landmark에도 속하지 않아 스크린리더가 페이지 구조를 짚어주지 못하던 문제를 고쳤습니다. 헤더 아래 검색·필터 영역에 "검색 및 컨트롤" 라벨을 붙여 region landmark로 명시했습니다 (I.6).
- 목적지 버튼의 스크린리더 이름에서 시각 뱃지로 쓰던 "2️⃣ 🏁" 이모지를 제거했습니다. 1️⃣/2️⃣ 시각 뱃지는 P2.23에서 이미 빠졌는데 aria-label에는 남아 있어 스크린리더가 "two-emoji flag-emoji 목적지"처럼 음성으로 읽던 상태였습니다. 출발 버튼("출발 위치 지정")과 톤이 일치하도록 "목적지 지정"·"목적지 탭하세요"·"목적지 해제"로 단순화했습니다 (I.6).

### Infrastructure
- 릴리스 자동화 finalize job에 `release:*` 라벨 게이트를 추가했습니다. 라벨 없는 PR(예: docs-only)이 머지될 때 finalize가 같은 tag를 다시 push하려다 실패하던 노이즈가 사라집니다. prebump 게이트와 일관성 유지.
- 릴리스 자동화가 라벨 달린 PR branch에서 version/CHANGELOG prebump commit을 먼저 만들고, main merge 후에는 merge commit 기준 tag/GitHub Release/PR 코멘트만 생성합니다. squash merge 1회로 사용자 변경 + version bump가 함께 prod에 반영돼 footer 버전이 즉시 갱신됩니다. Vercel Ignored Build Step은 `.md only skip` 가드로 운영합니다.

## [0.18.0] - 2026-05-09

### Added
- 우상단 🗺 칩으로 서울 25구 셀렉터 패널을 열 수 있습니다. 5x5 그리드에 모든 자치구가 지리 위치에 가깝게 배치되며, 데이터가 있는 7개 구는 sky 톤 + 휴지통 개수, 미발행 18개 구는 dim 처리됩니다. populated 구를 탭하면 그 구의 외곽 영역으로 부드럽게 이동하며 자동으로 마커가 로드되고, empty 구를 탭하면 "{자치구}는 아직 공공데이터가 발행되지 않았어요" 안내가 뜹니다 (P3.3).

## [0.17.0] - 2026-05-09

### Added
- 보행 속도 슬라이더를 열면 우측 `km/h` 아래에 예상 시간이 한 줄로 함께 뜹니다(예: `4 km/h` / `가까운 통 약 2분 16초`). 슬라이더를 끌면 ETA가 같이 갱신돼 속도 결정에 필요한 정보가 한 시야 안에 모입니다. 출발+목적지가 모두 설정되면 경유 경로 ETA로, 출발(또는 GPS)만 있으면 가장 가까운 통 ETA로 자동 전환됩니다. 후보가 없을 때(GPS·목적지 미설정)는 ETA 줄이 표시되지 않아 패널 높이가 그대로 유지됩니다. 스크린리더는 `aria-live="polite"`로 시간 변화를 announce 합니다.

## [0.16.0] - 2026-05-09

### Changed
- 모바일에서 메뉴 영역이 화면의 거의 절반을 차지하던 문제를 정리했습니다. 칩이 의미 단위(필터·경로·보기)로 3개 그룹으로 묶여 시각 경계가 생겼고, 위치/직선/출발/목적지/방향/테마/공유 칩은 텍스트를 빼고 아이콘만 유지해 줄 수가 한 단계 줄었습니다. 즐겨찾기 칩은 ★ 옆 숫자만 보입니다 (P2.22).
- 지도 줌 컨트롤(+ / -)을 우상단 기본 위치에서 좌하단으로 옮겼습니다. 한 손으로 잡았을 때 엄지 닿는 영역과 가까워집니다.
- 메뉴 영역에 있던 "📍 802 / 전체 802개" 합계와 자치구 분포(`마포구 198 · 구로구 188 · ...`) 두 줄을 제거하고, 지도 우하단 출처 배지에 한 카드로 통합했습니다. 평소엔 `📊 v2026-05-05 · 📍 802/802` 한 줄로 접혀 있고, 탭하면 위로 자치구 7개 분포 + 추가 상태 + 출처 링크가 펼쳐집니다. 접힘/펼침 상태는 다음 방문에도 기억됩니다.
- 필터 칩(전체/일반/재활용)을 메뉴에서 빼고 지도 좌상단 floating 박스로 옮겼습니다. 텍스트 제거, `*`/🗑️/♻️ 아이콘 only 가로 row. 우상단에는 즐겨찾기/직선·격자/나침반을 세로 stack으로 띄웠고, 출발/목적지는 한 박스로 통합한 segmented 컨트롤(좌측 🎯 출발 ┃ 우측 🏁 목적지)로 합쳐 1️⃣/2️⃣ 뱃지를 없앴습니다. 즐겨찾기 비활성 시 ☆, 활성 시 ★로 시각 분기됩니다 (P2.23).
- 메뉴 툴바 칩 모양을 둥근 pill에서 각진 HUD 스타일(`rounded-md` + thin border + 색별 accent fill 15% + ✓ 코너 뱃지)로 통일했습니다. 활성 색은 amber/sky/violet/rose/emerald 5색 체계로, 색맹 친화 위해 ✓ 코너 뱃지를 함께 표시합니다.
- 데이터 현황 카드 투명도를 더 높였습니다(`/70` → `/45`). 카드가 지도 위에 떠 있어도 마커가 비치며 시야 부담이 줄어듭니다.

### Removed
- 좌상단 필터 박스에서 "전체" 버튼(`*` 아이콘)을 제거했습니다. 카테고리가 2개(일반/재활용)뿐이라 둘 다 토글 해제하면 자동으로 "전체"가 되므로 별도 버튼이 redundant합니다. 미래에 카테고리가 3개 이상으로 늘어나면 다시 추가됩니다 (P4.1 예정).

### Changed
- UI 칩 안에 들어가던 이모지(📍/🎯/🏁/🔗/🌑/☀️/★ 등)를 lucide-react SVG 아이콘으로 통일했습니다. OS별 이모지 렌더링 차이가 사라지고, HUD 미니멀 톤과 매치됩니다. 마커(🗑️/♻️)와 토스트 메시지 안의 이모지는 그대로 유지됩니다.
- 공유 버튼을 메뉴 칩 row 끝에서 검색박스 우측 같은 줄로 옮겼습니다. 검색 직후 공유 흐름이 더 자연스럽습니다.
- 라이트/다크 테마 토글을 메뉴 영역에서 빼서 헤더 우측 끝(웹페이지 일반적 위치)으로 옮겼습니다. 다크 아이콘은 초승달(Moon) 모양이라 새 달(🌑)보다 훨씬 명확합니다.
- 위치 추적(GPS) 버튼을 메뉴 칩 row에서 빼서 지도 좌하단 floating으로 옮겼습니다. Naver Map의 GPS 버튼 위치 패턴 — 줌 컨트롤(+/-) 바로 위에 단독 floating. 한 손으로 잡았을 때 엄지 닿는 영역과 가까워졌습니다.

### Fixed
- iPad Safari에서 지도 일부가 잘리고 페이지 자체가 세로 스크롤되던 문제를 해결했습니다. `<html>`/`<body>`에 `overflow: hidden` + `overscroll-behavior: none`을 박아 root viewport를 잠그고 dynamic viewport(`h-dvh`)와 충돌하지 않도록 했습니다. iOS pull-to-refresh 동작도 차단됩니다.
- 첫 방문 시 데이터 카드가 펼친 상태로 떠 지도 하단을 가리던 문제를 해결했습니다. 기본 상태가 접힘으로 바뀌었고, 펼침 상태는 사용자가 명시적으로 펼친 경우(`localStorage.statusOverlayCollapsed === 'false'`)에만 복원됩니다.
- GPS 권한 거부, 자치구 fetch 실패 등 에러 메시지가 데이터 카드 안에만 있어서 카드가 접혀 있을 때 보이지 않던 회귀를 수정했습니다. 이제 에러는 카드 위치와 무관하게 화면 하단 빨간 토스트(⚠ + role=alert, 6초)로 즉시 노출되고, 카드 펼침 영역은 route/savings 같은 성공 상태만 보여줍니다 (P2.18).
- 내 위치 찾기 버튼과 출발 지점 버튼의 아이콘이 비슷해서 헷갈리던 문제를 정리했습니다. 내 위치 찾기는 Target(동심원 + 중앙 점, GPS 정밀 위치 의미), 출발 지점은 MapPin(지점 마커)로 시맨틱이 분명해졌습니다.
- 좌하단을 한 박스로 통합했습니다: [+] [−] [위치/방향 cycle] 세로 stack. Leaflet 내장 ZoomControl을 폐기하고 lucide Plus/Minus 커스텀 버튼으로 교체했습니다. 위치와 방향 버튼은 4-state cycle로 통합됐습니다 — off → GPS(Target/sky) → GPS+cone(Compass/sky) → GPS+head-up(Navigation/violet) → off. GPS가 켜져있어야 방향 모드를 켤 수 있는 의존 관계가 cycle 순서로 자연스럽게 표현됩니다. 우상단 stack에서 나침반 버튼이 빠져 즐겨찾기/거리모드 2개로 더 컴팩트해졌습니다.
- 우상단 모드 stack(즐겨찾기 + 거리모드)을 좌상단으로 옮겨 필터 박스 옆에 가로로 정렬했습니다. 우상단은 비워져 검색 드롭다운/마커 시야가 더 깨끗합니다.
- 좌하단 통합 박스를 viewport 가장자리에서 더 떨어뜨렸습니다(`bottom-2 left-2` → `bottom-4 left-4`). 한 손으로 잡았을 때 엄지 닿는 영역과 자연스럽게 떨어집니다.
- floating 컴포넌트를 다시 재배치했습니다: 좌상단은 거리모드(Ruler/Grid3x3)만, 우상단은 필터(🗑️/♻️) 세로 stack, 즐겨찾기는 메뉴 칩 row(검색 아래)로. FilterChips에 `layout="vertical"` 옵션 추가.
- 메뉴 칩 row를 더 컴팩트하게: 높이 44px → 36px(`h-9`), 출발/목적지 segmented 안의 아이콘+텍스트가 세로 두 줄에서 가로 한 줄로 바뀌어 360px 모바일 폭에 두 칩(출발-목적지·속도)이 한 줄에 자연 fit됩니다.
- 우하단 데이터 카드 토글 버튼 가독성을 키웠습니다: 폰트 10px → 12px(`text-xs`), padding 늘려 hit area 확보, 토글 화살표를 lucide ChevronUp/Down SVG로 교체해 시인성 ↑.
- 데이터 카드를 펼쳤을 때 보이는 순서를 swap했습니다: 출처(공공데이터포털 + 외부 링크 아이콘 + underline) 맨 위 → status → 자치구 7행 분포 아래. 출처를 첫 줄로 올려 데이터 신뢰도 시그널을 강화했습니다.

## [0.15.0] - 2026-05-09

### Added
- 휴지통 popup에 위치 힌트가 한 줄로 표시됩니다. 힌트는 **출처별로 시각이 다릅니다** — 운영자(curated)가 손으로 단 hint는 주소 위 primary 라인(`text-neutral-700`)으로 뜨고, Kakao Local API에서 자동 추출한 hint는 `📍 근처: <랜드마크>` 형식에 우측 끝 작은 ` · KAKAO` 라벨로 표시되어 검증된 사람 hint와 구분됩니다. 힌트가 없는 통은 기존과 동일하게 주소가 primary 그대로 — 빈 슬롯이 추가로 만들어지지 않습니다. 중구 첫 출시 9건(서소문·을지로입구·을지로6가·황학동 등)은 카카오 API 0~3m 반경 단일 랜드마크 케이스로 한정 (`public/data/hints/<district>.json`). 다른 자치구·중구 추가 통·운영자 curated hint는 점진적으로 채웁니다 (P4.3).

### Infrastructure
- 운영자가 hint를 효율적으로 큐레이션하도록 `bun run hint:scan <district>` 스크립트가 추가됐습니다. Kakao Local API로 각 통 좌표 50m 반경에 있는 관광명소·지하철·은행·주차장·편의점을 거리순으로 묶어 hint 초안과 함께 출력 — 매 통마다 카카오맵 검색 + 좌표 확인을 반복하지 않고 한 번에 후보를 본 뒤 선별합니다 (`KAKAO_REST_API_KEY` env 필요, 1Password CLI 연동 가능).

## [0.14.0] - 2026-05-07

### Changed
- 가까운/경유 휴지통 Top-3 거리선이 색·굵기뿐 아니라 패턴 자체로도 구분되도록 정리됐습니다. 1순위는 굵은 실선, 2순위는 대시(`8 6`), 3순위는 도트(`3 5`) — 색맹·고휘도 환경에서도 순위가 한눈에 보입니다. 라이트 모드에서는 거리선 색을 sky → **deep blue**(blue-800 `#1e40af`) 단일 톤으로 정착, sky 빈 마커·UserMarker와 hue가 분리되어 "경로선" 의미가 즉시 읽힙니다. rank 2/3 opacity·굵기를 함께 끌어올려 양 테마에서 또렷합니다. 목적지를 설정한 경유 경로 모드에서도 RouteLine이 rank 1 색을 따라가도록 통일되어 톤이 일관되며, 실선/대시/도트 패턴 차이로 활성 경로(RouteLine)와 후보(candidate)가 명확히 구분됩니다 (P2.20).

## [0.13.0] - 2026-05-06

### Added
- 7개 자치구 802개 휴지통이 한 지도에 들어와도 줌-아웃 시 화면이 마커로 도배되지 않도록 클러스터링이 적용됐습니다 — 줌 ≤14에서는 묶인 카운트 풍선(작게 부드러운 노랑/연두/초록)으로, 줌 ≥15부터는 휴지통 색·이모지 그대로의 개별 마커로 보입니다. 클러스터를 탭하면 자동으로 한 단계 더 확대해 펼쳐줍니다 (P3.1b).

### Performance
- 마커 수가 늘어도 한 번에 그리는 DOM 요소 수가 클러스터 풍선 수준으로 줄어 줌-아웃 상태의 panning이 가벼워졌습니다 (`leaflet.markercluster` `chunkedLoading`).

### Infrastructure
- Lighthouse CI 워크플로에 `paths-ignore` (`docs/**` · `**/*.md` · `.gitignore` · `.snapshot.config.json` · `LICENSE`) 추가 — CHANGELOG·snapshot SHA정합·docs-only PR이 더 이상 LH 4~5분을 잡지 않음. Hobby tier runner 큐 압력 감소. 더불어 `actions/cache@v4`로 Bun install 캐시 + Next.js `.next/cache`를 lockfile + 소스 해시 기반 키로 cache → 의존성 install 거의 즉시, Turbopack 증분 빌드도 인접 키로 hit 가능.

## [0.12.0] - 2026-05-05

### Changed
- 라이트 모드에서 그동안 다크 톤 그대로였던 필터 칩, 내 위치/직선/즐겨찾기/방향/공유 칩, 검색 입력·드롭다운, 통계 텍스트, 자치구 breakdown, 로딩 오버레이, toast(비강조), 데이터 출처 핀이 모두 라이트 콘트라스트로 정비되었습니다. 시스템 라이트 또는 ☀️ 토글로 라이트로 전환하면 헤더부터 지도 위 위젯까지 한 번에 일관 톤을 유지합니다.
- 라이트 타일 위에서 가까운 통 Top-3 점선이 너무 옅어 보이던 문제를 해결했습니다. 라이트 모드는 한 단계 진한 sky 스케일(rank1 sky-600 / rank2 sky-500 / rank3 sky-400)을 쓰고, 다크 모드는 기존 lighter 스케일을 유지해 양쪽 다 가독성이 좋습니다.

## [0.11.0] - 2026-05-05

### Added
- 처음 앱을 켰을 때 emerald 강조 토스트로 "🎯 출발과 🏁 목적지를 정하면 경유 휴지통을 알려드려요" 가이드가 6초 동안 한 번만 표시됩니다. 두 번째 방문부터는 자동으로 사라집니다.
- 출발/목적지 칩에 1️⃣/2️⃣ 순서 뱃지를 붙여 두 모드의 사용 순서를 시각적으로 명확하게 했습니다. 모드를 켠 동안에는 지도 하단에 보라색/장미색 고정 안내 배너 ("지도에서 출발/목적지 위치를 탭하거나 검색하세요")가 떠 있어, 칩 라벨 변화를 놓쳐도 무엇을 해야 할지 한눈에 보입니다.

### Fixed
- 검색 결과 드롭다운이 열려 있는 상태에서 손가락이 약간 빗나가 지도의 빈 영역을 누를 경우, 출발/목적지가 의도치 않게 그 좌표로 잡히던 문제 — 드롭다운이 열린 동안에는 지도 탭이 무시됩니다.

## [0.10.0] - 2026-05-05

### Added
- 서울 7개 자치구 휴지통 데이터(중구·서초·중랑·성북·마포·구로·노원, 총 802개)가 한 지도에 들어왔습니다. 처음에는 내 위치(또는 기본 중구)의 자치구 마커만 보이고, 지도를 다른 자치구 영역으로 옮기면 그 자치구 데이터가 자동으로 추가 로드됩니다. 데이터를 아직 발행하지 않은 18개 구는 빈 영역으로 남습니다.
- 자치구 데이터를 불러오는 동안 화면 중앙에 spinner + "자치구 로드 (N/7)" 오버레이가 첫 paint부터 7개 모두 로드 완료까지 끊김 없이 표시됩니다. 자치구별로 ✓(완료, emerald) / ⟳(진행 중, amber pulse) / ⏳(대기, neutral) 상태 아이콘이 한 줄씩 보이고 완료된 구는 마커 수가 우측에 함께 노출됩니다.
- 첫 진입 후 사용자가 지도/UI를 처음 만지는 순간(터치·마우스·휠·키) 또는 5초가 지나면, 발행 7개 자치구 데이터가 백그라운드(`requestIdleCallback`)로 합류해 panning 없이 802개를 한 번에 볼 수 있습니다 (첫 paint은 그대로 한 자치구 분량만 — Lighthouse 측정 window는 무인터랙션이라도 5초 fallback 시점까지 critical metrics 측정 거의 끝나 perf 영향 미미).
- 통계 바 아래에 발행 자치구 7개 모두를 마커수 내림차순으로 항상 보여줍니다 (`마포구 198 · 구로구 188 · …`). 아직 로드 안 된 구는 더 흐린 색으로, 로드 완료된 구는 정상 색으로 — 진행 상황을 한눈에 파악 가능. 통계 바 "전체 N개"도 첫 페인트부터 manifest 합계(현재 802개)로 고정.
- 자치구 데이터가 합류할 때마다 지도 하단 가운데에 토스트로 "○○구 N개"가 잠깐(1.5초) 떴다가 사라집니다. 7개 모두 들어오면 "✅ 전체 7개 자치구 802개 휴지통 로드 완료" 토스트가 emerald 강조 스타일로 4초 동안 표시 — 일반 토스트 대비 큰 글씨·진한 배경·ring으로 시선 강조.
- 지도 좌측 하단에 데이터 출처 + 버전(`📊 공공데이터포털 · v2026-05-05`)이 표시되고 클릭하면 공공데이터포털 「전국휴지통표준데이터」 페이지가 새 탭으로 열립니다.

### Changed
- 페이지 헤더·필터 바 배경도 라이트/다크 테마(시스템 또는 사용자 토글)에 맞춰 같이 전환됩니다 — 시스템 라이트인데 앱만 항상 다크로 보이던 회귀 수정.

### Fixed
- 자치구 prefetch가 panning으로 이미 본 구를 5초 뒤 다시 받아오며 토스트가 한 번 더 뜨던 문제 — prefetch가 이제 latest state를 읽어 이미 로드된 구를 건너뜁니다 (P3.2-fix1).
- 자치구 데이터 fetch가 404/네트워크 오류로 실패하면 로딩 오버레이가 영영 사라지지 않던 문제 — 실패한 자치구도 terminal로 집계해 오버레이가 dismiss되고, 오버레이 행에 `✗`(rose) 아이콘으로 실패 자치구를 표시합니다. panning으로 재시도해 성공하면 자동으로 풀립니다 (P3.2-fix2).

### Infrastructure
- `telegram-preview-notify` 워크플로에 `workflow_dispatch` trigger 추가 — GitHub이 `deployment_status` 이벤트를 drop한 케이스에서 Actions UI의 "Run workflow"로 SHA만 입력해 같은 알림을 수동 발사 가능. dispatch 시 SHA의 최신 deployment를 lookup해 normalize하므로 메시지 형식·라우팅·해시태그 모두 자동 trigger와 동일.

## [0.9.0] - 2026-05-05

### Infrastructure
- P3.1a 데이터 분할 foundation — `seoul-manifest.json`/`seoul-districts.geojson`/`districts/<code>.json` 3축 정적 자원, 클라이언트 point-in-polygon 자치구 판정. 현재는 중구만 데이터 보유, 24개 구는 자리 표시자. 25구 데이터 적재(P3.2)와 markercluster(P3.1b)·인접 prefetch(P3.1c)는 후속.

## [0.8.0] - 2026-05-05

### Added
- 휴지통 팝업의 `✓ 사용` 버튼으로 분리수거를 위해 추가로 걸은 거리·시간·횟수를 브라우저에 누적 저장하고 통계 바에서 바로 확인할 수 있습니다.

### Performance
- 첫 화면 로딩 시 OSM·CartoDB 타일 서버 5곳에 미리 연결을 시작하고(`ReactDOM.preconnect()`), Nominatim 검색 도메인은 DNS만 미리 풀어둡니다(`prefetchDNS`) — 첫 타일 도착이 100~300ms 빨라집니다.
- Sentry SDK를 메인 번들에서 분리해 lazy chunk로 전환했습니다. capture 함수가 호출될 때만 다운로드되고, 초기화는 `requestIdleCallback`으로 첫 페인트 이후로 미뤄집니다 — 메인 번들 ~90KB 감소, TBT 단축.

### Infrastructure
- `lib/geo.ts` · `lib/eta.ts` · `lib/url-share.ts` · `lib/favorites.ts` · `lib/savings.ts` · `lib/monitoring.ts` 순수 함수 105개 vitest 단위 테스트 (`bun run test`).
- Add Lighthouse CI GitHub Actions workflow for PR performance/a11y gating. 최소 점수 perf ≥ 0.65 / a11y ≥ 0.95 / best-practices ≥ 0.90 / seo ≥ 0.90 (PWA 카테고리는 LH12에서 제거).
- Sentry 클라이언트/서버 에러 모니터링 통합 (`@sentry/nextjs@10.51`, production-only + DSN 게이트 + dynamic import). geolocation 실패·`fetchBins` 에러·uncaught 브라우저 에러 자동 수집. `NEXT_PUBLIC_SENTRY_DSN` 미설정 시 안전한 no-op.
- 프로젝트 스킬 3종 추가 (`.claude/skills/trash-*`): `trash-feature-merge-flow` (P*.* 머지 9단계 자동화), `trash-codex-integrate` (Codex sandbox 산출물 정리), `trash-lighthouse-pr-watch` (PR 게이트 모니터링·머지). 다음 세션부터 자동 트리거.

## [0.7.0] - 2026-05-05

### Added
- 🧭 방향 칩으로 휴대폰 나침반을 켜면 사용자 위치 마커에 60° 부채꼴 cone이 실시간으로 회전해 "지금 보는 방향"을 즉시 파악할 수 있습니다 (iOS는 권한 prompt 1회, 거부 시 칩 비활성). 칩을 한 번 더 누르면 "헤드업" 모드로 전환되어 지도 자체가 사용자 시선 방향으로 따라 회전하며, 이때도 cone은 화면 위쪽을 가리켜 시선 메타포가 일관됩니다.
- 휴지통 팝업의 ☆ 버튼을 누르면 즐겨찾기로 표시됩니다. 칩 row의 ★ 즐겨찾기 필터를 켜면 즐겨찾기한 휴지통만 지도에 보이고, 같은 동선을 반복하는 사용자(출퇴근·산책 루틴)가 익숙한 통을 빠르게 찾을 수 있습니다. 즐겨찾기는 브라우저에 저장됩니다.
- 보행 속도를 슬라이더로 2~7 km/h 사이 0.5 단위로 자유롭게 조정할 수 있습니다. 칩을 누르면 슬라이더가 펼쳐지며, 속도에 따라 🐢/🚶/🏃 이모지가 자동으로 바뀝니다. URL 공유와 환경설정에 그대로 저장됩니다 (이전 'slow'/'normal'/'fast' 링크는 자동으로 3/4/5 km/h로 변환).

## [0.6.0] - 2026-05-04

### Added
- 주소·랜드마크 검색 박스로 출발/목적지를 빠르게 지정할 수 있습니다.
- 지원되는 기기에서는 마커·검색 결과·필터/모드 칩을 탭할 때 강도별 햅틱 진동(가벼운 토글 6ms, 선택 12ms, 좌표 확정 18ms 3단계)으로 선택감을 줍니다.
- 현재 필터, 지도 테마, 거리 모드, 보행 속도, 출발지·목적지를 URL로 공유하고 같은 상태로 바로 다시 열 수 있습니다.
- 가까운 휴지통과 경로 경유 후보를 상위 3개까지 rank별 크기로 읽기 전용 시각화하고, 각 후보에 굵기가 다른 점선으로 연결해 1~3순위를 한눈에 비교할 수 있습니다. 후보가 아닌 마커는 흐릿하게 처리해 후보만 도드라지게 표시합니다.

### Changed
- 휴지통 마커 색상을 라이트/다크 타일 모두에서 더 균형 있게 보이도록 파랑·초록·보라 톤으로 미세 조정했습니다.
- 저장된 타일 테마가 없는 첫 방문에서는 시스템 다크 모드 설정을 따라 기본 지도를 자동 선택합니다.

### Fixed
- 저장된 사용자 환경설정(거리 모드/타일 테마/보행 속도)이 있을 때 첫 페이지 로드 시 발생하던 hydration mismatch 경고 제거 — 첫 페인트는 기본값으로 그린 뒤 마운트 후 localStorage 값을 적용하도록 변경.

## [0.5.0] - 2026-05-02

### Added — Phase 2.8: ETA + 보행 속도 3단계
- `lib/eta.ts` — `WalkingSpeed = 'slow'|'normal'|'fast'`, `WALKING_SPEEDS` (3/4/5 km/h), `etaSeconds`, `formatEta` (초/분 자동)
- 새 cycle 칩 — 🐢 느림 3km/h ↔ 🚶 보통 4km/h ↔ 🏃 빠름 5km/h. localStorage 영속화
- 통계 바: `가까운 통 121m · 약 1분 49초` 형태로 거리·시간 결합 표시
- 경로(목적지) 모드도 동일 — `출발→통→목적지 354m · 약 5분 19초 (경유 +47m)`

### Added — Phase 2.7: 경로 최적화 (출발 → 휴지통 → 목적지)
- 새 칩 **🏁 목적지** — 클릭 시 destination tap mode, 다음 지도 클릭으로 목적지 설정 (set 후 "해제" 라벨)
- 기존 "🎯 지도 탭" → **"🎯 출발 탭"** rename
- 출발 + 목적지 둘 다 set되면 **detour 알고리즘**으로 경로상 가장 효율적인 휴지통 선택 (`dist(출발,통) + dist(통,목적지) - dist(출발,목적지)`)
- 새 청록 점선 경로 polyline (출발 → 경유 통 → 목적지) + 🏁 목적지 마커
- 통계 라벨: `출발→{통이름}→목적지 N m (경유 +M m)` — 총 거리 + 우회 비용 분리 표기
- distanceMode 따라 자동 (직선/격자)
- `lib/geo.ts`: `routePositions`, `detourCost`, `findOptimalDetour` 추가

## [0.4.0] - 2026-05-02

### Added — Phase 2.2: PWA 설치 가능
- `app/manifest.ts` — Next.js MetadataRoute.Manifest, `display: standalone`, theme/background `#0a0a0a`
- `app/icon.tsx` (192×192) + `app/apple-icon.tsx` (180×180) — `next/og` `ImageResponse`로 빌드 시점 PNG 동적 생성
- `layout.tsx` metadata: `appleWebApp` (status bar style black-translucent, title), `applicationName`, `formatDetection: { telephone: false }`
- iPad Safari → 공유 → "홈 화면에 추가" → 풀스크린 PWA 동작
- Android Chrome 자동 install banner

## [0.3.0] - 2026-05-02

### Added — Phase 2.4++: 라이트/다크 타일 토글
- 새 칩 **🌑 다크 ↔ ☀️ 라이트** — CartoDB Dark Matter ↔ OpenStreetMap Standard
- 다크 모드: 어트리뷰션·줌 컨트롤도 다크. 라이트 모드: leaflet 기본 (흰)
- `localStorage['tileTheme']` 영속화 — 야외 햇빛 → 라이트, 실내 → 다크 선호 기억
- `TILE_PRESETS` 객체로 깔끔하게 정리 (Map.tsx export `TileTheme` 타입)

### Changed — Phase 2.4+: 다크 테마 가독성 통일
- 모든 비활성 칩(FilterChips·LocateButton·격자·지도 탭) 흰색 → `bg-neutral-800 text-neutral-200`
- 활성 "전체" 칩 흰색으로 invert (가장 강한 selected 표현)
- Leaflet 줌 컨트롤·어트리뷰션 다크 톤 override (Tailwind layer/specificity 회피 위해 `!important`)

### Changed — Phase 2.4: 다크 타일 (CartoDB Dark Matter)
- 지도 배경 OSM Light → CartoDB Dark Matter (`{s}.basemaps.cartocdn.com/dark_all/...`) — 다크 헤더와 통일
- 어트리뷰션에 © CARTO 추가, subdomains `abcd` (4-shard 분산), maxZoom 19→20, `{r}` retina 지원
- 보라/파랑 마커와 주황 강조 ring이 다크 배경에서 더 도드라짐

### Added — Phase 2.6: Manhattan 거리 토글
- 새 칩 **📏 직선 / 📐 격자** (amber 활성) — 거리 선이 2점 직선 ↔ 3점 L자로 즉시 전환
- `findNearest`도 mode 따라 재계산 (격자 거리에서는 nearest가 다른 마커가 될 수 있음)
- `localStorage['distanceMode']` 영속화 — 다음 방문 시 마지막 선택 복원
- 같은 좌표·같은 마커: 직선 121m → 격자 154m (보행자 거리 근사)

## [0.2.0] - 2026-05-02

### Added — Phase 2.1+: 탭으로 위치 지정 (iOS Safari fallback)
- 새 칩 **🎯 지도 탭** — 모드 토글 후 지도 한 번 클릭으로 사용자 위치 설정 (cursor `crosshair`, 클릭 후 모드 자동 종료)
- GPS 권한 거부 / 신호 없음 / 타임아웃 별 에러 메시지 분기, 각 분기에서 탭 모드 우회 안내 포함
- iPad Safari에서 위치 권한 거부됐을 때, 설정 들어가지 않고도 앱 사용 가능 / 데스크톱에서 시뮬레이션 도구로도 사용

### Added — Phase 2.1: Geolocation
- "📍 내 위치" 버튼 — 권한 요청 → 지도가 사용자 위치로 panTo(zoom≥16, 0.6s flyTo) + 펄스 점 표시
- **실시간 추적**: `watchPosition`으로 사용자가 움직일 때마다 마커·강조·거리 라벨 자동 갱신 (clearWatch on toggle off + unmount)
- 가장 가까운 휴지통 자동 강조 — `CircleMarker` 픽셀 고정 ring(주황 #f97316 + 노랑 fill) + `highlight-pulse` 애니메이션
- **거리 선** — 사용자 위치 ↔ 가장 가까운 통 사이 dashed sky-300 polyline (`pathPositions`로 mode별 모양 결정)
- 거리 라벨 in 통계 바 ("가까운 통 121m (이름)") — m/km 자동 전환
- `lib/geo.ts` — Haversine + Manhattan + `distanceMeters` 디스패처 + `findNearest(mode)` + `pathPositions(mode)` (UI 토글은 추후)
- 권한 거부 / 브라우저 미지원 시 칩에 에러 메시지

### Infrastructure — Tier 2 검증 환경
- GitHub private repo `jetsongdev/junggu-trash-map` 생성 + 첫 push
- Vercel 프로젝트 link + Production deploy → https://junggu-trash-map.vercel.app
- **GitHub auto-deploy 연결** — `git push`만으로 production/preview 자동 배포 (16~22초 빌드)
- **Vercel Analytics + Speed Insights 설치** — RUM(Real User Monitoring), Core Web Vitals 자동 수집
- iPad/모바일에서 HTTPS로 접속해 실제 GPS 권한·watchPosition 동작 검증 가능

## [0.1.0] - 2026-04-29

### Added — Phase 0: PoC 부트스트랩
- Next.js 16 + Bun + Tailwind v4 + Leaflet 기반 중구 휴지통 지도 PWA 프로토타입
- 모바일 우선 헤더(다크) + 라이트 OSM 지도 레이아웃
- 휴지통 타입별 마커 색상·이모지 (🗑️ 일반 / ♻️ 재활용 / 🚬 담배꽁초 / 📍 기타)
- 다중 선택 필터 칩 + "📍 N / 전체 M개" 통계 바
- 마커 클릭 시 이름·주소·타입·관리기관 팝업

### Added — Phase 1: 실데이터 연동
- 표준데이터 CSV → JSON 변환 스크립트 (`scripts/transform.ts`) — 같은 좌표 다중 행을 그룹화, 자치구 무관
- 중구 가로휴지통 117행 → 59 그룹 마커 (혼합 56·일반-only 3)
- 혼합 마커 시각화: 보라(`#a855f7`) + 이중 이모지 `🗑️♻️`
- README에 실데이터 교체 가이드 한 단락

### Changed — Phase 1
- 휴지통 타입 시스템 축소: 4종 → 표준데이터 2종(`일반 | 재활용`). `TrashBin.type` → `TrashBin.types: BinType[]`
- 필터 칩 4 → 3개 (전체 / 일반 / 재활용)
- 팝업에 type 칩 배열 표시, 도로명 없으면 지번으로 fallback

### Performance
- `BinMarker`의 `L.divIcon`을 모듈 스코프 캐시로 (59 인스턴스/렌더 → 3 고정)
- `BinMarker`에 `React.memo` 적용 — 필터 토글 시 변경 없는 마커 skip
- `fetchBins`에 `cache: 'force-cache'` (정적 JSON, 빌드 시점에만 갱신)

### Fixed
- `scripts/transform.ts` 좌표 정렬 비교자 버그 (`*1e6 + ...` 매그니튜드 → 표준 튜플 비교 `a-b || c-d`)
- 스키마 마이그레이션 시 옛 캐시 응답으로 `bin.types`가 undefined 되던 문제

### Infrastructure
- `docs/tasks.md` — 작업 큐 + 결정 포인트 + 함정 누적 단일 소스
- `docs/snapshots/` — 마일스톤별 모바일 스크린샷 누적 시스템
- `~/.claude/skills/snapshot/` — 글로벌 스냅샷 스킬 (프레임워크 무관, config 기반)
- `CLAUDE.md` — 세션 진입 가이드 (작업 큐 / 시각 히스토리 / CHANGELOG 포인터)

[Unreleased]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.19.1...HEAD
[0.19.1]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.19.0...v0.19.1
[0.19.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.18.1...v0.19.0
[0.18.1]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.18.0...v0.18.1
[0.18.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/jetsongdev/junggu-trash-map/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/jetsongdev/junggu-trash-map/releases/tag/v0.1.0
