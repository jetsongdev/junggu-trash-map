# 🗑️ 중구 휴지통 지도 (PROTO)

서울 중구 가로휴지통 위치를 지도 위에 시각화하는 PWA 프로토타입.

- Bun · Next.js 16 (App Router, Turbopack) · TypeScript strict · Tailwind v4
- Leaflet + react-leaflet + OpenStreetMap (API 키 0)
- 실데이터: 공공데이터포털 표준데이터 117행 → 좌표별 그룹핑 59 마커

## 🚀 배포

- **Production**: https://junggu-trash-map.vercel.app
- **Repo**: https://github.com/jetsongdev/junggu-trash-map (private)
- **Vercel 대시보드**: https://vercel.com/jetsongdev/junggu-trash-map
- **자동 배포**: `git push` → 16~22초 빌드 → alias 자동 갱신
- **자동 릴리스**: PR에 `release:patch/minor/major` 라벨 붙여 main으로 머지 → 자동 bump + tag + GitHub Release. 정책은 `CLAUDE.md` `## Release` 참고. 라벨 없으면 skip
- **Observability**: `@vercel/analytics` + `@vercel/speed-insights` 마운트, dashboard에 RUM/Core Web Vitals 자동 누적

iPad/모바일에서 GPS까지 검증하려면 production URL로 접속 (HTTPS 필수). LAN(`http://192.168.x.x:3001`) 직접 접근은 Safari가 Geolocation 권한 prompt 거부 — 그땐 앱의 **🎯 지도 탭** 모드로 우회.

## 실행

```bash
bun install
bun run dev      # http://localhost:3000 (점유 시 자동 3001)
bun run build    # production build (Turbopack)
```

## 주요 기능

- 헤더(다크) + 라이트 OSM 지도, PROTO 배지
- 휴지통 타입별 마커: 🗑️ 일반(파랑) / ♻️ 재활용(초록) / 🗑️♻️ 혼합(보라)
- 다중 선택 필터 칩 (전체 / 일반 / 재활용)
- 마커 클릭 → 이름·주소·타입·관리기관 팝업
- 📍 내 위치 (`watchPosition` 실시간 추적) + 가장 가까운 휴지통 강조 ring + 점선 거리 선
- 🎯 지도 탭 모드: GPS 거부/미지원 환경에서도 위치 지정 가능
- 통계 바: 마커 수, 가장 가까운 통 거리/이름

## 디렉토리

```
src/
├── app/{layout,page,globals.css}
├── components/
│   ├── {Map,BinMarker,BinPopup,FilterChips}.tsx
│   ├── LocateButton.tsx
│   └── UserMarker.tsx
└── lib/
    ├── types.ts          # TrashBin, BinType, TYPE_STYLE, styleFor
    ├── data.ts           # fetch + filter
    └── geo.ts            # Haversine + Manhattan + findNearest

scripts/transform.ts        # 표준데이터 CSV → 그룹화 JSON 변환기
public/data/junggu.json     # 실데이터 (59 그룹, UTF-8)
docs/
├── tasks.md                # 작업 큐 + 결정 포인트 + 함정 메모
└── snapshots/              # 마일스톤별 모바일 스크린샷
```

## 실데이터 교체 / 다른 자치구 추가

1. [공공데이터포털 — 전국휴지통표준데이터](https://www.data.go.kr/data/15129450/standard.do)에서 자치구별 CSV 다운로드 (UTF-8 BOM, EUC-KR 아님)
2. 변환 스크립트 한 줄로 끝:
   ```bash
   bun scripts/transform.ts <input.csv> public/data/<자치구>.json
   ```
   - 자동: BOM strip, 좌표 그룹핑(같은 lat/lng 다중 행은 `types[]` 배열로 머지), 정렬, ID 발번
   - 표준데이터의 `휴지통종류`는 `일반쓰레기`/`재활용쓰레기` 2종 → `일반`/`재활용`으로 트림
3. `src/lib/data.ts`의 fetch 경로가 `junggu.json` 고정이라 다른 자치구는 로더 일반화 필요 (Phase 3)

## 다음 단계 결정 포인트

- **25개 구 확장 (Phase 3)**: JSON 한 덩어리 1MB+ 도달 시 자치구별 파일 분할 + 뷰포트 bbox lazy-load. 그 전엔 단일 JSON 충분
- **데이터 확장 (Phase 4)**: 타 종류 통(담배꽁초/의류수거함/폐의약품함) 합치기, 사용자 제보(없음·넘침·위치 오류), 휴지통 사진
- **라우팅 품질 (Phase 5)**: 직선/격자 추정 → OSRM/GraphHopper turn-by-turn. 외부 API rate limit 트레이드오프 검토 필요. TTS 음성 안내도 후보
- **인프라/품질 (cross-cutting)**: vitest 도입(순수 함수 우선), Sentry/Vercel Observability, Lighthouse CI, i18n(en/ja/zh)
- **카카오맵 전환**: 한글 주소·로드뷰·POI 검색 필요해지면. 지금은 OSM 충분
- **DB 도입**: 사용자 제보·수정 기능 도입할 때 (Postgres + PostGIS)
- **인증**: 관리자 페이지 도입 시 (NextAuth / Clerk)

전체 작업 큐와 P 번호는 [`docs/tasks.md`](docs/tasks.md) 참고.

## 가드레일 (개발 시 주의)

- **Leaflet SSR 불가** → Map은 `dynamic(..., { ssr: false })`. 호출 페이지가 `'use client'`여야 동작
- **CSS 누락 함정** → `app/layout.tsx`에 `import 'leaflet/dist/leaflet.css'` 필수
- **react-leaflet 5의 MapContainer.className은 마운트 시점만 적용** → 런타임 토글하려면 wrapper div + CSS 자손 셀렉터. 동적 center/zoom은 `useMap()` 훅 컴포넌트로
- **iOS Safari + Geolocation** → plain HTTP에선 권한 prompt 거부. 항상 HTTPS production URL로 검증
- **Vercel deploy block: commit email** → GitHub 계정에 등록된 이메일로 커밋해야 통과. CLI는 generic "Unexpected error"만 떨굼 — dashboard에 사유
- **`watchPosition` cleanup** → useEffect cleanup + 토글 off에서 `clearWatch` 둘 다 필요. 안 하면 unmount 후에도 콜백
- **포트 충돌** → 3000 점유 시 `bun run dev`가 자동 3001로. 콘솔 메시지 확인
