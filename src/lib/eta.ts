export type WalkingSpeedPreset = 'slow' | 'normal' | 'fast';
export type WalkingSpeed = number | WalkingSpeedPreset;

export const WALKING_SPEEDS = {
  slow: { kmh: 3, label: '느림', emoji: '🐢' },
  normal: { kmh: 4, label: '보통', emoji: '🚶' },
  fast: { kmh: 5, label: '빠름', emoji: '🏃' },
} as const satisfies Record<WalkingSpeedPreset, { kmh: number; label: string; emoji: string }>;

export const SPEED_CYCLE: WalkingSpeedPreset[] = ['slow', 'normal', 'fast'];

export const MIN_KMH = 2;
export const MAX_KMH = 7;
export const STEP_KMH = 0.5;
export const DEFAULT_KMH = 4;

export function nextSpeed(current: WalkingSpeedPreset): WalkingSpeedPreset {
  const i = SPEED_CYCLE.indexOf(current);
  return SPEED_CYCLE[(i + 1) % SPEED_CYCLE.length];
}

export function speedToKmh(speed: WalkingSpeed): number {
  return typeof speed === 'number' ? speed : WALKING_SPEEDS[speed].kmh;
}

export function clampKmh(kmh: number): number {
  if (!Number.isFinite(kmh)) return DEFAULT_KMH;
  return Math.min(MAX_KMH, Math.max(MIN_KMH, kmh));
}

export function getSpeedDisplay(kmh: number): { emoji: string; label: string } {
  if (kmh < 3.5) return { emoji: '🐢', label: '느림' };
  if (kmh < 4.5) return { emoji: '🚶', label: '보통' };
  return { emoji: '🏃', label: '빠름' };
}

export function formatKmh(kmh: number): string {
  return Number.isInteger(kmh) ? `${kmh}` : kmh.toFixed(1);
}

export function etaSeconds(meters: number, speed: WalkingSpeed): number {
  const kmh = speedToKmh(speed);
  const metersPerSecond = (kmh * 1000) / 3600;
  return meters / metersPerSecond;
}

export function formatEta(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `약 ${total}초`;
  const min = Math.floor(total / 60);
  const sec = total % 60;
  if (sec === 0) return `약 ${min}분`;
  return `약 ${min}분 ${sec}초`;
}
