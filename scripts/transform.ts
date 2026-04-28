#!/usr/bin/env bun
/**
 * 전국휴지통표준데이터 CSV → public/data/<자치구>.json
 *
 * Usage:
 *   bun scripts/transform.ts <input.csv> <output.json>
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BIN_TYPES, type BinType, type TrashBin } from '../src/lib/types';

const TYPE_MAP: Record<string, BinType> = {
  일반쓰레기: '일반',
  재활용쓰레기: '재활용',
};

const CSV = {
  name: '설치장소명',
  sido: '시도명',
  sigungu: '시군구명',
  roadAddress: '소재지도로명주소',
  jibunAddress: '소재지지번주소',
  lat: '위도',
  lng: '경도',
  detail: '세부위치',
  type: '휴지통종류',
  manager: '관리기관명',
  managerTel: '관리기관전화번호',
  updatedAt: '데이터기준일자',
} as const;

type Row = Record<string, string>;
type RawBin = Omit<TrashBin, 'types'> & { type: BinType };

function parseCsv(text: string): Row[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQ = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQ = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') {
        cur.push(field);
        field = '';
      } else if (c === '\n') {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = '';
      } else if (c !== '\r') {
        field += c;
      }
    }
  }
  if (field || cur.length) {
    cur.push(field);
    rows.push(cur);
  }

  const [header, ...data] = rows;
  return data
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), r[i] ?? ''])));
}

function readCsv(path: string): Row[] {
  let raw = readFileSync(path, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return parseCsv(raw);
}

function rowToBin(r: Row): RawBin | null {
  const lat = parseFloat(r[CSV.lat]);
  const lng = parseFloat(r[CSV.lng]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const rawType = (r[CSV.type] || '').trim();
  const type = TYPE_MAP[rawType];
  if (!type) {
    console.warn(`[skip] unknown type "${rawType}" at "${r[CSV.name]}"`);
    return null;
  }

  return {
    id: '',
    name: r[CSV.name].trim(),
    sido: r[CSV.sido].trim(),
    sigungu: r[CSV.sigungu].trim(),
    roadAddress: r[CSV.roadAddress].trim(),
    jibunAddress: r[CSV.jibunAddress].trim() || undefined,
    lat,
    lng,
    detail: r[CSV.detail].trim() || undefined,
    type,
    manager: r[CSV.manager].trim() || undefined,
    managerTel: r[CSV.managerTel].trim() || undefined,
    updatedAt: r[CSV.updatedAt].trim(),
  };
}

function mergeInto(existing: TrashBin, r: RawBin): void {
  if (!existing.types.includes(r.type)) existing.types.push(r.type);
  if (r.name.length > existing.name.length) existing.name = r.name;
  if (!existing.detail && r.detail) existing.detail = r.detail;
  if (!existing.jibunAddress && r.jibunAddress) existing.jibunAddress = r.jibunAddress;
  if (!existing.roadAddress && r.roadAddress) existing.roadAddress = r.roadAddress;
}

function idPrefix(sigungu: string | undefined): string {
  if (sigungu === '중구') return 'JG';
  return (sigungu ?? 'XX').slice(0, 2);
}

function groupByCoord(rows: (RawBin | null)[]): TrashBin[] {
  const groups = new Map<string, TrashBin>();

  for (const r of rows) {
    if (!r) continue;
    const key = `${r.lat.toFixed(6)},${r.lng.toFixed(6)}`;
    const existing = groups.get(key);
    if (existing) {
      mergeInto(existing, r);
    } else {
      const { type, ...rest } = r;
      groups.set(key, { ...rest, types: [type] });
    }
  }

  const list = [...groups.values()];
  list.forEach((b) =>
    b.types.sort((a, c) => BIN_TYPES.indexOf(a) - BIN_TYPES.indexOf(c)),
  );
  list.sort((a, b) => a.lat - b.lat || a.lng - b.lng);

  const prefix = idPrefix(list[0]?.sigungu);
  list.forEach((b, i) => {
    b.id = `${prefix}-${String(i + 1).padStart(4, '0')}`;
  });

  return list;
}

function main() {
  const [, , inputArg, outputArg] = process.argv;
  if (!inputArg || !outputArg) {
    console.error('Usage: bun scripts/transform.ts <input.csv> <output.json>');
    process.exit(1);
  }
  const input = resolve(inputArg);
  const output = resolve(outputArg);

  const rows = readCsv(input);
  const bins = groupByCoord(rows.map(rowToBin));

  writeFileSync(output, JSON.stringify(bins, null, 2) + '\n', 'utf8');

  const single = bins.filter((b) => b.types.length === 1).length;
  const mixed = bins.filter((b) => b.types.length >= 2).length;
  console.log(`✓ wrote ${bins.length} bins → ${output}`);
  console.log(`  single-type: ${single}, mixed: ${mixed}, total raw rows: ${rows.length}`);
}

main();
