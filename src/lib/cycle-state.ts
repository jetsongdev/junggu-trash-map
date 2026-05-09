import type { LatLng } from './geo';

export type CompassMode = 'off' | 'cone' | 'head-up';
export type CycleState = 'pending' | 'off' | 'gps' | 'cone' | 'head-up';

/**
 * 좌하단 cycle 버튼의 5-state 산출.
 *
 * Priority: locatePending > userLocation > compassMode.
 *
 * - locatePending=true → 'pending' (다른 입력 무시)
 * - userLocation=null → 'off' (compassMode 무시: GPS 없으면 방향 모드 의미 없음)
 * - userLocation set, compassMode='off' → 'gps'
 * - userLocation set, compassMode='cone' → 'cone'
 * - userLocation set, compassMode='head-up' → 'head-up'
 */
export function computeCycleState(
  locatePending: boolean,
  userLocation: LatLng | null,
  compassMode: CompassMode,
): CycleState {
  if (locatePending) return 'pending';
  if (!userLocation) return 'off';
  if (compassMode === 'off') return 'gps';
  return compassMode;
}
