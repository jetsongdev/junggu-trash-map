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

export function pushToast(
  list: ToastItem[],
  next: Omit<ToastItem, 'exiting'>,
): ToastItem[] {
  return [...list, { ...next, exiting: false }];
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
