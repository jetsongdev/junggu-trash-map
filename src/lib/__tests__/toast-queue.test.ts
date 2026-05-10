import { describe, expect, it } from 'vitest';
import {
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
  it('pushes into an empty list', () => {
    const result = pushToast([], {
      id: 1,
      text: 'hello',
      variant: 'info',
      position: 'center',
      durationMs: 1800,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 1,
      text: 'hello',
      variant: 'info',
      position: 'center',
      durationMs: 1800,
      exiting: false,
    });
  });

  it('appends to the end of an existing list', () => {
    const result = pushToast([makeToast(1), makeToast(2)], {
      id: 3,
      text: 'third',
      variant: 'emphatic',
      position: 'top',
      durationMs: 4000,
    });

    expect(result).toHaveLength(3);
    expect(result.map((toast) => toast.id)).toEqual([1, 2, 3]);
  });

  it('stacks beyond 3 without dropping anything', () => {
    let list: ToastItem[] = [];
    for (let i = 1; i <= 5; i++) {
      list = pushToast(list, {
        id: i,
        text: `toast ${i}`,
        variant: 'info',
        position: 'center',
        durationMs: 1800,
      });
    }

    expect(list).toHaveLength(5);
    expect(list.map((toast) => toast.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('maintains chronological order', () => {
    let list: ToastItem[] = [];
    list = pushToast(list, {
      id: 1,
      text: 'first',
      variant: 'info',
      position: 'center',
      durationMs: 1800,
    });
    list = pushToast(list, {
      id: 2,
      text: 'second',
      variant: 'info',
      position: 'center',
      durationMs: 1800,
    });
    list = pushToast(list, {
      id: 3,
      text: 'third',
      variant: 'info',
      position: 'center',
      durationMs: 1800,
    });

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
