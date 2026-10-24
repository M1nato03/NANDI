/**
 * A stable, even shuffle for answer options (idea engine item 71, B1). Content lists the right option first and
 * option ids are a, b, c…, so sorting by a hash of the id kept much of the authored order: the right option showed
 * first in 46.9% of seeds against 33% by chance. A seeded Fisher-Yates over a well-mixed seed gives every order
 * the same chance, and the same key always gives the same order.
 */
function seedOf(key: string): number {
  let h = 2166136261;
  for (const char of key) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  // murmur3 finaliser, so keys that differ only in their last character still land far apart
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x1_0000_0000;
  };
}
export function seededShuffle<T>(values: readonly T[], key: string): T[] {
  const out = [...values];
  const next = mulberry32(seedOf(key));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
