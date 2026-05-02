export type WalkingSpeed = 'slow' | 'normal' | 'fast';

export const WALKING_SPEEDS = {
  slow: { kmh: 3, label: '느림', emoji: '🐢' },
  normal: { kmh: 4, label: '보통', emoji: '🚶' },
  fast: { kmh: 5, label: '빠름', emoji: '🏃' },
} as const satisfies Record<WalkingSpeed, { kmh: number; label: string; emoji: string }>;

export const SPEED_CYCLE: WalkingSpeed[] = ['slow', 'normal', 'fast'];

export function nextSpeed(current: WalkingSpeed): WalkingSpeed {
  const i = SPEED_CYCLE.indexOf(current);
  return SPEED_CYCLE[(i + 1) % SPEED_CYCLE.length];
}

export function etaSeconds(meters: number, speed: WalkingSpeed): number {
  const metersPerSecond = (WALKING_SPEEDS[speed].kmh * 1000) / 3600;
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
