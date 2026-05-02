import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '중구 휴지통 지도',
    short_name: '중구 휴지통',
    description: '서울 중구 가로휴지통 위치 시각화 (PROTO)',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    orientation: 'portrait',
    lang: 'ko',
    categories: ['utilities', 'maps'],
    icons: [
      { src: '/icon', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
