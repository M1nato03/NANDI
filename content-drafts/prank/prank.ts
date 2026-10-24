/*
 * Kapi's prank: a prototype generator for one-lie cases (cloud job batch 8, job 3).
 * Draft only. Not imported by the app. Reuses the case engine in src/core/mysteries.
 *
 * A world is one full answer: sp[s] = place of suspect s, si[s] = item of suspect s.
 * A one-lie case is a clue list where
 *   (1) no world satisfies every clue, and
 *   (2) exactly one world violates exactly one clue.
 * That world is the answer and the clue it violates is Kapi's prank (the lie).
 * Equivalent test, used by the hint: drop clue k and see what is left.
 *   k is the lie   -> the other clues have exactly one world.
 *   k is not a lie -> the other clues have no world at all (they clash).
 */
import CaseGen, { type Clue } from '../../src/core/mysteries/index';

export type Size = 3 | 4;
export type World = { sp: number[]; si: number[] };
export type Band = 'easy' | 'medium' | 'hard';
export type Rating = {
  clues: number; // total clues shown, lie included
  core: number; // fewest true clues that clash with the lie on their own (1 = direct contradiction)
  steps: number; // one-step deductions to finish once the lie is found
  cross: boolean; // finishing needs the third grid (item x place) links
  deadEndsNeedCross: number; // wrong guesses whose clash needs the third grid
  score: number;
  band: Band;
};
export type PrankCase = {
  seed: number; n: Size; theme: string; title: string; setup: string;
  S: Array<{ n: string; role: string }>; I: Array<{ n: string }>; P: Array<{ p: string; n: string }>;
  clues: Clue[]; lie: number; sol: World; direct: boolean; rating: Rating; attempts: number;
};
export type GenStats = {
  attempts: number; noCase: number; tooMany: number; direct: number; lieNotLogical: number; deadEndNotLogical: number;
};
export type GenOptions = { seed: number; n: Size; avoidDirect?: boolean; requireLogic?: boolean; maxAttempts?: number; stats?: GenStats };

// ---------- small helpers ----------
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(a: T[], r: () => number): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
function perms(n: number): number[][] {
  const out: number[][] = []; const p = [...Array(n).keys()];
  const go = (k: number) => {
    if (k === n) { out.push(p.slice()); return; }
    for (let i = k; i < n; i++) { [p[k], p[i]] = [p[i], p[k]]; go(k + 1); [p[k], p[i]] = [p[i], p[k]]; }
  };
  go(0); return out;
}
const WORLDS: Record<number, World[]> = {};
export function worlds(n: Size): World[] {
  if (!WORLDS[n]) { const P = perms(n); WORLDS[n] = P.flatMap(sp => P.map(si => ({ sp, si }))); }
  return WORLDS[n];
}
const holds = (c: Clue, w: World) => CaseGen.holds(c, w.sp, w.si);
const same = (a: World, b: World) => a.sp.every((v, i) => v === b.sp[i]) && a.si.every((v, i) => v === b.si[i]);

/** Clues that say the opposite of c. Assuming "c is false" means adding these. */
export function negate(c: Clue): Clue[] {
  switch (c.k) {
    case 'sp+': return [{ k: 'sp-', s: c.s, p: c.p }];
    case 'sp-': return [{ k: 'sp+', s: c.s, p: c.p }];
    case 'si+': return [{ k: 'si-', s: c.s, i: c.i }];
    case 'si-': return [{ k: 'si+', s: c.s, i: c.i }];
    case 'ip+': return [{ k: 'ip-', i: c.i, p: c.p }];
    case 'ip-': return [{ k: 'ip+', i: c.i, p: c.p }];
    case 'or': return [{ k: 'sp-', s: c.a, p: c.p }, { k: 'sp-', s: c.b, p: c.p }];
    case 'ori': return [{ k: 'si-', s: c.a, i: c.i }, { k: 'si-', s: c.b, i: c.i }];
  }
  return [];
}

