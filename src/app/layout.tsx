import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { PreloadResources } from './preload-resources';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
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
    <html lang="ko" className="h-full overflow-hidden antialiased">
      <body className="h-full overflow-hidden overscroll-none">
        <PreloadResources />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
