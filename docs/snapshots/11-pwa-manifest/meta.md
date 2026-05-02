---
index: 11
slug: pwa-manifest
date: 2026-05-02
phase: "Phase 2.2 — PWA manifest + iOS 풀스크린 메타"
git_sha: fa2d12d
viewport: 390x844
state: "다크 모드, 줌 14, 59 마커 전체. PWA manifest + 동적 아이콘 + iOS 메타 적용"
---

# 11 — PWA 설치 가능 (manifest + 아이콘 + iOS 메타)

iPad/모바일에서 Safari → 공유 → "홈 화면에 추가"로 풀스크린 PWA 동작. 동적 아이콘은 Next.js 16 Metadata Routes (`app/icon.tsx`, `app/apple-icon.tsx`)로 빌드 시점에 PNG 생성.

## 폴더 구성
- `screenshot.png` — 다크 테마 줌 14 전체 마커 (시각 변화는 전 단계와 동일, PWA는 head/네트워크 영역)
- `icon-192.png` — Android/Web manifest 아이콘 (192×192, 13KB) — `/icon` 응답 그대로
- `apple-icon-180.png` — iOS apple-touch-icon (180×180, 5.4KB) — `/apple-icon` 응답 그대로

## 변경
- **`src/app/manifest.ts`** — Next.js MetadataRoute.Manifest
  - `display: 'standalone'`, `orientation: 'portrait'`
  - `background_color`/`theme_color`: `#0a0a0a`
  - icons: 192 (any + maskable), 180 (apple)
  - `lang: 'ko'`, `categories: ['utilities', 'maps']`
- **`src/app/icon.tsx`** — `next/og` `ImageResponse`로 192×192 PNG 동적 생성. 다크 그라데이션 + 🗑️ 이모지
- **`src/app/apple-icon.tsx`** — 180×180 동일 디자인
- **`src/app/layout.tsx` metadata**:
  - `appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: '중구 휴지통' }`
  - `applicationName`, `formatDetection.telephone: false`

## 검증
- `bun run build` 통과 — `/icon`, `/apple-icon`, `/manifest.webmanifest` 정적 prerender
- 응답 검증:
  - `/manifest.webmanifest` → JSON 정상
  - `/icon` → `image/png` 13KB
  - `/apple-icon` → `image/png` 5.4KB
- HTML head 메타:
  - `<link rel="manifest" href="/manifest.webmanifest">`
  - `<link rel="apple-touch-icon" href="/apple-icon?...">`
  - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
  - `<meta name="apple-mobile-web-app-title" content="중구 휴지통">`
  - `<meta name="theme-color" content="#0a0a0a">`
  - `<meta name="format-detection" content="telephone=no">`

## iPad에서 확인 방법
1. https://junggu-trash-map.vercel.app 접속 (자동 deploy)
2. Safari 공유 시트 → "홈 화면에 추가" → 이름 "중구 휴지통" 확인
3. 홈 화면 아이콘 (다크 + 🗑️) 클릭 → 풀스크린 PWA 실행
4. Android Chrome은 자동 install banner도 띄움

## 다음 것
P2.5 URL 쿼리스트링 필터 상태, 또는 P2.3 클러스터링 (25구 확장 시).
