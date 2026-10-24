import { describe, expect, it } from 'vitest';
import CaseGen, { type Clue } from '../../src/core/mysteries/index';
import {
  checkLie, coreSize, generatePrank, hint, isOneLie, newStats, supposeFalse, workshopCheck, worlds,
  type PrankCase, type Size,
} from './prank';

const CASES = 300;
const seedFor = (n: number, i: number, tag: string) => CaseGen.hash(`prank:${tag}:${n}:${i}`);

function pct(a: number, b: number) { return `${((100 * a) / b).toFixed(1)}%`; }
function summary(ms: number[]) {
  const s = ms.slice().sort((a, b) => a - b);
  const q = (f: number) => s[Math.min(s.length - 1, Math.floor(f * s.length))];
  return { mean: s.reduce((a, b) => a + b, 0) / s.length, median: q(0.5), p95: q(0.95), max: s[s.length - 1] };
}
const fmt = (o: Record<string, number>) => Object.entries(o).map(([k, v]) => `${k} ${v.toFixed(2)} ms`).join(' | ');

describe('one-lie definition', () => {
  // Answer: suspect s at place s with item s. Clue 0 is the lie.
  const hand: Clue[] = [
    { k: 'sp+', s: 0, p: 1 }, // lie
    { k: 'or', a: 0, b: 2, p: 0 },
    { k: 'sp-', s: 2, p: 0 },
    { k: 'sp-', s: 1, p: 2 },
    { k: 'sp-', s: 1, p: 0 },
    { k: 'si+', s: 0, i: 0 }, { k: 'si+', s: 1, i: 1 },
  ];
  it('accepts a hand-made 3x3 case and finds the lie', () => {
    const r = isOneLie(hand, 3);
    expect(r.ok).toBe(true);
    expect(r.lie).toBe(0);
    expect(r.world).toEqual({ sp: [0, 1, 2], si: [0, 1, 2] });
  });

  it('rejects the same case without its backup clue (two worlds miss one clue each)', () => {
    const c = checkLie(hand.filter((_, k) => k !== 4), 3);
    expect(c.satisfiable).toBe(0);
    expect(c.oneOff.length).toBe(2);
  });

  it('rejects a set where every clue can be true', () => {
    expect(isOneLie([{ k: 'sp+', s: 0, p: 0 }], 3).ok).toBe(false);
  });

  it('counts a direct contradiction as core 1', () => {
    expect(coreSize({ k: 'sp+', s: 0, p: 0 }, [{ k: 'sp-', s: 0, p: 0 }, { k: 'sp-', s: 1, p: 1 }], 3)).toBe(1);
  });

  it('has 36 and 576 worlds', () => {
    expect(worlds(3).length).toBe(36);
    expect(worlds(4).length).toBe(576);
  });
});

