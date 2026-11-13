/**
 * A small stable number (0-1) from a string, for star places, the faint sky and (spec 575) the trail kit's scatter,
 * seeded `${landmarkId}:${n}:x`, so nothing in the scene is random. Item 198: a final mix, so near-identical
 * strings (p1x, p2x…) do not land in a row.
 */
export function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
