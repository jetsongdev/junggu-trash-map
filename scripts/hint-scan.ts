#!/usr/bin/env bun
/**
 * 자치구의 휴지통 좌표 주변 POI를 Kakao Local API로 스캔해 hint 작성 후보를 출력.
 *
 * Usage:
 *   KAKAO_REST_API_KEY=... bun scripts/hint-scan.ts <district> [--limit N] [--top K]
 *
 *   # 1Password CLI 연동
 *   KAKAO_REST_API_KEY=$(op read 'op://side-project/kakao-developers/TRASH_KAKAO_REST_API_KEY') \
 *     bun scripts/hint-scan.ts junggu --limit 10
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { TrashBin } from '../src/lib/types';

const CATEGORIES = [
  { code: 'AT4', label: '관광명소' },
  { code: 'SW8', label: '지하철' },
  { code: 'BK9', label: '은행' },
  { code: 'PK6', label: '주차장' },
  { code: 'CS2', label: '편의점' },
] as const;

const RADIUS_METERS = 50;
const THROTTLE_MS = 50;
const DEFAULT_TOP = 4;

type KakaoPlace = {
  place_name: string;
  category_name: string;
  category_group_code: string;
  road_address_name: string;
  distance: string;
  x: string;
  y: string;
};

type KakaoResp = {
  documents: KakaoPlace[];
  meta: { total_count: number };
};

async function fetchCategory(
  apiKey: string,
  catCode: string,
  lat: number,
  lng: number,
): Promise<KakaoPlace[]> {
  const url = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=${catCode}&x=${lng}&y=${lat}&radius=${RADIUS_METERS}&sort=distance`;
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kakao ${res.status}: ${text.slice(0, 120)}`);
  }
  const json = (await res.json()) as KakaoResp;
  return json.documents;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function pad(s: string, n: number): string {
  // 한글 폭 2 가정으로 단순 패딩
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) > 0x7f ? 2 : 1;
  return s + ' '.repeat(Math.max(0, n - w));
}

function parseFlags(argv: string[]): {
  district: string | null;
  limit: number | null;
  top: number;
} {
  let district: string | null = null;
  let limit: number | null = null;
  let top = DEFAULT_TOP;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--limit') {
      limit = parseInt(argv[++i] ?? '', 10);
    } else if (a === '--top') {
      top = parseInt(argv[++i] ?? '', 10) || DEFAULT_TOP;
    } else if (!district) {
      district = a;
    }
  }
  return { district, limit, top };
}

async function main() {
  const { district, limit, top } = parseFlags(process.argv.slice(2));
  if (!district) {
    console.error('Usage: bun scripts/hint-scan.ts <district-code> [--limit N] [--top K]');
    console.error('Example: bun scripts/hint-scan.ts junggu --limit 10');
    process.exit(1);
  }
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    console.error('KAKAO_REST_API_KEY env var required');
    console.error('  export KAKAO_REST_API_KEY=...');
    console.error("  또는 KAKAO_REST_API_KEY=$(op read '...') bun scripts/hint-scan.ts ...");
    process.exit(1);
  }

  const path = resolve(`public/data/districts/${district}.json`);
  const all = JSON.parse(readFileSync(path, 'utf8')) as TrashBin[];
  const bins = limit ? all.slice(0, limit) : all;

  const reqs = bins.length * CATEGORIES.length;
  console.error(
    `scanning ${bins.length}/${all.length} bins in ${district} — ${CATEGORIES.length} cats × ${RADIUS_METERS}m radius (~${reqs} requests, ~${Math.ceil((reqs * THROTTLE_MS) / 1000)}s)`,
  );
  console.error('');

  for (const bin of bins) {
    const collected: { label: string; place: KakaoPlace }[] = [];
    for (const cat of CATEGORIES) {
      try {
        const places = await fetchCategory(apiKey, cat.code, bin.lat, bin.lng);
        for (const p of places) collected.push({ label: cat.label, place: p });
      } catch (e) {
        console.error(`[${bin.id}] ${cat.code} error: ${(e as Error).message}`);
      }
      await sleep(THROTTLE_MS);
    }

    // 중복 place_name 제거 (가장 가까운 매치 유지)
    const seen = new Set<string>();
    const unique = collected.filter((p) => {
      if (seen.has(p.place.place_name)) return false;
      seen.add(p.place.place_name);
      return true;
    });
    unique.sort(
      (a, b) => parseInt(a.place.distance, 10) - parseInt(b.place.distance, 10),
    );
    const topPlaces = unique.slice(0, top);

    console.log(
      `${bin.id} (${bin.lat.toFixed(5)}, ${bin.lng.toFixed(5)}) ${bin.name}`,
    );
    if (topPlaces.length === 0) {
      console.log(`  주변 ${RADIUS_METERS}m POI 없음 — 좌표 직접 카카오맵 확인 필요`);
    } else {
      console.log(`  주변 ${RADIUS_METERS}m POI:`);
      for (const p of topPlaces) {
        const dist = `${p.place.distance}m`.padStart(5);
        console.log(`    ${pad(`[${p.label}]`, 10)}${pad(p.place.place_name, 36)}${dist}`);
      }
      console.log(`  💡 hint 초안 (검증 필요): "${topPlaces[0].place.place_name} 옆"`);
    }
    console.log('');
  }

  console.error(`done — ${bins.length} bins scanned`);
}

main().catch((e) => {
  console.error('fatal:', e);
  process.exit(1);
});
