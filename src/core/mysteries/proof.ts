import CaseGen, { type MysteryCase } from './index';

/**
 * Spec 24 Prove it (cj5-mind §7.2). After a right accusation, the player picks the fewest clues that prove it. The
 * phone checks the pick by logic, with no stored answer: it tries every way to seat the suspects with the objects and
 * places, keeps those where each picked clue holds, and the pick proves the case when every one of them puts the same
 * culprit with the same object at the same place. The killer line is known to the player, so it always counts.
 */
type World = { sp: number[]; si: number[] };
const PERMS = new Map<number, number[][]>();
function perms(n: number): number[][] {
  const cached = PERMS.get(n);
  if (cached) return cached;
  const out: number[][] = [];
  const walk = (prefix: number[], rest: number[]) => {
    if (!rest.length) { out.push(prefix); return; }
    rest.forEach((value, index) => walk([...prefix, value], [...rest.slice(0, index), ...rest.slice(index + 1)]));
  };
  walk([], Array.from({ length: n }, (_, index) => index));
  PERMS.set(n, out);
  return out;
}
function* worlds(mystery: MysteryCase, clues: readonly number[]): Generator<World> {
  const chosen = clues.map(index => mystery.clues[index]).filter(clue => !!clue);
  for (const sp of perms(mystery.n)) for (const si of perms(mystery.n)) if (chosen.every(clue => CaseGen.holds(clue, sp, si))) yield { sp, si };
}
/** Who the killer line points at in this world, with their object and place. */
function culpritIn(mystery: MysteryCase, world: World): { s: number; i: number; p: number } {
  const s = mystery.killer.k === 'place' ? world.sp.indexOf(mystery.killer.idx) : world.si.indexOf(mystery.killer.idx);
  return { s, i: world.si[s]!, p: world.sp[s]! };
}

export type ProofResult = { proves: true } | { proves: false; still: { s: number; i: number; p: number } };

export function checkProof(mystery: MysteryCase, clues: readonly number[]): ProofResult {
  const truth = { s: mystery.culprit, i: mystery.sol.si[mystery.culprit]!, p: mystery.sol.sp[mystery.culprit]! };
  for (const world of worlds(mystery, [...new Set(clues)])) {
    const who = culpritIn(mystery, world);
    if (who.s !== truth.s || who.i !== truth.i || who.p !== truth.p) return { proves: false, still: who };
  }
  return { proves: true };
}

/** One shortest proof, smallest size first, ties in clue order. */
export function shortestProof(mystery: MysteryCase): number[] {
  const all = mystery.clues.map((_, index) => index);
  for (let size = 1; size <= all.length; size++) {
    const pick: number[] = [];
    let found: number[] | undefined;
    const walk = (from: number) => {
      if (found) return;
      if (pick.length === size) { if (checkProof(mystery, pick).proves) found = [...pick]; return; }
      for (let index = from; index < all.length && !found; index++) { pick.push(index); walk(index + 1); pick.pop(); }
    };
    walk(0);
    if (found) return found;
  }
  return all;
}

/** Offered only when it adds something: some proof uses fewer clues than the whole list. */
export const offerProof = (mystery: MysteryCase): boolean => shortestProof(mystery).length < mystery.clues.length;

/** "These clues still allow Meera with the cloth bag at the canteen." */
export function stillAllows(mystery: MysteryCase, still: { s: number; i: number; p: number }): string {
  return `These clues still allow ${mystery.S[still.s]!.n} with the ${mystery.I[still.i]!.n} ${mystery.P[still.p]!.p} ${mystery.P[still.p]!.n}.`;
}
