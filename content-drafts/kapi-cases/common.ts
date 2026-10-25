export type Level = 'easy' | 'medium' | 'hard';
export type HintLadder = readonly [string, string, string];

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function permutations<T>(items: readonly T[]): T[][] {
  if (!items.length) return [[]];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map(rest => [item, ...rest]));
}

export type Rule<T> = { text: string; holds: (candidate: T) => boolean };

// Pick useful true facts, then discard redundant ones. The solver still checks
// the full candidate set; generation never treats the hidden answer as proof.
export function chooseRules<T>(
  candidates: readonly T[], truth: T, facts: readonly Rule<T>[], random: () => number,
  level: Level,
): Rule<T>[] {
  let remaining = [...candidates];
  const pool = shuffle(facts.filter(f => f.holds(truth)), random);
  const picked: Rule<T>[] = [];
  while (remaining.length > 1) {
    const scored = pool.map((rule, i) => ({ i, count: remaining.filter(rule.holds).length }))
      .filter(item => item.count > 0 && item.count < remaining.length);
    if (!scored.length) throw new Error('Fact pool cannot isolate a solution');
    const counts = [...new Set(scored.map(item => item.count))].sort((a, b) => a - b);
    const rank = level === 'easy' ? 0 : level === 'medium' ? 1 : 2;
    const target = counts[Math.min(rank, counts.length - 1)];
    const best = scored.find(item => item.count === target)!.i;
    const [rule] = pool.splice(best, 1);
    picked.push(rule);
    remaining = remaining.filter(rule.holds);
  }
  for (const rule of shuffle(picked, random)) {
    const smaller = picked.filter(item => item !== rule);
    if (candidates.filter(c => smaller.every(item => item.holds(c))).length === 1) {
      picked.splice(picked.indexOf(rule), 1);
    }
  }
  return shuffle(picked, random);
}
