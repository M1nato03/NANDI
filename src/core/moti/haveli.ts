/**
 * Spec 26 A1, Moti's haveli. Every finished idea has a diya in its topic's room. Review is a rebuild: the idea's
 * takeaway in three pieces, in order, with two decoys that are the idea's real misconceptions. A rebuilt idea lights
 * its diya for today; nothing ever dims. At most a few ideas a day, due ones first, then the oldest unvisited.
 */
export type Recall = { pieces: string[]; decoys: { text: string; slot: number; misconceptionId: string; fix: string }[]; claimIds: string[] };
export type HaveliIdea = { id: string; title: string; topicId: string; topicTitle: string; recall: Recall; steps: string[] };
export type HaveliTile = { text: string; kind: 'piece'; index: number } | { text: string; kind: 'decoy'; fix: string };
type Fact = { kind: string; refId: string; dayKey: string; deleted?: number };

export const HAVELI_FACT = (day: string, conceptId: string) => `${day}:haveli:${conceptId}`;

/** An idea is finished once every one of its steps has been taught. Ideas without recall pieces are skipped, never faked. */
export function finishedIdeas(ideas: readonly HaveliIdea[], facts: readonly Fact[]): HaveliIdea[] {
  const taught = new Set(facts.filter(fact => fact.kind === 'learn-lesson' && !fact.deleted).map(fact => fact.refId));
  return ideas.filter(idea => idea.recall.pieces.length === 3 && idea.steps.length > 0 && idea.steps.every(step => taught.has(step)));
}

/** The last day each idea was rebuilt, from the card facts the haveli writes. */
export function lastVisits(facts: readonly Fact[]): Map<string, string> {
  const last = new Map<string, string>();
  for (const fact of facts) {
    if (fact.kind !== 'card' || fact.deleted) continue;
    const match = /^(\d{4}-\d{2}-\d{2}):haveli:(.+)$/.exec(fact.refId);
    if (match && (last.get(match[2]!) ?? '') < match[1]!) last.set(match[2]!, match[1]!);
  }
  return last;
}

/**
 * Today's ideas, deterministic: ideas due by the spacing data first (earliest due), then the oldest unvisited (never
 * visited first), ids breaking ties. Ideas already rebuilt today stay in the list so the room shows them lit.
 */
export function haveliPicks(ideas: readonly HaveliIdea[], facts: readonly Fact[], dueAt: ReadonlyMap<string, number>, now: number, day: string, cap: number): HaveliIdea[] {
  const last = lastVisits(facts);
  const done = ideas.filter(idea => last.get(idea.id) === day);
  const open = ideas.filter(idea => last.get(idea.id) !== day);
  const due = open.filter(idea => (dueAt.get(idea.id) ?? Infinity) <= now).sort((a, b) => dueAt.get(a.id)! - dueAt.get(b.id)! || a.id.localeCompare(b.id));
  const rest = open.filter(idea => !due.includes(idea)).sort((a, b) => (last.get(a.id) ?? '').localeCompare(last.get(b.id) ?? '') || a.id.localeCompare(b.id));
  return [...done, ...due, ...rest].slice(0, Math.max(cap, done.length));
}

/** The five tiles of a rebuild in a seeded order: the three pieces and the two decoys. */
export function haveliTiles(idea: HaveliIdea, seedText: string): HaveliTile[] {
  const tiles: HaveliTile[] = [...idea.recall.pieces.map((text, index) => ({ text, kind: 'piece' as const, index })), ...idea.recall.decoys.map(decoy => ({ text: decoy.text, kind: 'decoy' as const, fix: decoy.fix }))];
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) { hash ^= seedText.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  for (let i = tiles.length - 1; i > 0; i--) { hash = Math.imul(hash ^ (hash >>> 13), 1274126177); const j = (hash >>> 0) % (i + 1); [tiles[i], tiles[j]] = [tiles[j]!, tiles[i]!]; }
  return tiles;
}

/** A tap on a tile: the next piece in order goes in; a decoy shows its fix and goes back; an out-of-order piece waits. */
export function placeTile(placed: number, tile: HaveliTile): { placed: number; fix?: string; out: 'placed' | 'decoy' | 'later' } {
  if (tile.kind === 'decoy') return { placed, fix: tile.fix, out: 'decoy' };
  return tile.index === placed ? { placed: placed + 1, out: 'placed' } : { placed, out: 'later' };
}