for (const n of [3, 4] as Size[]) {
  describe(`${n}x${n}: ${CASES} seeded cases`, () => {
    it('raw generator (no filters): how often the lie is a direct contradiction', () => {
      const st = newStats(); let direct = 0, made = 0; const ms: number[] = [];
      const byKind: Record<string, [number, number]> = {};
      for (let i = 0; i < CASES; i++) {
        const t0 = performance.now();
        const C = generatePrank({ seed: seedFor(n, i, 'raw'), n, avoidDirect: false, requireLogic: false, stats: st });
        ms.push(performance.now() - t0);
        if (!C) continue;
        made++; if (C.direct) direct++;
        const k = C.clues[C.lie].k; byKind[k] ??= [0, 0]; byKind[k][1]++; if (C.direct) byKind[k][0]++;
      }
      console.log(`[${n}x${n} raw] made ${made}/${CASES} | direct ${direct} (${pct(direct, made)}) | attempts ${st.attempts} | noCase ${st.noCase} tooMany ${st.tooMany} | ${fmt(summary(ms))}`);
      console.log(`[${n}x${n} raw] direct by lie kind ${Object.entries(byKind).map(([k, [d, t]]) => `${k} ${d}/${t}`).join(', ')}`);
      expect(made).toBe(CASES);
    }, 300_000);

    it('filtered generator: valid, not direct, solvable by logic, timed', () => {
      const st = newStats(); const ms: number[] = []; const made: PrankCase[] = [];
      for (let i = 0; i < CASES; i++) {
        const t0 = performance.now();
        const C = generatePrank({ seed: seedFor(n, i, 'main'), n, stats: st });
        ms.push(performance.now() - t0);
        if (C) made.push(C);
      }
      expect(made.length).toBe(CASES);
      for (const C of made) {
        const r = isOneLie(C.clues, n);
        expect(r.ok).toBe(true);
        expect(r.lie).toBe(C.lie);
        expect(C.direct).toBe(false);
        expect(r.world).toEqual(C.sol);
        // the answer world breaks only the lie
        const broken = C.clues.filter(c => !CaseGen.holds(c, C.sol.sp, C.sol.si));
        expect(broken).toEqual([C.clues[C.lie]]);
        // hint: lie fits, every other guess clashes
        expect(hint(C, C.lie).outcome).toBe('fits');
        C.clues.forEach((_, k) => { if (k !== C.lie) expect(supposeFalse(C.clues, k, n).bad).toBe(true); });
        expect(C.clues.every(c => typeof c.text === 'string' && c.text.length > 5)).toBe(true);
      }
      const bands = { easy: 0, medium: 0, hard: 0 };
      const cores: Record<string, number> = {}; const lens: Record<string, number> = {};
      let cross = 0;
      for (const C of made) {
        bands[C.rating.band]++; cores[C.rating.core] = (cores[C.rating.core] || 0) + 1;
        lens[C.rating.clues] = (lens[C.rating.clues] || 0) + 1; if (C.rating.cross) cross++;
      }
      const scores: Record<string, number> = {}; for (const C of made) scores[C.rating.score] = (scores[C.rating.score] || 0) + 1;
      console.log(`[${n}x${n} filtered] score histogram ${JSON.stringify(scores)}`);
      const att = made.map(c => c.attempts).sort((a, b) => a - b);
      console.log(`[${n}x${n} filtered] ${fmt(summary(ms))}`);
      console.log(`[${n}x${n} filtered] attempts total ${st.attempts} (median ${att[att.length >> 1]}, max ${att[att.length - 1]}) | rejected: noCase ${st.noCase}, tooMany ${st.tooMany}, direct ${st.direct}, lieNotLogical ${st.lieNotLogical}, deadEndNotLogical ${st.deadEndNotLogical}`);
      console.log(`[${n}x${n} filtered] bands ${JSON.stringify(bands)} | core ${JSON.stringify(cores)} | clue counts ${JSON.stringify(lens)} | needs third grid ${pct(cross, made.length)}`);
      console.log(`[${n}x${n} sample] ${made[0].title}: ${made[0].clues.map((c, k) => `${k + 1}. ${c.text}${k === made[0].lie ? ' [LIE]' : ''}`).join(' ')}`);
      console.log(`[${n}x${n} hint] ${hint(made[0], made[0].lie === 0 ? 1 : 0).text} || ${hint(made[0], made[0].lie).text}`);
    }, 300_000);

    it('workshop counter: fast and flags trivial cases', () => {
      const C = generatePrank({ seed: seedFor(n, 0, 'main'), n })!;
      const t0 = performance.now();
      let w = workshopCheck(C.clues, n, 'prank');
      for (let i = 0; i < 49; i++) w = workshopCheck(C.clues, n, 'prank');
      const per = (performance.now() - t0) / 50;
      console.log(`[${n}x${n} workshop] full check ${per.toFixed(2)} ms per call`);
      expect(w.possible).toBe(1);
      expect(w.idle).toEqual([]);
      expect(w.ready).toBe(true);
      // Adding a clue that repeats the lie's opposite makes it head-on.
      const opposite = { ...C.clues[C.lie] };
      const flip: Record<string, string> = { 'sp+': 'sp-', 'sp-': 'sp+', 'si+': 'si-', 'si-': 'si+', 'ip+': 'ip-', 'ip-': 'ip+' };
      if (flip[opposite.k]) {
        const w2 = workshopCheck([...C.clues, { ...opposite, k: flip[opposite.k], text: undefined }], n, 'prank');
        expect(w2.ready).toBe(false);
      }
      // Plain mode: an empty set leaves every world open.
      expect(workshopCheck([], n, 'plain').possible).toBe(worlds(n).length);
      // Plain mode: naming every answer outright is flagged.
      const named: Clue[] = [];
      for (let s = 0; s < n; s++) named.push({ k: 'sp+', s, p: s }, { k: 'si+', s, i: s });
      const w3 = workshopCheck(named, n, 'plain');
      expect(w3.possible).toBe(1);
      expect(w3.ready).toBe(false);
    }, 60_000);
  });
}
