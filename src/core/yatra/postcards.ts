/**
 * Spec 575 review 3 (b2 + a9, 13 Nov): a gate's postcard is offered once, only on a real arrival. A gate whose leg was
 * done today or yesterday (a just-before-midnight arrival, or the app closed inside the short wait) may offer it; an
 * older open gate (after a restore, a reinstall or cleared storage) goes to the Journal silently and counts as kept.
 */
export interface GateLeg { id: string; gateOn?: string; doneOn?: string }
export function postcardPlan(legs: readonly GateLeg[], kept: readonly string[], today: string, yesterday: string): { offer: number | null; silent: string[] } {
  const open = legs.map((leg, index) => ({ ...leg, index })).filter(leg => leg.gateOn && !kept.includes(leg.id));
  const recent = (leg: GateLeg) => leg.doneOn === today || leg.doneOn === yesterday;
  return { offer: open.find(recent)?.index ?? null, silent: open.filter(leg => !recent(leg)).map(leg => leg.id) };
}

/** The offer waits this long after the trek loads, and this long after the strip last moved. */
export const OFFER_AFTER_LOAD_MS = 900, STILL_FOR_MS = 600;
/**
 * a9 (13 Nov): never mid-swipe. How long to wait before offering: null while a finger is down, otherwise until both the
 * load wait and the strip's quiet spell have passed (0 = offer now).
 */
export function offerWait(now: number, loadedAt: number, lastMoveAt: number, pointerDown: boolean): number | null {
  if (pointerDown) return null;
  return Math.max(0, loadedAt + OFFER_AFTER_LOAD_MS - now, lastMoveAt + STILL_FOR_MS - now);
}
