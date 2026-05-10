import { describe, expect, it } from 'vitest';
import {
  MAX_VISIBLE_TOASTS,
  markExiting,
  pushToast,
  removeToast,
  type ToastItem,
} from '../toast-queue';

function makeToast(id: number, exiting = false): ToastItem {
  return {
    id,
    text: `toast ${id}`,
    variant: 'info',
    position: 'center',
    durationMs: 1800,
    exiting,
  };
}

describe('pushToast', () => {
  it('pushes into an empty list without evicting', () => {
    const result = pushToast([], {
      id: 1,
      text: 'hello',
      variant: 'info',
      position: 'center',
      durationMs: 1800,
    });

    expect(result.next).toHaveLength(1);
    expect(result.next[0]).toEqual({
      id: 1,
      text: 'hello',
      variant: 'info',
      position: 'center',
      durationMs: 1800,
      exiting: false,
    });
    expect(result.evictedIds).toEqual([]);
  });

  it('pushes a third toast without evicting when list length is 2', () => {
    const result = pushToast([makeToast(1), makeToast(2)], {
      id: 3,
      text: 'third',
      variant: 'emphatic',
      position: 'top',
      durationMs: 4000,
    });

    expect(result.next).toHaveLength(MAX_VISIBLE_TOASTS);
    expect(result.next.map((toast) => toast.id)).toEqual([1, 2, 3]);
    expect(result.evictedIds).toEqual([]);
  });

  it('evicts the oldest toast when list length is 3', () => {
    const result = pushToast([makeToast(1), makeToast(2), makeToast(3)], {
      id: 4,
      text: 'fourth',
      variant: 'error',
      position: 'top',
      durationMs: 6000,
    });

    expect(result.next).toHaveLength(MAX_VISIBLE_TOASTS);
    expect(result.next.map((toast) => toast.id)).toEqual([2, 3, 4]);
    expect(result.evictedIds).toEqual([1]);
  });

  it('maintains chronological order', () => {
    let list: ToastItem[] = [];
    list = pushToast(list, {
      id: 1,
      text: 'first',
      variant: 'info',
      position: 'center',
      durationMs: 1800,
    }).next;
    list = pushToast(list, {
      id: 2,
      text: 'second',
      variant: 'info',
      position: 'center',
      durationMs: 1800,
    }).next;
    list = pushToast(list, {
      id: 3,
      text: 'third',
      variant: 'info',
      position: 'center',
      durationMs: 1800,
    }).next;

    expect(list.map((toast) => toast.id)).toEqual([1, 2, 3]);
  });
});

describe('markExiting', () => {
  it('sets exiting=true only on the matching id', () => {
    const result = markExiting([makeToast(1), makeToast(2), makeToast(3)], 2);

    expect(result).toEqual([makeToast(1), makeToast(2, true), makeToast(3)]);
  });

  it('returns the list unchanged when no id matches', () => {
    const list = [makeToast(1), makeToast(2)];

    expect(markExiting(list, 99)).toBe(list);
  });
});

describe('removeToast', () => {
  it('removes only the matching id', () => {
    const result = removeToast([makeToast(1), makeToast(2), makeToast(3)], 2);

    expect(result).toEqual([makeToast(1), makeToast(3)]);
  });

  it('returns an empty list unchanged', () => {
    const list: ToastItem[] = [];

    expect(removeToast(list, 1)).toBe(list);
  });
});
