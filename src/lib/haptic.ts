export const HAPTIC = {
  TAP: 6,
  SELECT: 12,
  CONFIRM: 18,
} as const;

export function vibrate(pattern: number | number[]): void {
  if (
    typeof navigator !== 'undefined' &&
    'vibrate' in navigator &&
    typeof navigator.vibrate === 'function'
  ) {
    navigator.vibrate(pattern);
  }
}
