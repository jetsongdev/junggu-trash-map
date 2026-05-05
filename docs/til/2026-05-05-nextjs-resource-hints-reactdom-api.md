# Next 16 App Router — `<head>`에 `<link rel=preconnect>` 직접 추가 X, `ReactDOM.preconnect()` API 사용

**일자**: 2026-05-05
**프로젝트**: junggu-trash-map
**관련 작업**: P2.14 perf 개선

## 문제

`src/app/layout.tsx`의 `<head>`에 `<link rel="preconnect">` / `<link rel="dns-prefetch">`를 직접 박는 방식으로 타일 서버·Nominatim 연결 워밍을 넣으려 했다.

그런데 Codex stop-gate가 Next 16 unsupported 패턴으로 바로 BLOCK. 이 버전에선 "예전 Next/App Router 감각대로 head에 link 꽂기"가 안전한 해법이 아니었다.

## 진단

Next 16 docs (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`)의 표에 답이 그대로 있었다:

| 태그 | Next 16 권장 방식 |
|------|-------------------|
| `<link rel="preconnect" />` | `ReactDOM.preconnect()` |
| `<link rel="dns-prefetch" />` | `ReactDOM.prefetchDNS()` |
| `<link rel="preload" />` | `ReactDOM.preload()` |

문서의 핵심 문장:

- Metadata API는 resource hints를 직접 지원하지 않음
- 대신 Client Component 안에서 ReactDOM 메서드로 `<head>`에 안전하게 삽입
- `preconnect`는 `ReactDOM.preconnect(href, { crossOrigin: '' })`
- `dns-prefetch`는 `ReactDOM.prefetchDNS(href)`

즉 Next 16 App Router에선 `<head>` 직접 편집보다, 전용 Client Component를 하나 두고 body에서 mount하는 패턴이 정석.

## 해결

직접 `<head>`에 `<link>`를 박는 대신, 별도 Client Component에서 ReactDOM resource hint API를 호출하도록 분리했다.

`src/app/preload-resources.tsx`

```tsx
'use client';

import ReactDOM from 'react-dom';

const TILE_ORIGINS = [
  'https://tile.openstreetmap.org',
  'https://a.basemaps.cartocdn.com',
  'https://b.basemaps.cartocdn.com',
  'https://c.basemaps.cartocdn.com',
  'https://d.basemaps.cartocdn.com',
];

const DNS_PREFETCH = ['https://nominatim.openstreetmap.org'];

export function PreloadResources(): null {
  for (const origin of TILE_ORIGINS) {
    ReactDOM.preconnect(origin, { crossOrigin: '' });
  }
  for (const origin of DNS_PREFETCH) {
    ReactDOM.prefetchDNS(origin);
  }
  return null;
}
```

`src/app/layout.tsx`

```tsx
import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { PreloadResources } from './preload-resources';
import 'leaflet/dist/leaflet.css';
import './globals.css';

export const metadata: Metadata = {
  title: '중구 휴지통 지도',
  description: '서울 중구 가로휴지통 위치 시각화 (PROTO)',
  applicationName: '중구 휴지통',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '중구 휴지통',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">
        <PreloadResources />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

핵심은 두 가지:

1. `layout.tsx`에 `<head>` 직접 link를 추가하지 않는다
2. body 안에 `<PreloadResources />`를 mount하면 ReactDOM이 실제 `<head>` resource hints를 안전하게 생성한다

## 교훈

### 1. Next 16 metadata API는 resource hints를 직접 지원 안 함 — ReactDOM API 별도 사용

`metadata` / `generateMetadata`로 되는 것과 안 되는 것을 구분해야 한다. `preconnect` / `dns-prefetch` / `preload`는 별도 트랙.

### 2. Next 16 패턴 모를 땐 `node_modules/next/dist/docs/01-app/` grep 우선

이 프로젝트는 "훈련 데이터 속 Next.js"가 아니라 실제 설치된 Next 16이 기준. 애매하면 추측보다 로컬 docs grep이 훨씬 빠르고 정확하다.

### 3. direct head vs ReactDOM 방식 lighthouse 효과 동일 — 권장 방식 따르는 게 long-term 안전

브라우저가 받는 최종 힌트는 같아도, 프레임워크가 허용하는 삽입 경로는 다르다. stop-gate랑 미래 업그레이드를 생각하면 권장 패턴으로 가는 편이 안전하다.

## 김동현 원펀치

Next 16에서 preconnect/prefetchDNS는 `<link>` 말고 `ReactDOM.preconnect()`로.
