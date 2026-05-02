# 중구 휴지통 지도 — 작업 큐

> 이 파일은 Claude가 매 세션 시작 시 읽고 작업 우선순위를 판단하는 1차 소스.
> 사람과 에이전트 모두 직접 편집 가능. 컨벤션은 파일 끝 「운영 규칙」 참고.

## 현재 상태 (2026-05-02)

- **Phase**: 2 진행 중 — P2.1(Geolocation) 완료 + iPad fallback(탭 모드) 마무리. 다음은 P2.2/P2.4/P2.5 또는 Manhattan 토글
- **Stack**: Next.js 16 (Turbopack) · Bun · TypeScript strict · Tailwind v4 · Leaflet + OSM · Vercel Analytics + Speed Insights
- **Dev**: `bun run dev` → http://localhost:3000 (점유 시 자동 3001)
- **Build**: `bun run build` 통과
- **Deploy**: `git push` → 자동 Vercel build → https://junggu-trash-map.vercel.app (16~22초). 수동 `vercel deploy`는 hotfix 시에만
- **Data**: `public/data/junggu.json` — 표준데이터 변환 결과 **59 그룹** (혼합 56 / 단일 3 모두 일반)
- **Variant 모델**: `TrashBin.types: ('일반'|'재활용')[]` — 같은 좌표 다중 행은 묶음. 둘 다 보유 시 보라 마커
- **Geolocation**: `watchPosition` 실시간 + Haversine `findNearest` + sky 점선 거리 선. Manhattan은 lib만 (`pathPositions(mode)`), UI 토글 추후
- **iOS fallback**: 🎯 지도 탭 모드 — GPS 거부/미지원 시 한 클릭으로 위치 지정

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

---

## 🔜 Open — Phase 2: UX 다듬기 (잔여)

P2.1 + iPad fallback 완료. 다음 후보 (가벼운 → 무거운 순):

- [ ] **P2.2** PWA manifest + 홈화면 추가 프롬프트 — `app/manifest.ts` + 아이콘
- [ ] **P2.5** URL 쿼리스트링 필터 상태 공유 (`?type=재활용`) — `useSearchParams`
- [ ] **P2.3** 클러스터링 (마커 100+ 되면 lag) — `leaflet.markercluster`. 25개 구 확장 시 필요

---

## 🌏 Open — Phase 3: 25개 구 확장

데이터 1MB 넘으면 그때 결정. 그 전까진 자치구 1개.

- [ ] **P3.1** 데이터 분할 전략 결정 — 후보:
  - (a) 자치구별 정적 JSON, 뷰포트 bbox로 lazy-load
  - (b) Next API Route + 단일 JSON in-memory
  - (c) Postgres + PostGIS, `ST_Within(viewport)` 쿼리
- [ ] **P3.2** 결정한 전략으로 구현
- [ ] **P3.3** 자치구 진입 가이드 UI (현재 위치 → 자동 자치구 감지)

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

---

## 📚 참고 링크

- 공공데이터포털 — [전국휴지통표준데이터](https://www.data.go.kr/data/15119394/standard.do)
- Next.js 16 업그레이드 가이드: `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`
- Leaflet docs: https://leafletjs.com/
- react-leaflet v5 (React 19 호환): https://react-leaflet.js.org/

---

## 📸 Snapshot 히스토리

`docs/snapshots/`에 마일스톤 별 모바일 스크린샷이 누적되고 있음. Phase 종료 시점이나 큰 UX 변경 직후마다 글로벌 `snapshot` 스킬로 한 장 추가. 인덱스: `docs/snapshots/README.md`.

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
