import { NextRequest, NextResponse } from 'next/server';
import { searchNominatim } from '@/lib/search';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (!query) {
    return NextResponse.json([], {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  try {
    const results = await searchNominatim(query);
    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error: unknown) {
    console.error('Search request failed', error);
    return NextResponse.json(
      { message: '검색 결과를 가져오지 못했습니다.' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
}
