# 🗑️ 중구 휴지통 지도 (PROTO)

서울 중구 가로휴지통 위치를 지도 위에 시각화하는 PWA 프로토타입.

- Bun · Next.js 16 (App Router) · TypeScript strict · Tailwind v4
- Leaflet + react-leaflet + OpenStreetMap (API 키 0)

## 🚀 배포

- **Production**: https://junggu-trash-map.vercel.app
- **Repo**: https://github.com/jetsongdev/junggu-trash-map (private)
- **Vercel 대시보드**: https://vercel.com/ssssccccchhhhhs-projects/junggu-trash-map

iPad/모바일에서 실제 GPS 권한까지 테스트하려면 위 URL로 접속 (HTTPS 필수). LAN 직접 접근은 Geolocation에 한계 — `http://192.168.x.x:3001`은 Safari가 권한 prompt 거부.

## 실행

```bash
bun install
bun run dev   # http://localhost:3000
bun run build # production build (Turbopack)
```

## 디렉토리

```
src/
├── app/{layout,page,globals.css}
├── components/{Map,BinMarker,BinPopup,FilterChips}.tsx
└── lib/{types,data}.ts
public/data/junggu.json   # mock 15개
```

## 실데이터 교체 방법

1. [공공데이터포털 — 전국휴지통표준데이터](https://www.data.go.kr/data/15129450/standard.do)에서 CSV 또는 JSON 받기.
2. 컬럼을 `src/lib/types.ts`의 `TrashBin` 타입에 맞춰 변환:
   - `관리번호 → id`
   - `설치장소명 → name`
   - `소재지도로명주소 → roadAddress`
   - `소재지지번주소 → jibunAddress`
   - `위도 → lat`, `경도 → lng` (WGS84 그대로)
   - `세부위치 → detail`
   - `종류 → type` (`일반|재활용|담배꽁초|기타`로 매핑)
   - `관리기관명 → manager`, `관리기관전화번호 → managerTel`
   - `데이터기준일자 → updatedAt`
3. `시도 === '서울특별시' && 시군구 === '중구'`로 필터링 후 `public/data/junggu.json`에 덮어쓰기.
4. 좌표가 KATEC/TM 등 다른 좌표계라면 별도 변환 필요. 표준데이터는 WGS84로 제공됨.

## 다음 단계 결정 포인트

- **좌표 정확도**: 현재 mock은 근사치. 실데이터 받으면 검수 필요.
- **데이터 양 25개 구**: JSON 한 덩어리가 1MB 넘기 시작하면 자치구별 파일 분할 또는 Next API Route로 전환.
- **카카오맵 전환**: 한글 주소·로드뷰가 필요해지면. 그 전까진 OSM으로 충분.
- **DB 도입**: 사용자가 추가/제보 기능 들어갈 때.

## 가드레일 (개발 시 주의)

- Leaflet은 SSR 불가 → Map은 `dynamic(..., { ssr: false })` 그리고 import 측 컴포넌트는 `'use client'`.
- `app/layout.tsx`에서 `import 'leaflet/dist/leaflet.css'` 빠뜨리면 타일 깨짐.
- `bun run dev`가 다른 프로세스가 3000 점유 시 자동으로 3001 폴백. 콘솔 메시지 확인.
