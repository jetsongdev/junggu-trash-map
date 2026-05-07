# 🗑️ 중구 휴지통 지도 (PROTO → 서울 7구로 확장 중)

서울 가로휴지통 위치를 지도 위에 시각화하는 PWA 프로토타입. 중구 PoC에서 출발해 자치구 단위 정적 JSON + 클라이언트 point-in-polygon 라우팅 구조로 진화 중.

- Bun · Next.js 16 (App Router, Turbopack) · TypeScript strict · Tailwind v4
- Leaflet + react-leaflet + OpenStreetMap / CartoDB (API 키 0)
- 실데이터: 공공데이터포털 표준데이터 발행분 **7개 자치구 802 마커** (중구·서초·중랑·성북·마포·구로·노원). 미발행 18개 구는 `binCount: 0` 자리 표시자

## 🚀 배포

- **Production**: https://junggu-trash-map.vercel.app
- **Repo**: https://github.com/jetsongdev/junggu-trash-map
- **Vercel 대시보드**: https://vercel.com/jetsongdev/junggu-trash-map
- **자동 배포**: `git push` → 16~22초 빌드 → alias 자동 갱신
- **자동 릴리스**: PR에 `release:patch/minor/major` 라벨 붙여 main으로 머지 → 자동 bump + tag + GitHub Release. 정책은 `CLAUDE.md` `## Release` 참고. 라벨 없으면 skip
- **Observability**: `@vercel/analytics` + `@vercel/speed-insights` 마운트, dashboard에 RUM/Core Web Vitals 자동 누적
- **Telegram 알림**: GitHub Actions `deployment_status` → 단일 그룹 + 토픽 분기(Preview/Production/Errors) 자동 발사. 셋업 가이드는 [공유 gist](https://gist.github.com/jetsongdev/bd80cb02e5e3fb9a26b892cc5fef2dcc)
- **Lighthouse CI**: PR마다 perf/a11y/best-practices/seo 자동 측정. 임계 perf ≥0.62 (P3.x 다구 panning 인프라 회귀 수용 후 P3.1b/c 머지 시 ratchet up 예정)

iPad/모바일에서 GPS까지 검증하려면 production URL로 접속 (HTTPS 필수). LAN(`http://192.168.x.x:3001`) 직접 접근은 Safari가 Geolocation 권한 prompt 거부 — 그땐 앱의 **🎯 지도 탭** 모드로 우회.

## 실행

```bash
bun install
bun run dev      # http://localhost:3000 (점유 시 자동 3001)
bun run build    # production build (Turbopack)
```

## 주요 기능

- 헤더(다크) + 다크/라이트 OSM·CartoDB 지도 토글, PROTO 배지
- 휴지통 타입별 마커: 🗑️ 일반(파랑) / ♻️ 재활용(초록) / 🗑️♻️ 혼합(보라)
- 다중 선택 필터 칩 (전체 / 일반 / 재활용 / 즐겨찾기)
- 마커 클릭 → 이름·주소·타입·관리기관·☆ 즐겨찾기·✓ 사용 (절약 거리·시간 누적)
- 📍 내 위치 (`watchPosition`) + 가까운 통 Top-3 강조 + 굵기 다른 점선
- 🎯 출발 / 🏁 목적지 탭 모드: GPS 거부/미지원 환경에서도 좌표 지정 가능. 출발+목적지 set 시 경유 휴지통 detour 알고리즘
- 주소·랜드마크 검색 (Nominatim) — 검색 결과로 출발/목적지 즉시 지정
- 🧭 방향 cone (60° 부채꼴) + 헤드업 모드 (지도 회전) — `deviceorientation`
- 보행 속도 슬라이더 (2~7 km/h, 0.5 step) + ETA 자동 계산
- URL 공유 (필터·테마·모드·속도·출발·목적지)
- 자치구 단위 lazy load — 첫 진입은 GPS 위치(또는 기본 중구) 1개. 사용자 첫 인터랙션 후 발행 7개 구를 idle 백그라운드로 합류, 통계 바 breakdown 라인이 점진적으로 brighten
- 자치구 데이터 합류 시 토스트 (`○○구 N개`), 7개 모두 들어오면 emerald ✅ 완료 토스트
- 지도 좌측 하단 데이터 출처 + 버전 표시 → 공공데이터포털 페이지로 링크

## 디렉토리

```
src/
├── app/{layout,page,globals.css}
├── components/
│   ├── {Map,BinMarker,BinPopup,FilterChips}.tsx
│   ├── LocateButton.tsx · UserMarker.tsx · SearchBox.tsx · ShareButton.tsx
│   └── ...
└── lib/
    ├── types.ts                # TrashBin, BinType, DistrictCode, DistrictMeta, Manifest
    ├── data.ts                 # fetchDistrict(code, version) + 모듈 캐시 + filterByTypes
    ├── districts.ts            # manifest 로더, geojson 로더, version-bust URL
    ├── point-in-district.ts    # 좌표 → district code (ray-casting)
    ├── geo.ts · eta.ts · favorites.ts · savings.ts · url-share.ts · haptic.ts · orientation.ts · monitoring.ts
    └── ...

scripts/transform.ts            # 표준데이터 CSV → 그룹화 JSON 변환기
public/data/
├── seoul-manifest.json         # 25구 메타 (binCount/centroid/bbox/adjacent/version)
├── seoul-districts.geojson     # 25구 폴리곤 (KOSTAT 단순화, ~56KB)
└── districts/
    ├── junggu.json · seocho.json · jungnang.json · seongbuk.json
    └── mapo.json · guro.json · nowon.json    (총 7개, 802 그룹)

.github/workflows/
├── lighthouse-ci.yml           # PR마다 perf/a11y/best-practices/seo
└── telegram-preview-notify.yml # Vercel deploy → Telegram (preview/production 토픽 분기)

docs/
├── tasks.md                    # 작업 큐 + 결정 포인트 + 함정 메모
├── snapshots/                  # 마일스톤별 모바일 스크린샷 (26개)
├── til/                        # 시행착오 기록 (사건당 1파일)
└── superpowers/
    ├── specs/                  # 설계 문서
    └── plans/                  # 구현 plan (TDD)
```

## 실데이터 교체 / 다른 자치구 추가

1. [공공데이터포털 — 전국휴지통표준데이터](https://www.data.go.kr/data/15129450/standard.do)에서 자치구별 CSV 다운로드 (UTF-8 BOM, EUC-KR 아님)
2. 변환 스크립트 한 줄로 끝:
   ```bash
   bun scripts/transform.ts <input.csv> public/data/districts/<code>.json
   ```
   - 자동: BOM strip, 좌표 그룹핑(같은 lat/lng 다중 행은 `types[]` 배열로 머지), 정렬, ID 발번
   - 표준데이터의 `휴지통종류`는 `일반쓰레기`/`재활용쓰레기` 2종 → `일반`/`재활용`으로 트림
3. `public/data/seoul-manifest.json`에서 해당 `code`의 `binCount`를 실제 마커 수로 갱신 + manifest의 `version`을 새 데이터 기준일자(`YYYY-MM-DD`)로 bump
4. 자치구 영문 슬러그는 manifest가 SoT (`junggu`, `gangnam`, `seocho`...) — 한 번 정한 이상 URL/파일명에 영구 박힘. 새 자치구는 manifest에도 같은 슬러그로 자리 추가

## 다음 단계 결정 포인트

- **Phase 3 잔여 (P3.1b/c)**: 마커 802개 시점부터 `leaflet.markercluster`(P3.1b) 효과 본격적, 자치구 인접 prefetch(P3.1c)는 P3.1c 별도 worktree에서 진행 예정
- **Phase 3 데이터 (P3.2 추가)**: 표준데이터 미발행 18개 구 — 공공데이터포털에 자치구가 발행하면 그때 추가 transform. P3.2 완료 후엔 manifest binCount만 갱신하면 자동 합류
- **자치구 자동 감지 진입 가이드 (P3.3)**: 25구 셀렉터 UI + 빈 데이터 구 토스트 안내
- **데이터 확장 (Phase 4)**: 타 종류 통(담배꽁초/의류수거함/폐의약품함), 사용자 제보(없음·넘침·위치 오류), 휴지통 사진
- **라우팅 품질 (Phase 5)**: 직선/격자 추정 → OSRM/GraphHopper turn-by-turn. TTS 음성 안내도 후보
- **인프라/품질 (cross-cutting)**: i18n(en/ja/zh, `next-intl`), perf 별도 라운드 (P3.x 누적 -0.10 회복)
- **카카오맵 전환**: 한글 주소·로드뷰·POI 검색 필요해지면. 지금은 OSM + Nominatim 검색으로 충분
- **DB 도입**: 사용자 제보·수정 기능 도입할 때 (Postgres + PostGIS 또는 Vercel KV)
- **인증**: 관리자 페이지 도입 시 (NextAuth / Clerk)

전체 작업 큐와 P 번호는 [`docs/tasks.md`](docs/tasks.md), 시각 진화는 [`docs/snapshots/README.md`](docs/snapshots/README.md), 함정·시행착오는 [`docs/til/README.md`](docs/til/README.md), 설계 문서는 [`docs/superpowers/specs/`](docs/superpowers/specs/)에서.

## 가드레일 (개발 시 주의)

- **Leaflet SSR 불가** → Map은 `dynamic(..., { ssr: false })`. 호출 페이지가 `'use client'`여야 동작
- **CSS 누락 함정** → `app/layout.tsx`에 `import 'leaflet/dist/leaflet.css'` 필수
- **react-leaflet 5의 MapContainer.className은 마운트 시점만 적용** → 런타임 토글하려면 wrapper div + CSS 자손 셀렉터. 동적 center/zoom은 `useMap()` 훅 컴포넌트로
- **iOS Safari + Geolocation** → plain HTTP에선 권한 prompt 거부. 항상 HTTPS production URL로 검증
- **Vercel deploy block: commit email** → GitHub 계정에 등록된 이메일로 커밋해야 통과. CLI는 generic "Unexpected error"만 떨굼 — dashboard에 사유
- **`watchPosition` cleanup** → useEffect cleanup + 토글 off에서 `clearWatch` 둘 다 필요. 안 하면 unmount 후에도 콜백
- **포트 충돌** → 3000 점유 시 `bun run dev`가 자동 3001로. 콘솔 메시지 확인
