# 중구 휴지통 지도 — 작업 큐

> 이 파일은 Claude가 매 세션 시작 시 읽고 작업 우선순위를 판단하는 1차 소스.
> 사람과 에이전트 모두 직접 편집 가능. 컨벤션은 파일 끝 「운영 규칙」 참고.

## 현재 상태 (2026-05-09)

- **Phase**: 3 마무리 + Phase 4 data 한 칸 + I.6 a11y 라운드 2차 완료. P3.1a/b 머지(802 bins 클러스터링), P3.2 7개 자치구 데이터, P3.1c는 obsolete. P2.20 색맹 친화 거리선 v0.14.0 / P4.3 위치 힌트 v0.15.0 / P2.22+P2.23 모바일 툴바·HUD v0.16.0 / P2.24 ETA 인라인 v0.17.0 / P3.3 25구 셀렉터 그리드 v0.18.0 / **P2.19+P2.21 첫-사용 힌트 5종 PR #38 진행 중** (share/favorite/headsUp/grid/speed + loading toast sequencing) / **P3.4 자치구 폴리곤 outline merged** (viewing district outline + 중앙 라벨, light/dark/selector-open 3장 캡처). **I.6 a11y 1차 + P3.3-fix1 empty-toast 스냅샷 merged** (axe 0 violations / 42 passes — region landmark + destination aria-label 정리 2건). **I.6 a11y 2차 완료** (focus-visible ring 공통화, `=`/`-` 키보드 지도 zoom, Leaflet 마커/클러스터 스크린리더 라벨, prefers-reduced-motion에서 fly/zoom·pulse/spin 감속). **I.7 release prebump 운영 중** (prebump on PR + finalize `release:*` 라벨 게이트 운영). 다음 후보: P4.1(타 종류 통).
- **사용자 환경 영속화** (`localStorage`): `distanceMode` (직선/격자), `tileTheme` (다크/라이트, **빈 값일 때 시스템 prefers-color-scheme 자동 감지**), `walkingSpeed` (km/h, 2~7 step 0.5), `favorites` (즐겨찾기 bin id), `savings` (누적 보행거리·시간·횟수)
- **마커 색**: 일반 `#60a5fa` (blue-400), 재활용 `#34d399` (emerald-400), 혼합 `#c084fc` (violet-400) — 라이트/다크 양 타일에서 균형
- **Roadmap 확장**: Phase 3 (25개 구) · Phase 4 (데이터 확장: 타 종류 통/사용자 제보/사진) · Phase 5 (실제 보행 경로 + TTS) · 인프라/품질 cross-cutting (i18n 남음)
- **Stack**: Next.js 16 (Turbopack) · Bun · TypeScript strict · Tailwind v4 · Leaflet + OSM/CartoDB · Vercel Analytics + Speed Insights · Sentry (lazy) · Lighthouse CI
- **Test**: `bun run test` (vitest 4.x) — `lib/geo.ts`·`lib/eta.ts`·`lib/url-share.ts`·`lib/favorites.ts`·`lib/savings.ts`·`lib/monitoring.ts` 순수 함수 105개
- **Dev**: `bun run dev` → http://localhost:3000 (점유 시 자동 3001)
- **Build**: `bun run build` 통과
- **Deploy**: `git push` → 자동 Vercel build → https://junggu-trash-map.vercel.app (16~22초). 수동 `vercel deploy`는 hotfix 시에만
- **Release**: 현재 `v0.19.1`. PR에 `release:patch/minor/major` 라벨을 붙이면 `.github/workflows/version-bump.yml`이 PR head에 `chore(release): vX.Y.Z (PR #N)` prebump commit을 미리 붙이고, main merge 후 merge commit에 annotated tag + GitHub Release + PR 코멘트를 생성한다. Vercel Ignored Build Step은 `.md only skip` 가드로 운영한다. 정책 본체는 `CLAUDE.md` `## Release`. 라벨 없으면 skip (인프라·docs PR은 그대로)
- **PWA**: `app/manifest.ts` + 동적 `icon.tsx`/`apple-icon.tsx` (next/og), iOS 풀스크린 메타 — Safari "홈 화면에 추가"로 풀스크린
- **Data**: `public/data/seoul-manifest.json` (25구 메타, version `2026-05-05`) + `public/data/seoul-districts.geojson` (25구 폴리곤, ~56KB) + `public/data/districts/<code>.json` (**7개 자치구 802 그룹**: 중구 59 / 서초 83 / 중랑 27 / 성북 119 / 마포 198 / 구로 188 / 노원 128). 18개 구는 `binCount: 0` 자리 표시자 (공공데이터 미발행).
- **Geolocation**: `watchPosition` 실시간 + Haversine/Manhattan `findNearest`/`findOptimalDetour` + sky/cyan 점선. 출발 + 목적지 모두 set 시 경유 휴지통 detour 알고리즘
- **iOS fallback**: 🎯 출발 탭, 🏁 목적지 탭 — 두 탭 모드 mutually exclusive, 한 클릭으로 좌표 지정
- **칩 스타일**: 비활성 = `bg-neutral-800` 다크 그레이. 활성 = 기능별 색 (전체=흰, 일반/재활용=색별, 위치=sky, 격자=amber, 출발 탭=violet, 목적지=rose, 방향 cone=sky·헤드업=violet, 속도 슬라이더=emerald, 즐겨찾기=amber)
- **Lighthouse 점수** trend: PR #8 X.1 0.75 → P3.1a 0.68 → P3.2 0.65. 임계치 perf ≥0.62 (P3.2 push에서 0.70 → 0.62로 ratchet down — 다구 panning 인프라 추가 비용). a11y ≥0.95 / best-practices ≥0.90 / seo ≥0.90 유지. P3.1b markercluster 추가 (~10KB gzip) 후 PR Lighthouse 게이트 결과 확인 필요. P3.1c 머지 후 perf 별도 라운드 필요.

---

## ✅ Done

### Phase 0 — PoC 부트스트랩
- [x] Next.js 16 + Bun + Tailwind v4 부트스트랩
- [x] `TrashBin` 타입 + `TYPE_STYLE` 상수 (`src/lib/types.ts`)
- [x] 정적 JSON 로더 + 필터 유틸 (`src/lib/data.ts`)
- [x] Mock 데이터 15개로 PoC 동작 확인
- [x] Map / BinMarker / BinPopup / FilterChips 컴포넌트
- [x] `next/dynamic({ ssr: false })`로 Leaflet SSR 회피
- [x] Tailwind 다크 헤더 + 라이트 맵 콘트라스트
- [x] 모바일 터치타겟 ≥44px, 칩 wrap
- [x] README에 실데이터 교체 가이드

