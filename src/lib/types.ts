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
  일반: { color: '#3b82f6', emoji: '🗑️' },
  재활용: { color: '#10b981', emoji: '♻️' },
};

export const MIXED_STYLE = { color: '#a855f7', emoji: '🗑️♻️' };

export function styleFor(types: BinType[]): { color: string; emoji: string } {
  if (types.length >= 2) return MIXED_STYLE;
  return TYPE_STYLE[types[0]];
}