/** Every clue this engine can say for an n-size case. */
export function allClues(n: Size): Clue[] {
  const out: Clue[] = [];
  for (let s = 0; s < n; s++) for (let p = 0; p < n; p++) out.push({ k: 'sp+', s, p }, { k: 'sp-', s, p });
  for (let s = 0; s < n; s++) for (let i = 0; i < n; i++) out.push({ k: 'si+', s, i }, { k: 'si-', s, i });
  for (let i = 0; i < n; i++) for (let p = 0; p < n; p++) out.push({ k: 'ip+', i, p }, { k: 'ip-', i, p });
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
    for (let p = 0; p < n; p++) out.push({ k: 'or', a, b, p });
    for (let i = 0; i < n; i++) out.push({ k: 'ori', a, b, i });
  }
  return out;
}

// ---------- the one-lie test ----------
export type LieCheck = { satisfiable: number; oneOff: Array<{ world: World; clue: number }> };

/** Counts worlds that fit every clue, and lists worlds that miss exactly one clue (stops after 2). */
export function checkLie(clues: Clue[], n: Size): LieCheck {
  let satisfiable = 0; const oneOff: LieCheck['oneOff'] = [];
  for (const w of worlds(n)) {
    let miss = -1, count = 0;
    for (let k = 0; k < clues.length && count < 2; k++) if (!holds(clues[k], w)) { count++; miss = k; }
    if (count === 0) satisfiable++;
    else if (count === 1 && oneOff.length < 2) oneOff.push({ world: w, clue: miss });
  }
  return { satisfiable, oneOff };
}
export function isOneLie(clues: Clue[], n: Size): { ok: boolean; world?: World; lie?: number } {
  const r = checkLie(clues, n);
  if (r.satisfiable === 0 && r.oneOff.length === 1) return { ok: true, world: r.oneOff[0].world, lie: r.oneOff[0].clue };
  return { ok: false };
}
const anyWorld = (clues: Clue[], n: Size) => worlds(n).some(w => clues.every(c => holds(c, w)));

/** Fewest true clues that clash with the lie by themselves. 1 means a direct contradiction. Capped at `cap`. */
export function coreSize(lie: Clue, truths: Clue[], n: Size, cap = 4): number {
  const m = truths.length;
  const pick = (size: number, start: number, chosen: Clue[]): boolean => {
    if (chosen.length === size) return !anyWorld([lie, ...chosen], n);
    for (let j = start; j <= m - (size - chosen.length); j++) if (pick(size, j + 1, [...chosen, truths[j]])) return true;
    return false;
  };
  for (let size = 1; size <= Math.min(cap, m); size++) if (pick(size, 0, [])) return size;
  return cap + 1;
}

// ---------- logic checks (human-style, one-step deductions only) ----------
const without = (clues: Clue[], k: number) => clues.filter((_, j) => j !== k);
/** "Suppose clue k is false": the other clues plus the opposite of clue k, run through the case solver. */
export function supposeFalse(clues: Clue[], k: number, n: Size, cross = true) {
  return CaseGen.propagate([...without(clues, k), ...negate(clues[k])], n, cross);
}

// ---------- generator ----------
const TRUTH_W: Record<string, number> = { 'sp+': 0.6, 'si+': 0.6, 'sp-': 3, 'si-': 3, 'ip+': 2, 'ip-': 3, or: 2, ori: 1.5 };
const LIE_W: Record<string, number> = { 'sp+': 2, 'si+': 2, 'ip+': 2, 'sp-': 1, 'si-': 1, 'ip-': 1, or: 1.5, ori: 1.5 };
const MAX_CLUES: Record<Size, number> = { 3: 9, 4: 12 };
// Band cut-offs per size, set from the score tertiles of 300 seeded cases each (see docs/reviews/cj8-prank.md).
const BANDS: Record<Size, [number, number]> = { 3: [9, 12], 4: [12, 17] };

function weightedOrder(pool: Clue[], W: Record<string, number>, r: () => number): Clue[] {
  const perKind: Record<string, number> = {};
  for (const c of pool) perKind[c.k] = (perKind[c.k] || 0) + 1;
  return pool
    .filter(c => W[c.k])
    .map(c => ({ c, key: -Math.log(r() || 1e-12) / (W[c.k] / perKind[c.k]) }))
    .sort((x, y) => x.key - y.key)
    .map(x => x.c);
}

export function newStats(): GenStats { return { attempts: 0, noCase: 0, tooMany: 0, direct: 0, lieNotLogical: 0, deadEndNotLogical: 0 }; }

