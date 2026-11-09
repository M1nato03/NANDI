import { describe, expect, it } from 'vitest';
import raw from '../../ui/courtyard/anchors.json';
import { parseAnchors } from './anchors';
import { LAYOUT_B_NUDGES, nudgeAnchors } from './nudges';

describe('layout-B nudges (b2 9 Nov: the beside rule at ≤ 6 px)', () => {
  it('moves a nudged friend’s foot, tap and glow together, and a nudged prop, and leaves the rest as the pass wrote it', () => {
    const pass = parseAnchors(raw), nudged = nudgeAnchors(pass);
    const [dx] = LAYOUT_B_NUDGES.friends.kachhua!;
    expect(nudged.friends.kachhua.foot[0] - pass.friends.kachhua.foot[0]).toBe(dx);
    expect(nudged.friends.kachhua.tap[0] - pass.friends.kachhua.tap[0]).toBe(dx);
    expect(nudged.friends.kachhua.glow[0] - pass.friends.kachhua.glow[0]).toBe(dx);
    expect(nudged.props['kapi-kite']![0] - pass.props['kapi-kite']![0]).toBe(LAYOUT_B_NUDGES.props['kapi-kite']![0]);
    expect(nudged.friends.nandi).toEqual(pass.friends.nandi);
    expect(nudged.props['nandi-medals']).toEqual(pass.props['nandi-medals']);
    expect(pass.friends.kachhua.foot[0]).toBe(357);
  });
  it('a nudge for a prop the pass does not have changes nothing', () => {
    const pass = parseAnchors(raw);
    expect(nudgeAnchors(pass, { friends: {}, props: { 'no-such-prop': [5, 5] } }).props).toEqual(pass.props);
  });
});
