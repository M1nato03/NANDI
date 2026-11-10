import { describe, expect, it } from 'vitest';
import raw from '../../ui/courtyard/anchors.json';
import { EDGE_CSS, parseAnchors, type Rect } from './anchors';
import { AREAS } from './courtyard';
import { LAYOUT_B_PLACES_CSS, nudgeAnchors } from './nudges';
import { crownBottom, crownFit, CROWN_CLEAR, KAPI_EARLY, LINES, NEEM_GROWTH, placeAt, SUPPORT, supportProblems } from './support';
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

  it("Kapi's puzzles keep their 9q x on his left, feet on the coping top; at s1-s2 the cube and board take the 9q spots nearest him (b2 pick 1)", () => {
    const kapi = anchors.friends.kapi.foot[0] / 3;
    const pass = parseAnchors(raw).props;
    for (const prop of ['kapi-wall-puzzle', 'kapi-flat-board-game', 'kapi-telescope', 'kapi-slate']) {
      const [x, y, w, h] = propsCss[prop]!;
      expect(x + w, prop).toBeLessThan(kapi);
      expect(Math.abs(y + h - LINES.coping), prop).toBeLessThanOrEqual(2);
      // 9q's x: the same centre within 2 CSS (the cube is widened to 19 CSS and kept off the trunk).
      const [px, , pw] = pass[prop]!.map(value => value / 3);
      expect(Math.abs(x + w / 2 - (px! + pw! / 2)), prop).toBeLessThanOrEqual(prop === 'kapi-wall-puzzle' ? 5 : 2);
    }
    expect(propsCss['kapi-wall-puzzle']![2]).toBeGreaterThanOrEqual(18);
    const early = placedAt(2).filter(row => row.prop.startsWith('kapi-') && row.prop !== 'kapi-kite');
    expect(early.map(row => row.rect)).toEqual([KAPI_EARLY.cube, KAPI_EARLY.board]);
    expect(placedAt(3).find(row => row.prop === 'kapi-wall-puzzle')!.rect).toEqual(propsCss['kapi-wall-puzzle']);
  });

  it('the neem crown keeps clear of every Kapi thing that can stand under it: young trees narrower, older ones lifted, no bare pole', () => {
    for (const tree of [1, 2, 3, 4, 5]) {
      const { narrow, lift } = crownFit(tree, propsCss);
      for (let mind = 1; mind <= tree; mind++) for (const row of placedAt(mind).filter(r => ['kapi-wall-puzzle', 'kapi-flat-board-game', 'kapi-telescope', 'kapi-slate'].includes(r.prop))) {
        const [x, y, w] = row.rect;
        expect(crownBottom(NEEM_GROWTH[tree]!, x, x + w, narrow, lift), `tree ${tree} mind ${mind} ${row.prop}`).toBeLessThanOrEqual(y - CROWN_CLEAR + 0.2);
      }
      if (tree <= 2) expect(lift, `tree ${tree}`).toBe(0);
      else expect(narrow, `tree ${tree}`).toBe(1);
    }
  });

  it("Mor's pots and bed stand on the planter shelf drawn on the wall face at their 9q spots; every placed prop 16 CSS inside the sides", () => {
    const shelf = propsCss['mor-planter-shelf']!;
    expect(shelf[1]).toBeGreaterThanOrEqual(LINES.wallTop);
    for (const prop of ['mor-pot-1', 'mor-pot-2', 'mor-marigold-bed', 'mor-trellis-creeper']) {
      expect(SUPPORT[prop], prop).toEqual({ on: 'mor-planter-shelf' });
      expect(Math.abs(propsCss[prop]![1] + propsCss[prop]![3] - shelf[1]), prop).toBeLessThanOrEqual(2);
    }
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
