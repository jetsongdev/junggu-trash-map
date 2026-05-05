export const BIN_TYPES = ['일반', '재활용'] as const;

export type BinType = (typeof BIN_TYPES)[number];

export type TrashBin = {
  id: string;
  name: string;
  sido: string;
  sigungu: string;
  roadAddress: string;
  jibunAddress?: string;
  lat: number;
  lng: number;
  detail?: string;
  types: BinType[];
  manager?: string;
  managerTel?: string;
  updatedAt: string;
};

export const TYPE_STYLE: Record<BinType, { color: string; emoji: string }> = {
  일반: { color: '#60a5fa', emoji: '🗑️' },
  재활용: { color: '#34d399', emoji: '♻️' },
};

export const MIXED_STYLE = { color: '#c084fc', emoji: '🗑️♻️' };

export function styleFor(types: BinType[]): { color: string; emoji: string } {
  if (types.length >= 2) return MIXED_STYLE;
  return TYPE_STYLE[types[0]];
}

export type DistrictCode = string;

export type DistrictMeta = {
  code: DistrictCode;
  name: string;
  binCount: number;
  bbox: [number, number, number, number];
  centroid: [number, number];
  adjacent: DistrictCode[];
};

export type Manifest = {
  version: string;
  districts: DistrictMeta[];
};
