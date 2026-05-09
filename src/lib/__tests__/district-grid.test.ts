import { describe, expect, it } from 'vitest';

import {
  GU_GRID_LAYOUT,
  boundsForDistrict,
  getCellForDistrict,
  getDistrictForCell,
} from '../district-grid';
import type { DistrictMeta } from '../types';

const EXPECTED_GRID = [
  ['dobong', 'nowon', 'gangbuk', 'seongbuk', 'jungnang'],
  ['eunpyeong', 'jongno', 'dongdaemun', 'gwangjin', 'gangdong'],
  ['seodaemun', 'junggu', 'yongsan', 'seongdong', 'songpa'],
  ['mapo', 'yeongdeungpo', 'dongjak', 'seocho', 'gangnam'],
  ['gangseo', 'yangcheon', 'guro', 'geumcheon', 'gwanak'],
] as const;

const ALL_SEOUL_DISTRICTS = [
  'gangbuk',
  'gangdong',
  'gangnam',
  'gangseo',
  'geumcheon',
  'guro',
  'gwanak',
  'gwangjin',
  'dobong',
  'dongdaemun',
  'dongjak',
  'eunpyeong',
  'junggu',
  'jungnang',
  'jongno',
  'mapo',
  'nowon',
  'seocho',
  'seodaemun',
  'seongbuk',
  'seongdong',
  'songpa',
  'yangcheon',
  'yeongdeungpo',
  'yongsan',
] as const;

describe('GU_GRID_LAYOUT', () => {
  it('contains all 25 Seoul districts in a 5x5 grid with no empty cells', () => {
    expect(GU_GRID_LAYOUT).toHaveLength(5);
    expect(GU_GRID_LAYOUT.every((row) => row.length === 5)).toBe(true);

    const cells = GU_GRID_LAYOUT.flat();
    expect(cells).toHaveLength(25);
    expect(cells.every(Boolean)).toBe(true);
    expect(new Set(cells).size).toBe(25);
    expect([...cells].sort()).toEqual([...ALL_SEOUL_DISTRICTS].sort());
  });

  it('returns the expected district for each grid position', () => {
    EXPECTED_GRID.forEach((row, rowIndex) => {
      row.forEach((code, colIndex) => {
        expect(getDistrictForCell(rowIndex, colIndex)).toBe(code);
        expect(getCellForDistrict(code)).toEqual({
          row: rowIndex,
          col: colIndex,
        });
      });
    });
  });

  it('returns null for cells outside the grid', () => {
    expect(getDistrictForCell(-1, 0)).toBeNull();
    expect(getDistrictForCell(0, -1)).toBeNull();
    expect(getDistrictForCell(5, 0)).toBeNull();
    expect(getDistrictForCell(0, 5)).toBeNull();
    expect(getCellForDistrict('unknown')).toBeNull();
  });
});

describe('boundsForDistrict', () => {
  it('converts manifest bbox order to Leaflet bounds order', () => {
    const meta: DistrictMeta = {
      code: 'junggu',
      name: '중구',
      binCount: 59,
      bbox: [126.965, 37.546, 127.02, 37.575],
      centroid: [126.998, 37.563],
      adjacent: [],
    };

    expect(boundsForDistrict(meta)).toEqual([
      [37.546, 126.965],
      [37.575, 127.02],
    ]);
  });
});
