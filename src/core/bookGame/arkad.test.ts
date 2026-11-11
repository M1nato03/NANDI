import { describe, expect, it } from 'vitest';
import { applyAction, enterMonth, fresh, messageParts, net, phrases, signCounts, simulate, allSignsFound, type ArkadState, type Path } from './arkad';

// Spec 40 §7.1: the round-14 checker (shots-r14/check.cjs) ported. Each path plays the year through the engine the way
// the checker clicks it, then the same sums hold: 12 history points, every pot equals its ledger sum, net equals the
// ledger, and the played year equals the year-end comparison for that path.
function playYear(kind: Path): ArkadState {
  let s = fresh();
  s.goal = 0;
  for (let m = 0; m < 12; m++) {
    s = enterMonth(s, m);
    expect(s.month).toBe(m);
    if (m === 0 || m === 10) { s.pendingSplit = kind === 'nothing' ? 0 : 3; s = applyAction(s, 'split-commit'); }
    else if (m === 1) { if (kind === 'careful' || kind === 'skip-growth') s.subs = [true, true, true, true]; s = applyAction(s, 'feb-commit'); }
    else if ([2, 3, 5, 6].includes(m)) s = applyAction(s, kind === 'yes' ? 'yes' : (kind === 'careful' || kind === 'skip-growth') && m === 5 ? 'yes' : 'no');
    else if (m === 4) s = applyAction(s, ['nothing', 'skip-growth'].includes(kind) ? 'keep' : 'invest');
    else if (m === 7) s = applyAction(s, 'repair');
    else if (m === 8) s = applyAction(s, kind === 'nothing' ? 'skip' : 'course');
    else if (m === 9) { s.festival = kind === 'nothing' ? 0 : kind === 'yes' ? 8000 : 2500; s = applyAction(s, 'festival-commit'); }
    else if (m === 11) s = applyAction(s, 'dec-commit');
    expect(s.phase).toBe('result');
  }
  return s;
}

describe('spec 40: the approved year, unchanged in math', () => {
  for (const kind of ['careful', 'yes', 'nothing', 'skip-growth'] as const) {
    it(`${kind}: 12 history points, pots = ledger, net = ledger = the year-end comparison`, () => {
      const s = playYear(kind);
      expect(s.history.filter(Boolean)).toHaveLength(12);
      const sums = { mine: 0, cushion: 0, growing: 0, debt: 0 };
      for (const row of s.ledger) sums[row.pot] += row.delta;
      expect(sums).toEqual({ ...s.pots, debt: s.debt });
      expect(net(s)).toBe(sums.mine + sums.cushion + sums.growing - sums.debt);
      expect(net(s)).toBe(simulate(kind));
    });
  }

  it("May's growth: ₹40 a month from June to December, ₹280 by the year end (careful), none when skipped", () => {
    expect(playYear('careful').pots.growing).toBe(3000 + 280);
    expect(playYear('skip-growth').pots.growing).toBe(0);
    expect(playYear('skip-growth').lastText).toContain('₹280 less (fictional example)');
  });

  it('August: a built cushion covers the repair (no debt); "kept nothing" leaves a ₹12,000 bill', () => {
    const careful = playYear('careful');
    expect(careful.ledger.some(row => row.label === 'Laptop repair, paid from Cushion' && row.delta === -10000)).toBe(true);
    expect(careful.debt).toBe(0);
    expect(playYear('nothing').debt).toBe(12000);
  });

  it('November: the course raise lands once, in the ledger', () => {
    expect(playYear('careful').ledger.filter(row => row.label.includes('Course raise'))).toHaveLength(2);
    expect(playYear('careful').ledger.filter(row => row.month === 10 && row.label.includes('Course raise'))).toHaveLength(1);
  });

  it('entering a month twice pays its salary once (a double tap, a reload)', () => {
    let s = applyAction(enterMonth(fresh(), 0), 'split-commit');
    const once = enterMonth(s, 1);
    const twice = enterMonth(once, 1);
    expect(twice.pots).toEqual(once.pots);
    s = twice;
    expect(s.ledger.filter(row => row.month === 1 && row.label === 'Salary: kept in Mine')).toHaveLength(1);
  });

  it('each step returns a new state and never changes the one it was given', () => {
    const start = enterMonth(fresh(), 0);
    const copy = structuredClone(start);
    applyAction(start, 'split-commit');
    expect(start).toEqual(copy);
  });

  it('the sign months: phrases parse in order, every message has warnings (or good signs in Jun) and other signs', () => {
    for (const m of [2, 3, 5, 6]) {
      const tags = phrases(m).map(p => p.tag);
      expect(m === 5 ? tags.includes('green') : tags.includes('red'), `month ${m}`).toBe(true);
      expect(tags.includes('grey'), `month ${m}`).toBe(true);
      expect(messageParts(m).map(part => typeof part === 'string' ? part : part.text).join('')).not.toContain('{');
    }
    expect(signCounts(2, { 0: true, 1: true })).toEqual({ red: 1, green: 0, grey: 1 });
    expect(allSignsFound(2, { 0: true, 2: true, 3: true })).toBe(true);
    expect(allSignsFound(2, { 0: true })).toBe(false);
    expect(allSignsFound(5, { 0: true, 1: true })).toBe(false);
    expect(allSignsFound(5, { 0: true, 1: true, 3: true })).toBe(true);
  });
});
