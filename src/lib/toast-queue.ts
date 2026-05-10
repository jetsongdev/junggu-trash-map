export type ToastVariant = 'info' | 'emphatic' | 'error';
export type ToastPosition = 'center' | 'top';

export interface ToastItem {
  id: number;
  text: string;
  variant: ToastVariant;
  position: ToastPosition;
  durationMs: number;
  exiting: boolean;
}

export const MAX_VISIBLE_TOASTS = 3;

export function pushToast(
  list: ToastItem[],
  next: Omit<ToastItem, 'exiting'>,
): { next: ToastItem[]; evictedIds: number[] } {
  const item = { ...next, exiting: false };
  if (list.length < MAX_VISIBLE_TOASTS) {
    return { next: [...list, item], evictedIds: [] };
  }

  const evicted = list.slice(0, list.length - MAX_VISIBLE_TOASTS + 1);
  return {
    next: [...list.slice(evicted.length), item],
    evictedIds: evicted.map((toast) => toast.id),
  };
}

export function markExiting(list: ToastItem[], id: number): ToastItem[] {
  let changed = false;
  const next = list.map((toast) => {
    if (toast.id !== id) return toast;
    changed = true;
    return { ...toast, exiting: true };
  });

  return changed ? next : list;
}

export function removeToast(list: ToastItem[], id: number): ToastItem[] {
  const next = list.filter((toast) => toast.id !== id);
  return next.length === list.length ? list : next;
}
