export type HintKey = 'share' | 'favorite' | 'headsUp' | 'grid' | 'speed';

export const HINT_MESSAGES: Record<HintKey, string> = {
  share: '🔗 공유 버튼으로 이 경로를 공유할 수 있어요',
  favorite: '★ 즐겨찾기에 추가됐어요. 우상단 별 칩으로 즐겨찾기만 볼 수 있어요',
  headsUp: '🧭 헤드업: 지도가 시선 방향으로 회전합니다. 한 번 더 누르면 끕니다',
  grid: '📏 격자: 직선 대신 도로 격자 거리로 ETA를 계산합니다',
  speed: '🚶 현재 4 km/h (통상 보행). 2~7 km/h로 조절할 수 있어요',
};

export const HINT_DURATION_MS = 4000;

const STORAGE_PREFIX = 'hint:';

function storageKey(hint: HintKey): string {
  return `${STORAGE_PREFIX}${hint}`;
}

export function hasSeenHint(hint: HintKey, storage: Storage): boolean {
  try {
    return storage.getItem(storageKey(hint)) === 'true';
  } catch {
    return true;
  }
}

export function markHintSeen(hint: HintKey, storage: Storage): void {
  try {
    storage.setItem(storageKey(hint), 'true');
  } catch {
    // Quota / disabled storage — silently fail; hint just re-fires next session.
  }
}
