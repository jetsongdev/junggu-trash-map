# 중구 휴지통 지도 — 작업 큐

> 이 파일은 Claude가 매 세션 시작 시 읽고 작업 우선순위를 판단하는 1차 소스.
> 사람과 에이전트 모두 직접 편집 가능. 컨벤션은 파일 끝 「운영 규칙」 참고.

## 현재 상태 (2026-05-05)

- **Phase**: 3 진입. P3.1a Foundation 완료 (manifest/geojson/district 3축 자원, point-in-district 판정, page boot 갱신). 다음 P3.2 (25구 데이터 transform), P3.1b (markercluster), P3.1c (인접 prefetch).
- **사용자 환경 영속화** (`localStorage`): `distanceMode` (직선/격자), `tileTheme` (다크/라이트, **빈 값일 때 시스템 prefers-color-scheme 자동 감지**), `walkingSpeed` (km/h, 2~7 step 0.5), `favorites` (즐겨찾기 bin id), `savings` (누적 보행거리·시간·횟수)
- **마커 색**: 일반 `#60a5fa` (blue-400), 재활용 `#34d399` (emerald-400), 혼합 `#c084fc` (violet-400) — 라이트/다크 양 타일에서 균형
- **Roadmap 확장**: Phase 3 (25개 구) · Phase 4 (데이터 확장: 타 종류 통/사용자 제보/사진) · Phase 5 (실제 보행 경로 + TTS) · 인프라/품질 cross-cutting (i18n 남음)
- **Stack**: Next.js 16 (Turbopack) · Bun · TypeScript strict · Tailwind v4 · Leaflet + OSM/CartoDB · Vercel Analytics + Speed Insights · Sentry (lazy) · Lighthouse CI
- **Test**: `bun run test` (vitest 4.x) — `lib/geo.ts`·`lib/eta.ts`·`lib/url-share.ts`·`lib/favorites.ts`·`lib/savings.ts`·`lib/monitoring.ts` 순수 함수 105개
- **Dev**: `bun run dev` → http://localhost:3000 (점유 시 자동 3001)
- **Build**: `bun run build` 통과
- **Deploy**: `git push` → 자동 Vercel build → https://junggu-trash-map.vercel.app (16~22초). 수동 `vercel deploy`는 hotfix 시에만
- **PWA**: `app/manifest.ts` + 동적 `icon.tsx`/`apple-icon.tsx` (next/og), iOS 풀스크린 메타 — Safari "홈 화면에 추가"로 풀스크린
- **Data**: `public/data/seoul-manifest.json` (25구 메타) + `public/data/seoul-districts.geojson` (25구 폴리곤, ~56KB) + `public/data/districts/<code>.json` (현재 `junggu` 1개, **59 그룹**). 같은 좌표 다중 행 그룹화: `TrashBin.types: ('일반'|'재활용')[]`. 24개 구는 `binCount: 0` 자리 표시자 (P3.2 transform 대상).
- **Geolocation**: `watchPosition` 실시간 + Haversine/Manhattan `findNearest`/`findOptimalDetour` + sky/cyan 점선. 출발 + 목적지 모두 set 시 경유 휴지통 detour 알고리즘
- **iOS fallback**: 🎯 출발 탭, 🏁 목적지 탭 — 두 탭 모드 mutually exclusive, 한 클릭으로 좌표 지정
- **칩 스타일**: 비활성 = `bg-neutral-800` 다크 그레이. 활성 = 기능별 색 (전체=흰, 일반/재활용=색별, 위치=sky, 격자=amber, 출발 탭=violet, 목적지=rose, 방향 cone=sky·헤드업=violet, 속도 슬라이더=emerald, 즐겨찾기=amber)
- **Lighthouse 점수** (PR #8 X.1 기준): perf 0.75 / a11y 0.96 / best-practices 0.93 / seo 1.00. 임계치 perf ≥0.70 (X.1·TIL·docs sync 3 PR 연속 0.74~0.75 통과 후 ratchet up). PWA 카테고리는 LH12에서 제거됨.

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
- [x] **인프라 — Tier 2** — GitHub repo `jetsongdev/junggu-trash-map` (private), Vercel auto-deploy (push trigger), Vercel Analytics + Speed Insights 마운트.
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
- [x] **I.2** 에러 모니터링 — Sentry 연동, production-only 초기화, geolocation/fetch 에러 캡처, global-error 추가
- [x] **I.3** Lighthouse CI — PR마다 PWA/접근성/성능 점수 회귀 차단
- [x] **P2.14** 즐겨찾기 — popup ☆/★ 토글로 휴지통 표시, 칩 필터로 즐겨찾기만 보기. localStorage `favorites` 영속화 (comma-separated id), `lib/favorites.ts` 순수 함수 + vitest 13개

### Phase 3 — 25개 구 확장
- [x] **P3.1** 데이터 분할 전략 결정 — 자치구 단위 정적 JSON + GeoJSON 폴리곤 클라이언트 판정 + 3-PR 분할 (foundation → cluster · prefetch). spec: `docs/superpowers/specs/2026-05-05-p3-1-data-partitioning-design.md`.
- [x] **P3.1a** Foundation — `seoul-manifest.json`/`seoul-districts.geojson`/`districts/<code>.json` 3축 자원, `point-in-district`/`districts`/`fetchDistrict` 모듈, page.tsx 부트 시퀀스. 25구 데이터·markercluster·prefetch는 후속.

---

## 🔜 Open — Phase 2 잔여 (nice-to-have)

핵심 기능 다 들어가있고, 아래는 사용성·확장성 강화. 가벼운 → 무거운 순:

- [ ] **P2.3** 클러스터링 — `leaflet.markercluster`. 마커 100+ 시 lag 방지. **25구 확장(Phase 3) 전엔 ø**

---

## 🌏 Open — Phase 3: 25개 구 확장

자치구별 정적 JSON + 클라이언트 point-in-polygon 판정으로 결정. spec: `docs/superpowers/specs/2026-05-05-p3-1-data-partitioning-design.md`. P3.1은 3-PR로 분할 (a foundation → b markercluster · c 인접 prefetch).

- [ ] **P3.1b** markercluster 도입 — `leaflet.markercluster` + 줌 ≥15에서 개별 마커. 별도 worktree·PR.
- [ ] **P3.1c** 인접 자치구 prefetch — 활성 구 변경 시 manifest의 `adjacent` 들을 `requestIdleCallback`으로 백그라운드 fetch. 별도 worktree·PR.
- [ ] **P3.2** 25구 실제 데이터 transform — 공공데이터포털 / 서울 열린데이터광장에서 24개 구 CSV 수집 → `transform.ts` 일괄 실행 → `public/data/districts/*.json` + manifest `binCount` 갱신.
- [ ] **P3.3** 자치구 자동 감지 진입 가이드 UI — 사용자 panning 시 active set 자동 추가, 25구 선택 셀렉터, 빈 데이터 구 토스트.

---

## 📦 Open — Phase 4: 데이터 확장

표준 휴지통 데이터 외 종류와 사용자 제보·사진까지.

- [ ] **P4.1** 타 종류 통 합치기 — 담배꽁초·의류수거함·폐의약품함 (별도 공공 데이터셋). 필터 칩에 추가, transform 스크립트 확장
- [ ] **P4.2** 사용자 제보 기능 — 없음/넘침/위치 오류. 익명, Vercel KV 또는 Postgres. 관리자 페이지(P3 결정 포인트) 트리거 가능
- [ ] **P4.3** 휴지통 사진 1장 — Supabase Storage 또는 정적 추가. 골목 안쪽 통 식별용

---

## 🧭 Open — Phase 5: 라우팅 품질

직선/격자 추정 → 실제 보행 경로.

- [ ] **P5.1** 실제 보행 경로 — OSRM/GraphHopper로 turn-by-turn 폴리라인 + ETA 정확도 향상. 외부 API rate limit·의존성 trade-off 검토
- [ ] **P5.2** 음성 안내 (TTS) — Web Speech API. 보행 직전 hands-free 시나리오

---

## 🛠 Open — 인프라/품질 (cross-cutting)

특정 Phase에 종속되지 않는 품질·관측·국제화 작업.

- [x] **I.1** 테스트 인프라 — vitest 도입, `lib/geo.ts`·`lib/eta.ts`·`lib/url-share.ts` 순수 함수 59개 커버
- [ ] **I.4** i18n (en/ja/zh) — `next-intl`. 명동·남대문 외국인 관광객 시나리오

---

## 🎮 Open — 실험적 (선택)

- [x] **X.1** "오늘 절약한 보행거리/시간" 누적 — 휴지통 팝업의 `✓ 사용`으로 추가 거리·시간·횟수를 localStorage에 누적하고 통계 바에 표시. 분리수거 동기부여

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
- **Vercel commit-email-GitHub 매칭**: 커밋 author 이메일이 GitHub 계정에 등록 안 돼있으면 deploy block. CLI는 generic "Unexpected error"만 떨굼, dashboard에 사유. → git identity를 GitHub 계정 이메일로 맞추기 (이 repo는 jetsong.dev@gmail.com).
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
