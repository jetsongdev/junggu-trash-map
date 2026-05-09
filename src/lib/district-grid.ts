import type { DistrictCode, DistrictMeta, Manifest } from './types';

export const GU_GRID_LAYOUT: readonly (readonly DistrictCode[])[] = [
  ['dobong', 'nowon', 'gangbuk', 'seongbuk', 'jungnang'],
  ['eunpyeong', 'jongno', 'dongdaemun', 'gwangjin', 'gangdong'],
  ['seodaemun', 'junggu', 'yongsan', 'seongdong', 'songpa'],
  ['mapo', 'yeongdeungpo', 'dongjak', 'seocho', 'gangnam'],
  ['gangseo', 'yangcheon', 'guro', 'geumcheon', 'gwanak'],
];

export function getDistrictForCell(
  row: number,
  col: number,
): DistrictCode | null {
  return GU_GRID_LAYOUT[row]?.[col] ?? null;
}

export function getCellForDistrict(
  code: DistrictCode,
): { row: number; col: number } | null {
  for (let row = 0; row < GU_GRID_LAYOUT.length; row += 1) {
    const col = GU_GRID_LAYOUT[row].indexOf(code);
    if (col !== -1) return { row, col };
  }
  return null;
}

export function getDistrictGridRows(manifest: Manifest): DistrictMeta[][] {
  const byCode = new Map(manifest.districts.map((d) => [d.code, d]));

  return GU_GRID_LAYOUT.map((row) =>
    row.map((code) => {
      const meta = byCode.get(code);
      if (!meta) throw new Error(`Missing district meta: ${code}`);
      return meta;
    }),
  );
}

export function boundsForDistrict(
  meta: DistrictMeta,
): [[number, number], [number, number]] {
  const [west, south, east, north] = meta.bbox;
  return [
    [south, west],
    [north, east],
  ];
}
