import { describe, expect, it } from 'vitest';
import { offerWait, postcardPlan, type GateLeg } from './postcards';

const TODAY = '2026-11-13', YESTERDAY = '2026-11-12';
const leg = (id: string, doneOn?: string): GateLeg => ({ id, gateOn: doneOn, doneOn });

describe('postcards: offered once, only on a real arrival (575 review 3)', () => {
  it('(1) a gate done 3 days ago gets no offer after a restore, and goes to the Journal as kept', () => {
    expect(postcardPlan([leg('a', '2026-11-10')], [], TODAY, YESTERDAY)).toEqual({ offer: null, silent: ['a'] });
  });
  it('(2) a gate done yesterday gets exactly one offer, and not again once kept', () => {
    expect(postcardPlan([leg('a', YESTERDAY)], [], TODAY, YESTERDAY)).toEqual({ offer: 0, silent: [] });
    expect(postcardPlan([leg('a', YESTERDAY)], ['a'], TODAY, YESTERDAY)).toEqual({ offer: null, silent: [] });
  });
  it('(3) no offer while the strip moves; it comes once the strip settles', () => {
    const loaded = 0;
    expect(offerWait(5_000, loaded, 4_900, true)).toBeNull();
    expect(offerWait(5_000, loaded, 4_900, false)).toBe(500);
    expect(offerWait(5_600, loaded, 4_900, false)).toBe(0);
    expect(offerWait(300, loaded, -10_000, false)).toBe(600);
  });
  it('(4) fresh storage with 3 old gates and 1 done today gets exactly 1 offer', () => {
    const legs = [leg('a', '2026-11-01'), leg('b', '2026-11-05'), leg('c', '2026-11-09'), leg('d', TODAY), leg('e')];
    expect(postcardPlan(legs, [], TODAY, YESTERDAY)).toEqual({ offer: 3, silent: ['a', 'b', 'c'] });
    expect(postcardPlan(legs.slice(0, 3), [], TODAY, YESTERDAY).offer).toBeNull();
  });
});
