import { describe, expect, it } from 'vitest';
import raw from '../../ui/courtyard/anchors.json';
import { EDGE_CSS, parseAnchors, type Rect } from './anchors';
import { AREAS } from './courtyard';
import { LAYOUT_B_PLACES_CSS, nudgeAnchors } from './nudges';
import { LINES, placeAt, SUPPORT, supportProblems } from './support';
import { PROP_PARTS } from '../../ui/courtyard/layoutBParts';

// The 9 Nov support hotfix (b2 + a9): every part stands on something at every stage, on rects (the shots' alpha check
// repeats it on pixels).
const anchors = nudgeAnchors(parseAnchors(raw));
const propsCss = Object.fromEntries(Object.entries(anchors.props).map(([name, rect]) => [name, rect.map(value => value / 3) as unknown as Rect]));
function placedAt(stage: number) {
  const stageOf = (): number => stage;
  return PROP_PARTS.filter(row => stage >= row.from && (row.until === undefined || stage <= row.until))
    .flatMap(row => { const at = placeAt(row.prop, propsCss, stageOf); return at ? [{ prop: row.prop, ...at }] : []; });
}

describe('the support rule (b2 + a9, 9 Nov)', () => {
  it('every part has a support, and at every stage each one stands on it', () => {
    for (const row of PROP_PARTS) expect(SUPPORT[row.prop], row.prop).toBeDefined();
    for (const stage of [1, 2, 3, 4, 5]) expect(supportProblems(placedAt(stage)), `s${stage}`).toEqual([]);
  });

  it('catches the stage-2 faults it was written for: pots on the bare wall face, a wall frame on the floor, a cube in the air', () => {
    const problems = supportProblems([
      { prop: 'mor-pot-1', rect: [16, 300.6, 23, 38.6], support: 'floor' },
      { prop: 'moti-picture-frame', rect: [241.6, 380, 31, 16], support: 'wall' },
      { prop: 'kapi-wall-puzzle', rect: [191, 300.5, 15, 13.5], support: 'coping' },
      { prop: 'chiku-open-book', rect: [230, 473, 25, 11], support: { on: 'chiku-reading-mat' } },
    ]);
    expect(problems).toHaveLength(4);
    expect(problems[0]).toContain('above the floor');
    expect(problems[1]).toContain('outside the wall face');
    expect(problems[2]).toContain('not on the coping top');
    expect(problems[3]).toContain('not drawn');
  });

  it("Kapi's puzzles stand on the coping on his right, clear of the side edge", () => {
    const kapi = anchors.friends.kapi.foot[0] / 3;
    for (const prop of ['kapi-wall-puzzle', 'kapi-flat-board-game', 'kapi-telescope', 'kapi-slate']) {
      const [x, y, w, h] = propsCss[prop]!;
      expect(x, prop).toBeGreaterThan(kapi);
      expect(x + w, prop).toBeLessThanOrEqual(360 - EDGE_CSS);
      expect(Math.abs(y + h - LINES.coping), prop).toBeLessThanOrEqual(2);
    }
    expect(propsCss['kapi-wall-puzzle']![2]).toBeGreaterThanOrEqual(18);
  });

  it("Mor's garden: pot 2 and the bed at the wall foot (the door's base line), pot 1 on the floor at Mor's side; every placed prop 16 CSS inside the sides", () => {
    for (const prop of ['mor-pot-2', 'mor-marigold-bed']) expect(Math.abs(propsCss[prop]![1] + propsCss[prop]![3] - LINES.wallFoot), prop).toBeLessThanOrEqual(2);
    const [potX, , potW] = propsCss['mor-pot-1']!, mor = anchors.friends.mor.tap.map(value => value / 3);
    expect(propsCss['mor-pot-1']![1] + propsCss['mor-pot-1']![3]).toBeGreaterThan(LINES.wallFoot);
    expect(potX + potW).toBeLessThanOrEqual(mor[0]! + 2);
    for (const [prop, [x, , w]] of Object.entries(LAYOUT_B_PLACES_CSS)) {
      expect(x, prop).toBeGreaterThanOrEqual(EDGE_CSS);
      expect(x + w, prop).toBeLessThanOrEqual(360 - EDGE_CSS);
    }
  });

  it("Chiku's book: on a mat at his feet at s1, on the stack at his feet at s2, on the pass's stack from s3", () => {
    const book = (stage: number) => placedAt(stage).find(row => row.prop === 'chiku-open-book')!;
    const chikuFoot = anchors.friends.chiku.foot;
    expect(book(1).support).toEqual({ on: 'chiku-reading-mat' });
    expect(chikuFoot[0] / 3 - (book(1).rect[0] + book(1).rect[2])).toBeLessThanOrEqual(30);
    expect(book(2).support).toEqual({ on: 'chiku-book-stack' });
    expect(placedAt(3).some(row => row.prop === 'chiku-reading-mat')).toBe(false);
    expect(book(3).rect[1] + book(3).rect[3]).toBeCloseTo(propsCss['chiku-book-stack']![1], 5);
    expect(AREAS.some(area => area.id === 'learn')).toBe(true);
  });
});
