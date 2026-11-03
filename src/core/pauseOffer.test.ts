import { describe, expect, it } from 'vitest';
import type { SettingRow } from '../data/types';
import { pauseOfferDue, PAUSE_OFFER_KEY } from './pauseOffer';

const setting = (key: string, value: unknown): SettingRow => ({ key, value, updatedAt: 1, deleted: 0, deviceId: 't' });
const fresh = [setting('profile.size', 'two'), setting('profile.goals', ['learn'])];
const today = '2026-11-04';

describe('spec 52 D: the pause offer after the first finish', () => {
  it('comes once, only where the card works, only before it is set up, and only after the new Welcome', () => {
    expect(pauseOfferDue(fresh, today, true)).toBe(true);
    expect(pauseOfferDue(fresh, today, false)).toBe(false);
    expect(pauseOfferDue([...fresh, setting(PAUSE_OFFER_KEY, 'shown')], today, true)).toBe(false);
    expect(pauseOfferDue([...fresh, setting(PAUSE_OFFER_KEY, 'not-now')], today, true)).toBe(false);
    expect(pauseOfferDue([...fresh, setting('pause.card.on', true)], today, true)).toBe(false);
    // An install from before spec 52 has no size row: nothing changes for it.
    expect(pauseOfferDue([], today, true)).toBe(false);
  });
});
