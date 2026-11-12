import type { LedgerRow } from '../../data/types';
import type { Trail } from './trail';
import { deriveTrek, STRETCHES_PER_LEG, type Constellation, type LegState, type Star, type Trek } from './trek';

/**
 * Spec 575 §4: trail after trail, in a fixed order with no picker. Trail k+1 starts where trail k's walking ended: one
 * walk (the same deriveTrek, both modes, M2) runs over every trail's legs joined end to end, then is sliced back into
 * trails. A pure function of the same ledger, so nothing new is stored and a restore gives the same state.
 *
 * With one trail it returns exactly what deriveTrek returns (plus `journey`), so Hampta's walk is unchanged until it ends.
 */
export interface WalkedTrail { trail: Trail; legs: LegState[] }
export interface Journey {
  trails: readonly Trail[];
  /** The trail on screen: the first one not yet finished, or the last once every trail is walked. */
  index: number;
  /** Finished trails and the current one, in walking order, each with its own leg states (0-based per trail). */
  walked: WalkedTrail[];
}
export type JourneyTrek = Trek & { journey: Journey };

type JarInput = Parameters<typeof deriveTrek>[5];

/** One trail made of every trail's legs in order (the places are only read through the slices, never from this). */
function joined(trails: readonly Trail[]): Trail {
  return { ...trails[0]!, legs: trails.flatMap(trail => trail.legs), places: trails.flatMap(trail => trail.places) };
}

export function deriveJourney(facts: readonly LedgerRow[], trails: readonly Trail[], startDay: string, today: string, names: Readonly<Record<string, string>> = {}, jar?: JarInput): JourneyTrek | undefined {
  if (!trails.length) return undefined;
  if (trails.length === 1) {
    const trek = deriveTrek(facts, trails[0]!, startDay, today, names, jar);
    return { ...trek, journey: { trails, index: 0, walked: [{ trail: trails[0]!, legs: trek.legs }] } };
  }
  const all = deriveTrek(facts, joined(trails), startDay, today, names, jar);
  const offsets: number[] = [];
  trails.reduce((sum, trail) => { offsets.push(sum); return sum + trail.legs.length; }, 0);
  // The leg being walked (all.place) falls in one trail; reaching a trail's last camp puts the group at the next
  // trail's start (place 0), so a just-finished trail is never the one on screen unless it is the last.
  let index = trails.findIndex((trail, k) => all.place < offsets[k]! + trail.legs.length);
  if (index < 0) index = trails.length - 1;
  const trail = trails[index]!;
  const offset = offsets[index]!;
  const end = offset + trail.legs.length;
  const inTrail = (leg: number) => leg >= offset && leg < end;
  const rebaseLeg = (state: LegState): LegState => ({ ...state, index: state.index - offset });
  const rebaseStar = (star: Star): Star => ({ ...star, leg: star.leg - offset });
  const slice = (k: number) => all.legs.slice(offsets[k]!, offsets[k]! + trails[k]!.legs.length).map(state => ({ ...state, index: state.index - offsets[k]! }));
  const complete = all.complete;
  const total = trail.legs.length * STRETCHES_PER_LEG;
  const clampStretches = (value: number) => Math.max(0, Math.min(total, value - offset * STRETCHES_PER_LEG));
  const constellations: Constellation[] = all.constellations.filter(row => inTrail(row.leg)).map(row => ({ ...row, leg: row.leg - offset, stars: row.stars.map(rebaseStar) }));
  return {
    ...all,
    trail,
    place: all.place - offset,
    complete,
    legs: all.legs.slice(offset, end).map(rebaseLeg),
    stars: all.stars.filter(star => inTrail(star.leg)).map(rebaseStar),
    constellations,
    // Today's stars stay whole (the night line counts every one, and the scene draws them over the group, not by leg).
    today: { ...all.today, stars: all.today.stars.map(rebaseStar) },
    climb: { ...all.climb, settled: clampStretches(all.climb.settled), at: clampStretches(all.climb.at) },
    journey: { trails, index, walked: trails.slice(0, index + 1).map((walkedTrail, k) => ({ trail: walkedTrail, legs: slice(k) })) },
  };
}

/** The settings row that marks the switch line as seen for a trail (must 12: a row, not localStorage, so a restore keeps it). */
export const TRAIL_SWITCH_PREFIX = 'yatra.trailSwitchSeen.';

/**
 * The one quiet line at a trail switch, shown once (M1, §4): "Next: <trail>" when the group stands at the new trail's
 * start, or "Your walking carried you on to <trail>." when walking already carried it in (the update day for someone
 * past Hampta's end). Null on the first trail and once seen.
 */
export function trailSwitchLine(trek: JourneyTrek, seen: boolean): string | null {
  if (seen || trek.journey.index === 0) return null;
  const atStart = trek.place === 0 && trek.stretch === 0 && trek.jar.carry === 0;
  return atStart ? `Next: ${trek.trail.name}` : `Your walking carried you on to ${trek.trail.name}.`;
}