export function rate(clues: Clue[], lie: number, n: Size): Rating {
  const truths = without(clues, lie);
  const core = coreSize(clues[lie], truths, n);
  const full = supposeFalse(clues, lie, n, true);
  const flat = supposeFalse(clues, lie, n, false);
  let deadEndsNeedCross = 0;
  clues.forEach((_, k) => { if (k !== lie && !supposeFalse(clues, k, n, false).bad) deadEndsNeedCross++; });
  const cross = !flat.solved;
  // Score: hidden lie (core) counts most, then dead ends that need the third grid, then length.
  const score = 2 * Math.min(core, 4) + deadEndsNeedCross + (cross ? 2 : 0) + Math.floor(full.steps.length / 10);
  const [e, m] = BANDS[n];
  const band: Band = score <= e ? 'easy' : score <= m ? 'medium' : 'hard';
  return { clues: clues.length, core, steps: full.steps.length, cross, deadEndsNeedCross, score, band };
}

export function generatePrank(opts: GenOptions): PrankCase | null {
  const { seed, n, avoidDirect = true, requireLogic = true, maxAttempts = 400 } = opts;
  const st = opts.stats ?? newStats();
  const r = rng(seed);
  const pool = allClues(n);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    st.attempts++;
    const answer: World = { sp: shuffle([...Array(n).keys()], r), si: shuffle([...Array(n).keys()], r) };
    const trueFacts = pool.filter(c => holds(c, answer));
    const falseFacts = pool.filter(c => !holds(c, answer));
    const lie = weightedOrder(falseFacts, LIE_W, r)[0];
    // Add true clues until the set is a one-lie case with this answer.
    let truths: Clue[] = [];
    let ok = false;
    for (const f of weightedOrder(trueFacts, TRUTH_W, r)) {
      truths.push(f);
      const t = isOneLie([...truths, lie], n);
      if (t.ok) { ok = true; break; }
    }
    if (!ok) { st.noCase++; continue; }
    // Drop true clues that are not needed.
    for (const f of shuffle(truths, r)) {
      const t = truths.filter(x => x !== f);
      if (isOneLie([...t, lie], n).ok) truths = t;
    }
    if (truths.length + 1 > MAX_CLUES[n]) { st.tooMany++; continue; }
    const direct = coreSize(lie, truths, n, 1) === 1;
    if (avoidDirect && direct) { st.direct++; continue; }
    // Put the lie at a random spot.
    const clues = shuffle([...truths, lie], r).map(c => ({ ...c }));
    const lieIx = clues.findIndex(c => JSON.stringify(c) === JSON.stringify(lie));
    if (requireLogic) {
      if (!supposeFalse(clues, lieIx, n).solved) { st.lieNotLogical++; continue; }
      if (clues.some((_, k) => k !== lieIx && !supposeFalse(clues, k, n).bad)) { st.deadEndNotLogical++; continue; }
    }
    const check = isOneLie(clues, n);
    if (!check.ok || check.lie !== lieIx || !same(check.world!, answer)) throw new Error('generator bug');
    return dress({ seed: seed >>> 0, n, clues, lie: lieIx, sol: answer, direct, rating: rate(clues, lieIx, n), attempts: attempt }, r);
  }
  return null;
}

// ---------- words (reuses the case themes) ----------
type Theme = { key: string; title: string; setup: string; suspects: string[][]; items: string[]; places: string[][] };
function dress(core: Omit<PrankCase, 'theme' | 'title' | 'setup' | 'S' | 'I' | 'P'>, r: () => number): PrankCase {
  const themes = (CaseGen as unknown as { THEMES: Theme[] }).THEMES;
  const th = themes[Math.floor(r() * themes.length)];
  const n = core.n;
  const S = shuffle([0, 1, 2, 3], r).slice(0, n).map(k => ({ n: th.suspects[k][0], role: th.suspects[k][1] }));
  const I = shuffle([0, 1, 2, 3], r).slice(0, n).map(k => ({ n: th.items[k] }));
  const P = shuffle([0, 1, 2, 3], r).slice(0, n).map(k => ({ p: th.places[k][0], n: th.places[k][1] }));
  const C = { ...core, theme: th.key, title: th.title, setup: th.setup, S, I, P };
  C.clues.forEach(c => { c.text = clueText(c, C); });
  return C;
}
export function clueText(c: Clue, C: Pick<PrankCase, 'S' | 'I' | 'P'>): string {
  const S = (i?: number) => C.S[i!].n, I = (i?: number) => C.I[i!].n, PP = (i?: number) => `${C.P[i!].p} ${C.P[i!].n}`;
  switch (c.k) {
    case 'sp+': return `${S(c.s)} was ${PP(c.p)}.`;
    case 'sp-': return `${S(c.s)} was not ${PP(c.p)}.`;
    case 'si+': return `${S(c.s)} had the ${I(c.i)}.`;
    case 'si-': return `${S(c.s)} did not have the ${I(c.i)}.`;
    case 'ip+': return `Whoever had the ${I(c.i)} was ${PP(c.p)}.`;
    case 'ip-': return `Whoever had the ${I(c.i)} was not ${PP(c.p)}.`;
    case 'or': return `Either ${S(c.a)} or ${S(c.b)} was ${PP(c.p)}.`;
    case 'ori': return `Either ${S(c.a)} or ${S(c.b)} had the ${I(c.i)}.`;
  }
  return '';
}