### Phase 1 — 실데이터 연동
- [x] **P1.1** 표준데이터 다운로드 (`서울특별시_중구_휴지통_20260414.csv`, 117행, UTF-8 BOM)
- [x] **P1.2** `scripts/transform.ts` — quote-aware CSV parser, BOM strip, 좌표 그룹핑, types 머지, id 자동발번
- [x] **P1.3** 좌표 sanity check — 117/117 좌표 보유, WGS84 정상
- [x] **P1.4** 결측/매핑 실패 행 방어 (skip + warn) + `styleFor` defensive 처리
- [x] **schema 그룹화**: `TrashBin.type` → `TrashBin.types: BinType[]`. 칩 4개 → 2개 (일반/재활용)
- [x] **혼합 마커 디자인**: 단일=색별 / 혼합=보라(`#a855f7`)+`🗑️♻️` 이중 이모지
- [x] 빌드/브라우저 검증 — 59 마커, 필터 토글(일반=59 / 재활용=56 / 전체=59), 팝업 type 칩 다중 표시

### Phase 2 — UX 다듬기
- [x] **P2.1** Geolocation API + 가장 가까운 휴지통 강조 — `lib/geo.ts` (Haversine + Manhattan + DistanceMode), LocateButton/UserMarker, Map에 panTo + 픽셀 ring + 거리 선 (Polyline), `watchPosition`으로 실시간 갱신, 거리/이름 라벨. Manhattan UI 토글은 추후.
- [x] **P2.1+ iPad fallback** — 🎯 지도 탭 모드 (한 번 클릭으로 위치 지정), 권한 거부/타임아웃/미지원 별 에러 메시지 분기, react-leaflet `MapContainer.className` 함정 회피 (wrapper div).
- [x] **인프라 — Tier 2** — GitHub repo `jetsongdev/junggu-trash-map`, Vercel auto-deploy (push trigger), Vercel Analytics + Speed Insights 마운트.
- [x] **개발 환경 정체성** — `~/.gitconfig` global = jetsong.dev, `~/Documents/workspace/saluscare/` overlay = work. `includeIf`로 디렉토리별 자동 분기.
- [x] **P2.6** Manhattan 거리 토글 UI — Codex 위임 작업, `page.tsx` 한 파일에서 setter 활성화 + amber 칩 + localStorage 영속화. 직선 121m → 격자 154m (명동성당 좌표).
- [x] **P2.4** 다크 타일 — `<TileLayer>` URL을 CartoDB Dark Matter로 교체, 다크 헤더와 통일. subdomains 4-shard, maxZoom 20, retina 지원.
- [x] **P2.4+** 다크 테마 가독성 — 비활성 칩 다크 그레이, 활성 "전체" 흰색 invert, Leaflet 줌·어트리뷰션 다크 override (`!important`).
- [x] **P2.4++** 라이트/다크 타일 토글 — `TILE_PRESETS` 객체, `tileTheme` state + localStorage, `.tile-theme-dark` wrapper로 leaflet UI 다크화 가드. 칩 한 개로 전환.
- [x] **P2.2** PWA manifest + iOS 풀스크린 메타 — `app/manifest.ts` + `icon.tsx`/`apple-icon.tsx` 동적 PNG (next/og), `appleWebApp` metadata. Safari "홈 화면에 추가"로 풀스크린 PWA.
- [x] **P2.7** 경로 최적화 (출발+목적지+경유 통) — `findOptimalDetour` 알고리즘, 🏁 목적지 칩, RouteLine(청록), DestinationMarker, 통계 바 분기.
- [x] **P2.8** ETA + 보행 속도 3단계 — `lib/eta.ts`, cycle 칩(🐢/🚶/🏃, 3/4/5 km/h), localStorage 영속화, 통계 바 시간 표시 (nearest·route 모두).
- [x] **P2.12** 주소·랜드마크 검색 — Nominatim 검색 박스, 300ms debounce, 출발/목적지 즉시 지정 + 지도 이동
- [x] **P2.11** 마커 색상 미세 조정 — blue/emerald/violet 톤을 라이트·다크 타일 모두에서 균형 있게 재조정
- [x] **P2.10** 가까운/경유 휴지통 Top-3 후보 시각화 — 목적지 없으면 nearest 3개, 목적지 있으면 detour 3개를 rank별 크기로 표시. Top-3 각각에 굵기·색이 다른 점선 연결, 비후보 마커는 opacity 0.25로 dimming해 후보만 도드라지게.
- [x] **P2.15** 시스템 다크 모드 자동 감지 — 첫 방문 기본값만 `prefers-color-scheme` 반영, 이후 명시 토글 우선
- [x] **P2.16** 터치 햅틱 피드백 — 지원 디바이스에서 마커·검색·필터/모드 칩 탭 + 좌표 확정에 강도별 진동(`lib/haptic.ts`, TAP 6ms / SELECT 12ms / CONFIRM 18ms)
- [x] **P2.5** URL 쿼리스트링 공유 — 영문 alias(`general,recycle`) 기반 `types/theme/mode/speed/origin/dest` URL을 우선 적용하고, 현재 필터·환경·좌표 상태를 공유 링크로 복사/공유
- [x] **P2.13** 방향 화살표 — `deviceorientation` 기반 부채꼴 cone (60°) + 🧭 토글 칩 opt-in. iOS는 `requestPermission`, Android는 즉시 시작. `webkitCompassHeading` 우선, fallback `(360 - alpha) % 360`. 권한 거부 시 칩 비활성화. 헤드업 모드(P2.13b)는 지도 자체를 사용자 시선 방향으로 회전 (`leaflet-rotate@0.2.8`).
- [x] **P2.9** 보행 속도 사용자 정의 km/h — cycle 칩 → 슬라이더(2~7 km/h, 0.5 step). 칩 클릭으로 슬라이더 panel 토글, emoji는 임계 자동(🐢/🚶/🏃). URL/localStorage 호환 (legacy preset 'slow'/'normal'/'fast' → 3/4/5).
- [x] **I.1** 테스트 인프라 — vitest 도입, `lib/geo.ts`·`lib/eta.ts`·`lib/url-share.ts` 순수 함수 59개 커버
- [x] **I.2** 에러 모니터링 — Sentry 연동, production-only 초기화, geolocation/fetch 에러 캡처, global-error 추가
- [x] **I.3** Lighthouse CI — PR마다 PWA/접근성/성능 점수 회귀 차단
- [x] **I.7** 릴리스 자동화 prebump on PR — `.github/workflows/version-bump.yml` 도입, `release-on-merge.yml` 폐기. `release:patch|minor|major` 라벨이 붙은 PR이 open/sync/label 시점에 PR head로 `chore(release): vX.Y.Z (PR #N)` commit을 force-push (멱등, main 기준 version 재계산으로 동시 PR race 회피). squash merge 1회에 사용자 변경 + version bump가 함께 들어가 prod에 footer 버전이 즉시 반영됨. main merge 후 finalize job이 `merge_commit_sha` 기준으로 annotated tag + GitHub Release + PR 코멘트만 추가 (rebuild 없음). `scripts/bump-version.ts` 인터페이스·vitest 17개 그대로 재활용. Vercel Ignored Build Step은 `.md only skip` 가드로 교체 운영. 첫 cut: v0.18.1 (PR #37).
- [x] **P2.14** 즐겨찾기 — popup ☆/★ 토글로 휴지통 표시, 칩 필터로 즐겨찾기만 보기. localStorage `favorites` 영속화 (comma-separated id), `lib/favorites.ts` 순수 함수 + vitest 13개
- [x] **P2.18** 통계바 정보 분리 — `locateError`/`error`를 우하단 카드(접힘 시 숨겨짐) 안에서 빼서 빨간 토스트(`variant: 'error'`, role=alert, ⚠ prefix, 6초)로 렌더. 통계바(우하단 카드 펼침 영역)는 route/savings 등 성공 상태만 표시. P2.23-fix5 status overlay 통합 후 발견된 회귀(접힘 시 에러 미노출)와 함께 한 라운드에 처리. (UX U4)
- [x] **P2.20** Top-N 거리선 시각 분리 — rank 1 굵은 실선(weight 4) / rank 2 대시(`8 6` weight 3) / rank 3 도트(`3 5` weight 2.5). `DISTANCE_LINE_STYLE`에 옵셔널 `dashArray` 필드 추가, 라이트는 **blue-800 `#1e40af` 단일 톤**(sky 마커류와 hue 분리), 다크는 P2.11 sky 톤 유지. `RouteLine`도 `tileTheme` prop 받아 rank 1 색 따라가면서 **실선화** → destination 모드에서도 색 일관 + candidate(dash/dot)와 패턴 분리. 색맹·소화면 가독성 보강(I.6 a11y 일부 흡수). snapshot `31-topn-distance-pattern/`(1차) → `32-topn-light-slate-polish/`(slate 시도) → `33-topn-deep-blue-final/`(최종, light·dark·destination 3장).

### Phase 3 — 25개 구 확장
- [x] **P3.1** 데이터 분할 전략 결정 — 자치구 단위 정적 JSON + GeoJSON 폴리곤 클라이언트 판정 + 3-PR 분할 (foundation → cluster · prefetch). spec: `docs/superpowers/specs/2026-05-05-p3-1-data-partitioning-design.md`.
- [x] **P3.1a** Foundation — `seoul-manifest.json`/`seoul-districts.geojson`/`districts/<code>.json` 3축 자원, `point-in-district`/`districts`/`fetchDistrict` 모듈, page.tsx 부트 시퀀스. 25구 데이터·markercluster·prefetch는 후속.
- [x] **P3.2** 25구 데이터 transform — 공공데이터포털 표준데이터 발행분 7개 자치구 (중구·서초·중랑·성북·마포·구로·노원, 총 802 bins) `transform.ts` 일괄 변환 + manifest binCount/version 갱신. 다른 18개는 미발행 → 자리 표시자 유지. + `<MapMoveHandler>` panning 트리거: 지도 center가 다른 폴리곤에 진입하면 그 자치구 자동 fetch + active set 추가.
- [x] **P3.2-fix1** prefetch stale closure — `districtsCacheRef`/`activeFetchesRef`/`failedDistrictsRef`로 latest state 읽도록 수정. 더 이상 mount 시점 스냅샷에 묶여 panning으로 로드한 구를 재fetch하지 않음.
- [x] **P3.2-fix2** 로딩 오버레이 fail terminal — `failedDistricts` Set 추가, 3개 catch 블록 모두 실패 등록, `terminalPopulatedCount = loaded ∪ failed`로 `fullyLoaded` 산정 → 실패 시에도 오버레이 dismiss. overlay 행에 `✗` 빨강 아이콘으로 실패 표시.
- [x] **P2.17** onboarding & 모드 명확화 — 첫 방문 1회 emphatic 토스트 (🎯+🏁 사용법 안내, localStorage `onboarded` 가드), 출발/목적지 칩에 1️⃣/2️⃣ 뱃지, tap mode 활성 시 하단 고정 banner ("지도에서 탭하거나 검색하세요"), 검색 드롭다운 열려있을 때 `handleMapClick` 가드로 빈 영역 오탭 방지 (UX U1+U2+U3)
- [x] **P3.1c** 인접 자치구 prefetch — **obsoleted by P3.2 bulk prefetch**: 첫 user interaction 후 `requestIdleCallback`로 모든 populated 자치구를 일괄 fetch (page.tsx 274~378)가 strictly broader. 7개 자치구 중 junggu의 `adjacent`에 populated된 건 mapo 1개뿐 → adjacency-based는 사용자 가치 0. 25구가 다 채워지면 bulk가 too aggressive해질 때 재평가.
- [x] **I.5** 라이트 모드 UI 정비 — Tailwind v4 `@custom-variant dark (.dark &)` 도입, root div에 `tileTheme === 'dark'` 시 `dark` 클래스 부착. inactiveChip / 헤더 / 섹션 / 속도 슬라이더 / 통계 텍스트 / breakdown / 로딩 오버레이 / toast 비강조 / 데이터 출처 핀 / SearchBox 입력+드롭다운 / LocateButton / FilterChips 12+ 표면을 양 테마 일관 콘트라스트로 분기. snapshot `29-light-mode-polish/` (light · dark · light-search 3장).
- [x] **P3.1b** markercluster 도입 — `leaflet.markercluster@1.5.3` + `@types/leaflet.markercluster`. `MarkerClusterGroup` 래퍼는 `@react-leaflet/core`의 `createLayerComponent` + `extendContext({ layerContainer })` 패턴 (LayerGroup과 동일). `disableClusteringAtZoom: 15` + `chunkedLoading` + `spiderfyOnMaxZoom: false` + `showCoverageOnHover: false`. HighlightRing/DistanceLine/RouteLine은 cluster 바깥 — Top-3/헤드업/즐겨찾기 줌 ≥15에서 회귀 없음. snapshot `30-markercluster/`.
- [x] **P2.22** 모바일 툴바 압축 — 칩을 3개 시각 그룹(필터/경로/보기)으로 묶고, 아이콘 only로 텍스트 축약 (📍, 📏, 1️⃣🎯, 2️⃣🏁, 🧭, ☀️, 🔗). Leaflet 줌 컨트롤을 `<ZoomControl position="bottomleft" />`로 좌하단 명시, 데이터 출처 배지를 `bottom-7 right-2` 우하단으로 이동. 메뉴 영역 화면 점유율 ~50% → ~33%로 감소. snapshot `31-mobile-toolbar-compact/`.
- [x] **P2.22+** 데이터 현황 + 출처 통합 토글 — 메뉴의 합계/자치구 분포를 우하단 출처 카드에 통합. 접힘=한 줄 (`📊 v2026-05-05 · 📍 802/802 ▴`), 펼침=자치구 7행 + status + 출처 링크. `bg-white/70` 더 투명. `localStorage.statusOverlayCollapsed`로 영속화. 메뉴 영역 ~33% → ~30% 추가 압축. snapshot `32-status-overlay-toggle/`.
- [x] **P2.23** HUD 재배치 — 필터를 좌상단 floating row(✓/🗑️/♻️ 아이콘 only)로, 즐겨찾기/직선·격자/나침반을 우상단 floating stack으로, 출발/목적지를 segmented 한 박스로 통합(1️⃣/2️⃣ 뱃지 제거, 슬롯 위치로 순서 시사). 칩 형태 `rounded-full` → `rounded-md` HUD 스타일, 5색 accent state(amber/sky/violet/rose/emerald) + 15% fill + ring + ✓ corner badge. 우하단 카드 투명도 `/70` → `/45`. 메뉴 영역 ~30% → ~20% (검색 + 한 줄 칩). HUD 헬퍼: `hudInactive`/`hudChip`/`hudIconBtn`/`hudFloatingGroup`. snapshot `33-hud-rearrange/` (default → fix1 → fix2 → fix3 4 라운드 누적).
- [x] **P3.3** 25구 셀렉터 그리드 — 우상단 floating stack에 🗺 칩(`hudIconBtn`, teal accent) → 5x5 grid 패널. 25구 / 25칸 / 빈 칸 0(중랑·송파 한 칸씩 어긋남 수용). populated 7구는 sky 톤 + binCount, empty 18구는 neutral dim. 현재 viewing district는 amber ring. populated 탭 → `flyToBounds(bbox, { maxZoom: 15 })` (P3.2 panning auto-add가 fetch 자연 트리거), empty 탭 → `flyTo(centroid, 14)` + info 토스트 "{name}는 아직 공공데이터가 발행되지 않았어요". 패널 외부 탭/Esc 닫힘. 코드: `lib/district-grid.ts` 순수 함수 4개 + vitest 6개, `components/DistrictSelector.tsx`. Codex 위임 후 surgical fix 2건(mapRef 리네임 롤백·populated 토스트 제거). snapshot `40-district-selector/` (default + opened 2장, empty-toast는 dev 환경 timing 충돌로 별도 세션 — P3.3-fix1). spec: `docs/superpowers/specs/2026-05-09-...`.
- [x] **P3.3-fix1** empty-toast 스냅샷 재캡처 — Playwright `evaluate`에서 `window.setTimeout`을 가로채 `delay === 3000`만 무시하도록 monkey-patch → 토스트가 사라지지 않는 동안 `browser_take_screenshot`. 코드는 안 건드림. `docs/snapshots/40-district-selector/screenshot-empty-toast.png` (다크 테마, 동대문구 탭 → flyTo + 하단 안내 토스트).
- [x] **P3.4** 자치구 폴리곤 outline + 폴리곤 중앙 라벨 — 현재 viewing district 영구 outline + 폴리곤 중앙 자치구 이름. 새 컴포넌트 `components/DistrictOutline.tsx`: react-leaflet `<GeoJSON>` 두 겹 stack(halo + inner). 다크 = 검정 halo(weight 4, opacity 0.55) + amber-400 dashed inner(weight 1.5) / 라이트 = 흰 halo(weight 5, opacity 0.9) + blue-800(`#1e40af`) dashed inner(weight 2.5) — Top-3 거리선과 동일 톤으로 시각 일관성. `key={code}-{halo|inner}-{tileTheme}`로 코드/테마 변경 시 강제 remount(react-leaflet `data` prop immutable). 자치구 이름은 inner GeoJSON에 `bindTooltip(name, { permanent: true, direction: 'center', interactive: false })`. CSS `.district-name-tooltip-{light\|dark}` — 배경/테두리 제거 + 강한 text-shadow halo. 라이트 글자색 `#1e3a8a`(blue-900) — outline blue 톤 매칭. TileLayer 직후 첫 레이어로 깔려 마커·distance line·route 모두 outline 위에 살아있음. **함정 1**: 라이트 1차 amber-700 단일 stroke(`#b45309`)는 OSM 타일과 톤 충돌로 안 보임 → halo+inner stack이 정답. **함정 2**: 우상단 HUD 라벨은 자치구명 길이로 wrapper 너비를 흔들어 별로 → permanent tooltip이 정답. **함정 3**: 라이트 slate-800 inner 1.5px도 부족 → blue-800 2.5px + halo 5px로 보강. snapshot `41-district-outline/` (light · dark · selector-open 3장, 라운드 3 후 갱신).

### Phase 4 — 데이터 확장
- [x] **P4.3** 위치 힌트 텍스트 — 사진 원안 폐기. 운영자가 카카오·Naver 보면서 손으로 단 한 줄(≤80자) 큐레이션 텍스트로 재정의. `public/data/hints/<district>.json` 별도 파일(`{ version, hints: { binId: text } }`) + 자치구별 lazy fetch (`lib/hints.ts`의 `fetchHints` 404·네트워크 에러 EMPTY fallback) + `mergeHints` 순수 immutable 머지로 `TrashBin.locationHint?: string` 런타임 주입. transform.ts와 격리 — 데이터 갱신 시 hint 안 사라짐. BinPopup: hint 있으면 주소 위 primary(text-neutral-700, sm) + 주소가 secondary(text-neutral-500, xs)로 후퇴, 없으면 현 상태 유지(빈 placeholder 안 만듦). 출시는 hints 빈 객체로 ship — 운영자가 카카오맵 검증 후 점진적 추가. 분업 구조: A(types+lib/hints+test) · B(BinPopup) · C(시드 인프라) 완전 병렬 / D(page.tsx 통합 3 site) · E(snapshot+docs) 통합 단계. snapshot `34-location-hint/` 4장은 dev 세션에서 placeholder 시드로 캡처 — 시각 검증 기록용. spec/plan: `docs/superpowers/specs/2026-05-08-...` & `docs/superpowers/plans/2026-05-08-...`.

### 실험적 (선택)
- [x] **X.1** "오늘 절약한 보행거리/시간" 누적 — 휴지통 팝업의 `✓ 사용`으로 추가 거리·시간·횟수를 localStorage에 누적하고 통계 바에 표시. 분리수거 동기부여

---

## 🔜 Open — Phase 2 잔여 (nice-to-have)

핵심 기능 다 들어가있고, 아래는 사용성·확장성 강화. 가벼운 → 무거운 순:

- [ ] **P2.3** 클러스터링 — `leaflet.markercluster`. 마커 100+ 시 lag 방지. **25구 확장(Phase 3) 전엔 ø**
- [x] **P2.18** 통계바 정보 분리 — `locateError`/`error`를 우하단 카드(접힘 시 숨겨짐) 안에서 빼서 빨간 토스트(`variant: 'error'`, role=alert, ⚠ prefix, 6초)로 렌더. 통계바(우하단 카드 펼침 영역)는 route/savings 등 성공 상태만 표시. P2.23-fix5 status overlay 통합 후 발견된 회귀(접힘 시 에러 미노출)와 함께 한 라운드에 처리. (UX U4)
- [x] **P2.19+P2.21** 첫-사용 힌트 5종 — share(origin+dest 동시 set) / favorite(첫 ☆ 추가) / headsUp(cone→head-up 전환) / grid(euclidean→manhattan) / speed(슬라이더 첫 열림) 5개를 `localStorage hint:<key>` 게이트로 1회씩 노출. 4초 info 토스트 (기본 1.8s vs error 6s 사이). `lib/first-use-hints.ts` 순수 함수 4개 + vitest 8개. page.tsx에 `maybeShowHint(key)` 헬퍼 + 5 트리거 wiring(useEffect 1, 핸들러 4)
- P2.19 원안: hidden feature 발견 경로 — origin+dest 동시 set 시 공유 버튼 힌트, ☆/헤드업/격자 첫 사용 시 안내 (UX U5+U8)
- P2.21 원안: 보행 속도 슬라이더 초기 안내 — 슬라이더 첫 토글 시 "현재 4 km/h (통상 보행)" 힌트 (UX U9)
- [ ] **P2.24** Liquid Glass 디자인 언어 — Apple iOS/iPadOS 26 Liquid Glass 시각 언어를 floating HUD/우하단 카드/메뉴 칩에 반영. 핵심: heavy backdrop-blur(`backdrop-blur-xl ~24px`) + `backdrop-saturate-150~180` + 내부 highlight gradient(상단 lighter / 하단 darker) + 외부 soft shadow + 미세 lensing(가능하면 SVG turbulence, 성능 비싸면 CSS만). 다크/라이트 양 테마에서 마커 가독성 + Lighthouse perf ≥0.62 유지. 참고: [WidgetKit Liquid Glass](https://github.com/artemnovichkov/xcode-26-system-prompts/blob/main/AdditionalDocumentation/WidgetKit-Implementing-Liquid-Glass-Design.md) · [Apple TechnologyOverviews — Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass) · [Adopting Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass). 적용 대상: 좌상단 필터 박스 / 우상단 모드 stack / 메뉴 한 줄 칩 / 우하단 status 카드 / 검색박스 / 토스트.

---

## 🌏 Open — Phase 3: 25개 구 확장

자치구별 정적 JSON + 클라이언트 point-in-polygon 판정으로 결정. spec: `docs/superpowers/specs/2026-05-05-p3-1-data-partitioning-design.md`. P3.1은 3-PR로 분할 (a foundation → b markercluster · c 인접 prefetch).

---

## 📦 Open — Phase 4: 데이터 확장

표준 휴지통 데이터 외 종류와 사용자 제보·사진까지.

- [ ] **P4.1** 타 종류 통 합치기 — 담배꽁초·의류수거함·폐의약품함 (별도 공공 데이터셋). 필터 칩에 추가, transform 스크립트 확장
- [ ] **P4.2** 사용자 제보 기능 — 없음/넘침/위치 오류. 익명, Vercel KV 또는 Postgres. 관리자 페이지(P3 결정 포인트) 트리거 가능

---

## 🧭 Open — Phase 5: 라우팅 품질

직선/격자 추정 → 실제 보행 경로.

- [ ] **P5.1** 실제 보행 경로 — OSRM/GraphHopper로 turn-by-turn 폴리라인 + ETA 정확도 향상. 외부 API rate limit·의존성 trade-off 검토
- [ ] **P5.2** 음성 안내 (TTS) — Web Speech API. 보행 직전 hands-free 시나리오

---

## 🛠 Open — 인프라/품질 (cross-cutting)

특정 Phase에 종속되지 않는 품질·관측·국제화 작업.

- [ ] **I.4** i18n (en/ja/zh) — `next-intl`. 명동·남대문 외국인 관광객 시나리오
- [ ] **I.6** a11y 라운드 — 색맹 친화 패턴(굵기/대시 보강은 P2.20에 포함), aria-label 점검, 키보드 탐색, 빈 자치구(미발행 18구) `aria-label` 명시
  - [x] **I.6-1차** axe-core baseline (4.10.2, wcag2a+aa+21+best-practice) → 1 moderate violation(검색·필터 `<section>` aria-label 누락) + destination 버튼 aria-label에 P2.23에서 빠진 1️⃣/2️⃣ 시각 뱃지가 음성으로 잔존하던 1건 surgical fix. axe 0 violations / 42 passes. 패널 오픈 상태도 0 violations. DistrictSelector grid 키보드(Tab + focus ring + Esc + outside-click)는 P3.3에서 이미 만족. 미발행 18구 aria-label("{name} 공공데이터 미발행")도 P3.3에서 이미 명시됨 — 이번 라운드 추가 변경 없음.
  - [x] **I.6-2차** 키보드 forward/back focus ring + motion-reduce — HUD/검색/팝업/셀렉터/필터/공유/상태 토글에 공통 `focus-visible` 링 적용, Leaflet 마커 focus outline 추가, `=` 확대 / `-` 축소 키보드 shortcut 추가(입력창 focus 중에는 무시), 마커/클러스터 accessible name을 위치명·"휴지통 N개 그룹"으로 정리. `prefers-reduced-motion`에서 Leaflet fly/zoom/pan animation은 즉시 이동으로 대체하고, user/highlight pulse·spinner/pulse·cone transition을 감속. snapshot: `docs/snapshots/2026-05-09/i6-a11y-focus-ring.png`, `i6-a11y-shift-tab-ring.png`.

---

## 🤔 결정 포인트 (열려있는 질문)

| 주제 | 트리거 | 대안 | 현재 입장 |
|------|--------|------|----------|
| 카카오맵 전환 | 로드뷰·POI 검색 필요 / OSM 한글 가독성 부족 | OSM 유지 / Naver Maps / Mapbox | OSM 유지. PoC엔 충분 |
| DB 도입 | 사용자 제보 / 데이터 1MB+ / 실시간 업데이트 | 정적 JSON / Postgres+PostGIS / Supabase | 정적 JSON 유지 |
| 좌표계 변환 | 표준데이터가 KATEC/TM으로 오면 | proj4js 도입 / 서버 사전변환 | 미정. P1.3에서 확인 후 판단 |
| 인증/관리자 페이지 | 휴지통 추가/수정 기능 도입 시 | NextAuth / Clerk / 직접 구현 | 미도입 |

---

## 🆕 Phase 1 발견사항 (참고)

- **CSV는 BOM 포함 UTF-8** (EUC-KR 아님). `iconv` 강제하면 오히려 깨짐.
- **표준데이터 종류는 2종뿐** (`일반쓰레기`, `재활용쓰레기`). 담배꽁초/기타는 표준에 없음. 필요시 별도 데이터 소스.
- **같은 좌표 다중 행 패턴**: 한 정류장에 일반·재활용 통이 한 쌍씩 → 117행 → 59 그룹. 그룹핑 후 56곳이 양쪽 다 보유. 단일 3곳은 모두 일반.
- **`cache: 'force-cache'` 함정**: 데이터 교체 후 옛 응답을 들고와서 schema mismatch → undefined access. 정적 JSON이라도 PoC 단계에선 캐시 보수적으로.

---

## ⚠️ 함정 메모 (개발 시 주의)

- **Leaflet SSR 불가** → Map은 `dynamic(() => import('@/components/Map'), { ssr: false })`. 단, `ssr: false`는 **Server Component에서 사용 불가** → 호출 페이지가 `'use client'`여야 함. 그래서 현재 `app/page.tsx`가 클라이언트 컴포넌트.
- **Leaflet CSS 누락 시 타일 깨짐** → `app/layout.tsx`에서 `import 'leaflet/dist/leaflet.css'` 필수.
- **Next.js 16 = Turbopack 기본** → `package.json` 스크립트에 `--turbopack` 안 붙여도 됨. 커스텀 webpack 설정 있으면 빌드 fail.
- **포트 충돌 자동 폴백** → 3000 점유 시 3001로. 콘솔에 경고 뜨니 무시하지 말 것.
- **html/body height 체인** → `globals.css`에 `html, body { height: 100% }`. 하나 빠지면 Leaflet이 0px로 잡힘.
- **Async params (Next 16)** → 현재는 dynamic route 없어 무관. 추가 시 `params: Promise<{...}>` 형태로.
- **TrashBin types 그룹 모델**: 같은 좌표는 묶어서 `types: BinType[]`. UI/필터는 `bin.types.some(t => selected.has(t))`로 합집합 처리. 새 자치구 추가 시 transform 스크립트가 자동 그룹핑.
- **transform 스크립트는 `process.argv` 사용** — `Bun.argv` 쓰면 `tsc`(next build의 type check)가 `@types/bun` 요구해서 빌드 실패. Bun 전용 API 안 써도 충분.
- **react-leaflet 5.0 + React 19 dev StrictMode**: dev에서 `Map container is being reused by another instance` / `appendChild of undefined` 에러가 콘솔에 한 번씩 뜸. 더블 마운트 때문이고 prod 빌드/사용성엔 영향 없음. 무시.
- **iOS Safari + Geolocation**: HTTP에서는 GPS 권한 prompt가 뜨지 않거나 거부된다. iPad 검증은 항상 Vercel HTTPS URL(`https://junggu-trash-map.vercel.app`)로. LAN IP(`http://192.168.x.x:3001`)은 UI 시각 확인엔 OK, GPS는 ❌.
- **`vercel link` GitHub 자동 연결 실패**: 첫 시도에서 "Failed to connect ... private repo access" 메시지 후 두 번째 시도엔 메시지 없이 link만 됨. 추후 `vercel git connect`로 명시 연결 시도하면 "already connected" 응답 (한 번 설정되면 자동). push가 production/preview 자동 deploy를 트리거.
- **Vercel commit-email-GitHub 매칭**: 커밋 author 이메일이 GitHub 계정에 등록 안 돼있으면 deploy block. CLI는 generic "Unexpected error"만 떨굼, dashboard에 사유. → git identity를 GitHub 계정에 등록된 이메일로 맞추기.
- **Leaflet `divIcon` 캐시**: 같은 (단일타입/혼합) 키 마커들은 `L.divIcon` 인스턴스를 공유해도 안전 (Leaflet은 html을 템플릿으로만 쓰고 DOM은 마커별 생성). 59개 마커 × 매 렌더 → 3 인스턴스로 절감.
- **localStorage 초기화 ≠ useState 초기화**: `useState(() => localStorage.getItem(...))` 패턴은 SSR(server) → 기본값, CSR(client) → 저장값으로 첫 렌더가 갈라져 hydration mismatch. 항상 기본값으로 useState → mount 후 useEffect에서 localStorage 읽어 setState. 첫 effect의 자동 persist는 hydratedRef로 가드해서 default가 saved를 덮어쓰지 않도록 할 것.
- **divIcon `transform:scale()`은 레이아웃 변형 X**: 마커 크기를 진짜 줄이려면 `width/height/font-size`를 직접 곱해서 박을 것. 자세한 예시는 [TIL](./til/2026-05-04-leaflet-divicon-css-transform-scale.md).
- **`leaflet-rotate`는 markerPane을 `_norotatePane`에 분리**: 이미 마커 직립 처리됨. 컨테이너에 counter-rotate CSS를 추가로 걸면 double-rotation 버그. [TIL](./til/2026-05-04-leaflet-rotate-marker-double-rotation.md).
- **`leaflet-rotate` UMD bundle은 `window.L` 글로벌 의존**: ESM 환경에선 `window.L = L` 셋업 모듈을 분리해 plugin import보다 먼저 평가되도록 해야 한다. [TIL](./til/2026-05-04-leaflet-rotate-window-l-bootstrap.md).
- **`deviceorientation`은 iOS/Android 두 방언**: iOS는 사용자 제스처 안에서 `requestPermission()` + `webkitCompassHeading` 사용, Android는 권한 무관 + `(360 - alpha) % 360`로 좌표계 반전. 150ms throttle로 떨림 흡수. [TIL](./til/2026-05-04-deviceorientation-ios-android-quirks.md).
- **`deviceorientation` heading 튐 4겹 디펜스**: (1) 이벤트 두 개 listen + `absolute===false` 거부, (2) `screen.orientation.angle` 빼서 화면 회전 보정, (3) 60ms throttle, (4) EMA wrap-around 스무딩. `'on…' in window` feature detect는 silent-fail 위험. [TIL](./til/2026-05-04-deviceorientation-heading-jitter.md).
- **GitHub Actions 첫 워크플로우는 chicken-and-egg**: 워크플로우는 default branch(main)에 있어야 PR 트리거 인식. `pull_request: branches:`는 PR의 base를 필터함(head 아님). 첫 도입 시 `workflow_dispatch:` escape hatch를 함께 박을 것. [TIL](./til/2026-05-04-github-actions-first-workflow-bootstrap.md).
- **Lighthouse CI 첫 baseline**: `preset: "mobile"`은 무효 값(default라 빼야 함, 유효 값은 perf/experimental/desktop). PWA 카테고리는 LH 12부터 제거. 첫 임계치는 일반 가이드 점수가 아니라 **측정값 - 마진**에서 시작해 ratchet up. [TIL](./til/2026-05-04-lighthouse-ci-config-traps.md).
- **Top-N 강조는 비후보 dimming이 효과적**: 강조 대상의 크기·진하기를 키우는 것보다, 비강조 대상을 죽이는 게 시각 노이즈 ratio 측면에서 압도적. 배경 마커 56개 vs 후보 3개 같이 N>>M 구도면 더더욱. [TIL](./til/2026-05-04-top3-readability-dim-non-candidates.md).
- **Next 16 resource hints는 Metadata API 직통 아님**: `<head>`에 `rel=preconnect` / `dns-prefetch` 직접 추가하지 말고 Client Component에서 `ReactDOM.preconnect()` / `prefetchDNS()` 사용. 로컬 docs grep이 제일 빠르다. [TIL](./til/2026-05-05-nextjs-resource-hints-reactdom-api.md).
- **Sentry 같은 외부 SDK는 top-level import 금지**: `unused-javascript` audit에 바로 걸린다. capture/init 시점이 명확하면 `await import()` + idle 지연으로 메인 번들에서 빼라. [TIL](./til/2026-05-05-sentry-bundle-lazy-import.md).
- **GeoJSON 좌표 순서는 `[lng, lat]`** (ISO 표준). Leaflet과 우리 코드의 `{lat, lng}`와 반대. point-in-polygon 헬퍼 안에서만 한 번 갈아끼고 외부 API는 절대 swap 금지. 한 번 헷갈리면 전 구가 '서울 밖' 판정으로 침묵 실패.
- **자치구 영문 슬러그는 manifest가 SoT**: 행정안전부 표준 영문 표기는 일관 안 됨 (`Jung-gu` vs `Junggu` vs `Jung Gu`). `public/data/seoul-manifest.json`이 단일 진실. `*-gu` 접미사 없음, 모두 lowercase. 한 번 정해진 이상 URL/파일명에 영구 박혀 변경 불가.
- **`Map` const는 dynamic component와 충돌**: page.tsx에서 `const Map = dynamic(...)` 가 있으면 같은 함수 안에서 `new Map()` 은 컴포넌트로 해석돼 "This expression is not constructable" 발생. 새 코드는 `globalThis.Map`/`globalThis.Set` 명시적 한정 사용 (Set은 충돌 없지만 일관성).
- **`leaflet.markercluster`는 `window.L` 글로벌 의존**: `leaflet-rotate`와 마찬가지. ESM 환경에선 `@/lib/leaflet-globals` (이미 셋업됨)가 plugin import보다 먼저 평가돼야 한다. `MarkerClusterGroup.tsx`는 `import '@/lib/leaflet-globals'` → `import 'leaflet.markercluster'` 순으로 명시. 한 번 더 깜빡이면 `L.markerClusterGroup is not a function`.
- **`markercluster`를 react-leaflet에 끼우는 법**: react-leaflet 5.0은 cluster 컴포넌트가 없다. `@react-leaflet/core`의 `createLayerComponent` + `createElementObject(group, extendContext(ctx, { layerContainer: group }))` 패턴이면 `<Marker>` 자식이 자동으로 cluster group에 attach된다 (LayerGroup 구현과 동일 메커니즘). `react-leaflet-cluster` 같은 3rd party 패키지 없이 8줄로 끝남.
- **markercluster `disableClusteringAtZoom`은 "그 줌부터 cluster off"**: `disableClusteringAtZoom: 15` → 줌 ≥15에서 개별, <15에서 cluster. spec의 "줌 <15 cluster / 줌 ≥15 개별" 임계와 일치. 같은 임계가 P2.10 Top-3 dimming(BinMarker rank/dimmed)과 자연 정렬됨 — Top-3 강조는 줌 ≥15에서 마커가 풀려야 시각적으로 의미 있고, 그 이하 줌에서는 어차피 cluster bubble로 묶여 보이지 않음. README 문서가 "at this zoom level and below" 라고 적혀있으나 소스(`MarkerClusterGroup.js` `_generateInitialClusters`)는 `maxZoom = disableClusteringAtZoom - 1`로 맞춰 zoom ≥ X 에서만 클러스터링이 일어나지 않게 한다 (docs 문구는 misleading). `docs/snapshots/29-markercluster/zoom-13/14/15/16.png`로 4단계 시각 검증 보존.
- **워크트리 별 dev 서버 포트 충돌은 캡처 결과를 통째로 망가뜨림**: 동일 머신에 여러 worktree가 있고 다른 워크트리의 dev 서버가 같은 포트(3001)를 점유 중이면, 우리 worktree에서 띄운 서버가 자동 fallback(3002)되거나 연결 실패하는데, 헛갈리면 여전히 3001로 navigate해서 **다른 worktree의 빌드를 검증하게 된다**. P3.1b 검증 시 `MarkerClusterGroup`이 안 붙어있다고 잘못 결론낼 뻔함. 디펜스: (1) 워크트리에서 dev 띄울 때 `PORT=3010 bun run dev`처럼 명시 포트, (2) `lsof -i :3001 -sTCP:LISTEN` + `ps aux | grep next.*dev`로 점유자가 우리 워크트리인지 확인, (3) 페이지 콘솔에서 `window.location.port` + `__map`의 layer 검증.
- **transform.ts id 발번은 좌표 정렬 후 순차** (`<prefix>-<NNNN>`) — 새 통이 lat/lng 정렬 위치 사이에 끼면 뒷 통 id가 한 칸씩 밀려 hint(P4.3)·즐겨찾기(P2.14)·기타 id-keyed 메타데이터가 다른 통에 붙어버림(orphan). 공공 데이터 갱신은 연 1회 빈도라 수동 재키잉 5~10분으로 OK이지만, hint 50+ 또는 자동 transform CI 시 좌표 기반 stable id로 hardening 필요. P4.3 spec §10.1에 수용 명시.
- **워크트리 부트스트랩에 `bun install` 빠지면 빌드만 실패하고 테스트는 통과**: vitest는 src/lib 순수 함수만 import해서 React/leaflet 의존성을 안 건드리는 반면, `bun run build`는 `leaflet.markercluster` 등을 실제 import 해 module-not-found로 fail. 워크트리 새로 만들었으면 build로 검증 전 항상 `ls node_modules/<key-pkg>` 한 번 확인. P4.3 작업 시 worktree에 `leaflet.markercluster` 미설치로 build 실패 → bun install 한 번에 복구.
- **지도 위 단일 stroke outline은 라이트 타일에서 거의 안 보인다** (P3.4): OSM 표준 타일은 베이지·도로 회색·녹지 초록의 톤이 너무 풍부해서 amber-700·slate-700 같은 단일 색 1.5px stroke는 시각적으로 묻힌다. 정답은 **두 겹 stack**: `<GeoJSON>` 두 인스턴스 — outer halo(흰색 4px opacity 0.85) + inner dashed(slate-800 1.5px opacity 0.95). 다크 타일에선 black halo + amber inner. 모든 배경에서 inner 색 contrast가 살아남는다. 거리선 rank-1 실선과 패턴 분리는 inner의 dashArray로 유지. react-leaflet `<GeoJSON>` `data` prop은 immutable → 두 path 각각 `key={code}-{halo|inner}-{tileTheme}` 필요.
- **HUD floating group에 가변 텍스트 라벨 박지 말 것** (P3.4): `flex flex-col items-end`로 묶인 셀렉터 + 필터 우상단 stack에 `📍 {자치구명}`을 추가하면 자치구명 길이(중구=2자, 영등포구=4자)에 따라 wrapper의 ring/border 폭이 흔들린다. floating HUD wrapper의 시각 안정성이 깨지는 것은 비주얼 noise. 정답은 **지도 위 fixed-position 라벨**: leaflet `bindTooltip(name, { permanent: true, direction: 'center' })`로 폴리곤 중앙에 띄우면 HUD 영역 0 영향, 패닝/줌 따라 자연스럽게 따라간다. 배경/테두리 제거 + text-shadow 다겹(`0 0 3px ... 0 1px 2px ...`)으로 어떤 배경에서도 contrast 유지. CSS는 `globals.css`에 `.district-name-tooltip` + `-light` / `-dark` variant.

---

## 📚 참고 링크

- 공공데이터포털 — [전국휴지통표준데이터](https://www.data.go.kr/data/15119394/standard.do)
- Next.js 16 업그레이드 가이드: `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`
- Leaflet docs: https://leafletjs.com/
- react-leaflet v5 (React 19 호환): https://react-leaflet.js.org/

---

## 📸 Snapshot 히스토리

`docs/snapshots/`에 마일스톤 별 모바일 스크린샷이 누적되고 있음. Phase 종료 시점이나 큰 UX 변경 직후마다 글로벌 `snapshot` 스킬로 한 장 추가. 인덱스: `docs/snapshots/README.md`.

## 📚 TIL (시행착오 기록)

`docs/til/`에 작업 중 마주친 비명시적 함정과 해결 패턴을 사건당 한 파일로 누적. 코드만 봐서는 안 보이는 "왜 이렇게 짰는지"의 이유를 보존. 인덱스: `docs/til/README.md`.

## 🛠 프로젝트 스킬

`.claude/skills/`에 자주 반복되는 워크플로우를 스킬로 박아둠. 다음 세션부터 사용자 발화에 따라 자동 트리거.

- **`trash-feature-merge-flow`** — `P*.*` feature 작업 → main 머지 9단계 (snapshot → tasks/CHANGELOG → commit/push → SHA 정합 → main 머지). "마무리", "머지 ㄱㄱ", "main으로" 같은 발화에 트리거.
- **`trash-snapshot-commit`** — 글로벌 `snapshot` 캡처 직후 자동 chain되는 좁은 파이프라인 — 1차 commit (snapshot 본체) → push → meta.md `git_sha` 정합 갱신 → 2차 commit + push. 두 commit + 빠뜨리기 쉬운 SHA 정합을 사용자 확인 없이 한 번에. snapshot 산출물이 단독 변경일 때만 발사 — 코드 변경이 같이 staged면 `trash-feature-merge-flow`로 위임.
- **`trash-codex-integrate`** — Codex 위임 작업이 sandbox 제약으로 vendor shim/uncommit 상태로 끝났을 때 실제 패키지 설치 + import 경로 정리(next.config/tsconfig/vitest/사용자 코드) + commit·push. Codex 완료 알림 직후 워크트리에 `vendor/` 또는 `file:vendor/*` 발견 시 트리거.
- **`trash-lighthouse-pr-watch`** — PR Lighthouse CI 결과 Monitor 폴링 → 점수 표 출력 → 통과 시 머지 + main sync. `gh pr create` 직후 또는 "lighthouse 점수", "PR 머지" 같은 발화에 트리거.

각 스킬의 SKILL.md에 절차·함정·관련 TIL 링크가 들어있다. 스킬 자체도 진화 — 새 함정이 발견되면 SKILL.md에 추가.

## 📝 CHANGELOG

`CHANGELOG.md`의 `[Unreleased]` 섹션은 사용자/리뷰어 관점의 변경 누적. Phase 종료, 새 기능, 버그 픽스, 의미 있는 인프라 변경 시 그 자리에서 한 줄. Keep a Changelog 컨벤션. 자세한 운영 규칙은 `CLAUDE.md`.

---

## 운영 규칙 (Claude가 이 파일을 다룰 때)

1. **세션 시작 시 이 파일을 먼저 읽는다.** 「현재 상태」와 「Open」 최상단을 보고 다음 작업 선택.
2. **Task 완료**: 체크박스 `[x]` + 「Done」 섹션 위로 이동. 한 줄 요약 유지 (long-form은 PR/커밋에).
3. **새 Task 추가**: 가장 가까운 Phase 섹션에 `P{N}.{n}` 번호로. 한 줄로 끝낼 것.
4. **결정 사항 변경**: 「결정 포인트」 표 직접 수정. 변경 사유는 표 아래 한 줄로 (`> 2026-MM-DD: 이유...`).
5. **함정 발견**: 「함정 메모」에 즉시 추가. 이게 미래의 나(또는 다른 에이전트)를 살림.
6. **상태 갱신**: 「현재 상태」의 Phase / 날짜는 마일스톤 도달 시 갱신.
7. **수정한 라인은 사람이 읽기 좋게**: 1줄 = 1 task 원칙. 부연은 들여쓰기 1단계 bullet으로.
