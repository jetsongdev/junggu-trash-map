import { describe, expect, it } from 'vitest';
import { computeCycleState } from '../cycle-state';
import type { LatLng } from '../geo';

const SEOUL: LatLng = { lat: 37.5635, lng: 126.987 };

describe('computeCycleState', () => {
  it("returns 'pending' when locatePending is true (regardless of other inputs)", () => {
    expect(computeCycleState(true, null, 'off')).toBe('pending');
    expect(computeCycleState(true, SEOUL, 'cone')).toBe('pending');
    expect(computeCycleState(true, SEOUL, 'head-up')).toBe('pending');
  });

  it("returns 'off' when userLocation is null and not pending", () => {
    expect(computeCycleState(false, null, 'off')).toBe('off');
  });

  it("ignores compassMode when userLocation is null (방향은 GPS 의존)", () => {
    expect(computeCycleState(false, null, 'cone')).toBe('off');
    expect(computeCycleState(false, null, 'head-up')).toBe('off');
  });

  it("returns 'gps' when userLocation set and compass off", () => {
    expect(computeCycleState(false, SEOUL, 'off')).toBe('gps');
  });

  it("returns 'cone' when userLocation set and compass cone", () => {
    expect(computeCycleState(false, SEOUL, 'cone')).toBe('cone');
  });

  it("returns 'head-up' when userLocation set and compass head-up", () => {
    expect(computeCycleState(false, SEOUL, 'head-up')).toBe('head-up');
  });
});
