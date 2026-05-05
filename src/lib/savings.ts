export type Savings = {
  totalMeters: number;
  totalSeconds: number;
  uses: number;
};

const STORAGE_KEY = 'savings';

const EMPTY_SAVINGS: Savings = {
  totalMeters: 0,
  totalSeconds: 0,
  uses: 0,
};

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function loadSavings(): Savings {
  if (typeof window === 'undefined') return EMPTY_SAVINGS;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_SAVINGS;

  try {
    const parsed = JSON.parse(raw) as Partial<Savings>;
    return {
      totalMeters: numberOrZero(parsed.totalMeters),
      totalSeconds: numberOrZero(parsed.totalSeconds),
      uses: numberOrZero(parsed.uses),
    };
  } catch {
    return EMPTY_SAVINGS;
  }
}

export function saveSavings(savings: Savings): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savings));
}

export function addUse(savings: Savings, meters: number, seconds: number): Savings {
  return {
    totalMeters: savings.totalMeters + meters,
    totalSeconds: savings.totalSeconds + seconds,
    uses: savings.uses + 1,
  };
}

export function formatSavingsLine(savings: Savings): string {
  const totalMeters = Math.round(savings.totalMeters);
  const totalSeconds = Math.max(0, Math.round(savings.totalSeconds));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `🌱 +${totalMeters}m · ${minutes}분 ${seconds}초 (${savings.uses}회)`;
}