// ---------- hint: "suppose clue k is false" ----------
export type Hint = { clue: number; outcome: 'clash' | 'fits' | 'open'; firstFacts: string[]; text: string };
export function hint(C: PrankCase, k: number): Hint {
  const res = supposeFalse(C.clues, k, C.n);
  const firstFacts = res.steps
    .filter(s => s.v === 1 && s.g !== 'C')
    .slice(0, 2)
    .map(s => (s.g === 'A' ? `${C.S[s.r].n} was ${C.P[s.c].p} ${C.P[s.c].n}` : `${C.S[s.r].n} had the ${C.I[s.c].n}`));
  const lead = `Suppose clue ${k + 1} is false.`;
  const follows = firstFacts.length ? ` Then ${firstFacts.join(', and ')}.` : '';
  if (res.bad) return { clue: k, outcome: 'clash', firstFacts, text: `${lead}${follows} Keep going: the other clues stop fitting together.` };
  if (res.solved) return { clue: k, outcome: 'fits', firstFacts, text: `${lead}${follows} Everything else fits. Try finishing the grid.` };
  return { clue: k, outcome: 'open', firstFacts, text: `${lead}${follows} Nothing clashes yet. Try another clue.` };
}

// ---------- riddle workshop: live counter and triviality checks ----------
export type WorkshopMode = 'plain' | 'prank';
export type WorkshopCheck = {
  possible: number; // answers still possible (plain: worlds; prank: world + lie pairs)
  ready: boolean; // possible === 1 and no blocking reason
  idle: number[]; // clues that change nothing (removing them keeps the same answer count)
  reasons: string[];
};
export function workshopCheck(clues: Clue[], n: Size, mode: WorkshopMode): WorkshopCheck {
  const reasons: string[] = [];
  const count = (cl: Clue[]) => {
    if (mode === 'plain') return worlds(n).filter(w => cl.every(c => holds(c, w))).length;
    let sat = 0, one = 0;
    for (const w of worlds(n)) { let m = 0; for (const c of cl) if (!holds(c, w) && ++m > 1) break; if (m === 0) sat++; else if (m === 1) one++; }
    return sat > 0 ? -sat : one; // negative = some world has no lie at all
  };
  const possible = count(clues);
  if (possible < 0) reasons.push('Every clue can be true at once. Make one clue the prank.');
  const idle: number[] = [];
  if (possible === 1) clues.forEach((_, k) => { if (count(without(clues, k)) === 1) idle.push(k); });
  if (idle.length) reasons.push('Some clues change nothing. Remove them.');
  if (possible === 1) {
    if (mode === 'plain') {
      const res = CaseGen.propagate(clues, n, true);
      if (!res.solved) reasons.push('The solver needs a guess here. Add a clue.');
      const direct = res.steps.filter(s => s.why.rule === 'clue' && s.v === 1 && s.g !== 'C').length;
      if (direct >= n) reasons.push('The clues name too many answers outright.');
    } else {
      const ol = isOneLie(clues, n);
      if (ol.ok) {
        if (coreSize(clues[ol.lie!], without(clues, ol.lie!), n, 1) === 1) reasons.push('The prank clashes with one clue head-on. Hide it better.');
        if (!supposeFalse(clues, ol.lie!, n).solved) reasons.push('The solver needs a guess here. Add a clue.');
      }
    }
  }
  return { possible: Math.max(possible, 0), ready: possible === 1 && reasons.length === 0, idle, reasons };
}
