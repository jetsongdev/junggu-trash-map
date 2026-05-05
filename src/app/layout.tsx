import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
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
      <head>
        <link rel="preconnect" href="https://tile.openstreetmap.org" crossOrigin="" />
        <link rel="preconnect" href="https://a.basemaps.cartocdn.com" crossOrigin="" />
        <link rel="preconnect" href="https://b.basemaps.cartocdn.com" crossOrigin="" />
        <link rel="preconnect" href="https://c.basemaps.cartocdn.com" crossOrigin="" />
        <link rel="preconnect" href="https://d.basemaps.cartocdn.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://nominatim.openstreetmap.org" />
      </head>
      <body className="min-h-full">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
