/**
 * Spec 38: honest minutes for a sit the native player ran. The player keeps a dated journal; only time inside a
 * playing span counts. A span opens at "started" or "resumed" and closes at "paused" (by the person, a call, lost
 * audio or a sound that would not play), "ended" or "stopped". Wall-clock time across an interruption never counts.
 */
export type CalmEvent = { type: 'started' | 'paused' | 'resumed' | 'bell' | 'ended' | 'stopped'; at: number; reason?: string };

export function playedMs(journal: readonly CalmEvent[], now: number, lengthMs?: number | null): number {
  let total = 0, openAt: number | null = null;
  for (const event of [...journal].sort((a, b) => a.at - b.at)) {
    if (event.type === 'started' || event.type === 'resumed') { if (openAt === null) openAt = event.at; }
    else if (event.type === 'paused' || event.type === 'ended' || event.type === 'stopped') {
      if (openAt !== null) { total += Math.max(0, event.at - openAt); openAt = null; }
    }
  }
  if (openAt !== null) total += Math.max(0, now - openAt);
  return lengthMs && lengthMs > 0 ? Math.min(lengthMs, total) : total;
}

/** A sit is over once it ended or was stopped; then its minutes can be saved. */
export const sitOver = (journal: readonly CalmEvent[]) => journal.some(event => event.type === 'ended' || event.type === 'stopped');

export function readJournal(raw: unknown): CalmEvent[] {
  if (!Array.isArray(raw)) return [];
  const kinds = new Set(['started', 'paused', 'resumed', 'bell', 'ended', 'stopped']);
  return raw.filter((event): event is CalmEvent => !!event && typeof event === 'object' && kinds.has((event as CalmEvent).type) && Number.isFinite((event as CalmEvent).at));
}
