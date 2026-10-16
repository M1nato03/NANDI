import { describe, expect, it } from 'vitest';
import { CHECK_INTERVAL_MS, SNOOZE_MS, isNewerVersion, isUpdateSnoozed, shouldCheckForUpdate, visibleUpdate } from './updates';

describe('Android update decisions', () => {
  it('does nothing on web', () => {
    expect(shouldCheckForUpdate(false, null, 100)).toBe(false);
    expect(visibleUpdate(false, 2, 1, null, null, 100)).toBe(false);
  });
  it('checks at launch and waits six hours between automatic checks', () => {
    expect(shouldCheckForUpdate(true, null, 100)).toBe(true);
    expect(shouldCheckForUpdate(true, 100, 100 + CHECK_INTERVAL_MS - 1)).toBe(false);
    expect(shouldCheckForUpdate(true, 100, 100 + CHECK_INTERVAL_MS)).toBe(true);
  });
  it('checks again if the device clock moved backward', () => {
    expect(shouldCheckForUpdate(true, 200, 100)).toBe(true);
  });
  it('compares Android version codes, not version names', () => {
    expect(isNewerVersion(11, 10)).toBe(true);
    expect(isNewerVersion(10, 10)).toBe(false);
    expect(isNewerVersion(9, 10)).toBe(false);
  });
  it('hides Later for one day', () => {
    expect(isUpdateSnoozed(11, 11, 100, 100 + SNOOZE_MS - 1)).toBe(true);
    expect(visibleUpdate(true, 11, 10, 11, 100, 100 + SNOOZE_MS - 1)).toBe(false);
    expect(visibleUpdate(true, 11, 10, 11, 100, 100 + SNOOZE_MS)).toBe(true);
  });
  it('shows the next newer version during a snooze', () => {
    expect(visibleUpdate(true, 12, 10, 11, 100, 101)).toBe(true);
  });
});
