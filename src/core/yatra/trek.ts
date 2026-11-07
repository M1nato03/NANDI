import type { FocusRow, LedgerRow } from '../../data/types';
import type { Trail } from './trail';
import { dayKey } from '../time/dayKey';
import { deriveJar, JAR, JAR_KINDS, jarActs, sessionKind, type JarEntry, type JarKind, type SessionKind } from './jar';

/**
 * Spec 34: the trek and the sky, derived from the ledger like the courtyard (nothing new is stored but the start day
 * and constellation names). Every finished Train session, solved Mind board or case, and Calm session is one
 * session: it moves the group one stretch and lights one star. Three stretches reach the next place; reaching a place
 * ends that day's walk (later sessions that day still light stars over that camp). The trek never goes backwards,
 * and a day with no session is a camp day, never a gap.
 *
 * Spec 54: from the jar's first day (jarFrom) the trail walks in jar minutes instead (10 a stretch, at most 60 a day,
 * see jar.ts); the days before keep the walk they had, so no install moves back and none leaps ahead on the update day.
 */
export type { SessionKind } from './jar';
export { sessionKind } from './jar';
export const STRETCHES_PER_LEG = 3;
export const STAR_COLOURS: Record<SessionKind, string> = { train: '#FF6A1A', mind: '#55c1ba', calm: '#f6dc9a' };

/** Ledger kinds worth reading for Yatra (indexed query): the sessions, and from spec 54 everything the jar reads. */
export const YATRA_KINDS = JAR_KINDS;

export interface Star { id: string; kind: SessionKind; dayKey: string; leg: number; stretch: boolean }
export interface LegState {
  index: number;
  stretches: { kind: JarKind; dayKey: string }[];
  doneOn?: string;
  /** The first Mind session that walked this leg opened its landmark gate (item 192 h). */
  gateOn?: string;
}
export interface Constellation { id: string; leg: number; name: string; stars: Star[]; formedOn: string }
export interface Trek {
  trail: Trail;
  /** Index of the last place reached. */
  place: number;
  /** Stretches walked into the leg after it (0-2). */
  stretch: number;
  complete: boolean;
  legs: LegState[];
  stars: Star[];
  constellations: Constellation[];
  today: { stars: Star[]; campDay: boolean; atPlace: boolean };
  /** Spec 54: what each act put in the jar from jarFrom (after the cap), and today's minutes. */
  jar: { from?: string; entries: JarEntry[]; todayMinutes: number; capped: boolean; carry: number };
}

const addDays = (day: string, days: number) => { const date = new Date(`${day}T12:00:00`); date.setDate(date.getDate() + days); return dayKey(date); };
const daysBetween = (from: string, to: string) => Math.round((new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()) / 86_400_000);
const WEEK = 7;
const ordinal = ['', ' II', ' III', ' IV', ' V', ' VI'];

export function deriveTrek(facts: readonly LedgerRow[], trail: Trail, startDay: string, today: string, names: Readonly<Record<string, string>> = {}, jar?: { from: string; focus: readonly FocusRow[]; focusRateFrom?: string }): Trek {
  // Before jarFrom (or without a jar): one stretch per session, one place a day.
  const sessions = facts
    .map(fact => ({ fact, kind: sessionKind(fact) }))
    .filter((row): row is { fact: LedgerRow; kind: SessionKind } => row.kind !== null && row.fact.dayKey >= startDay && row.fact.dayKey <= today && (!jar || row.fact.dayKey < jar.from))
    .sort((a, b) => a.fact.dayKey.localeCompare(b.fact.dayKey) || a.fact.updatedAt - b.fact.updatedAt || a.fact.id.localeCompare(b.fact.id));
  const legs: LegState[] = trail.legs.map((_, index) => ({ index, stretches: [] }));
  const stars: Star[] = [];
  let leg = 0, stretch = 0, day = '', reachedToday = false;
  const complete = () => leg >= legs.length;
  for (const { fact, kind } of sessions) {
    if (fact.dayKey !== day) { day = fact.dayKey; reachedToday = false; }
    const walks = !complete() && !reachedToday;
    // A star over tonight's camp: the leg being walked, or the one just finished today (or the last, once complete).
    const starLeg = walks ? leg : Math.max(0, leg - 1);
    if (walks) {
      const state = legs[leg]!;
      state.stretches.push({ kind, dayKey: day });
      if (kind === 'mind' && !state.gateOn) state.gateOn = day;
      stretch++;
      if (stretch === STRETCHES_PER_LEG) { state.doneOn = day; leg++; stretch = 0; reachedToday = true; }
    }
    stars.push({ id: fact.id, kind, dayKey: day, leg: starLeg, stretch: walks });
  }
  // From jarFrom: jar minutes, 10 a stretch, at most 60 a day; the minutes left over carry to the next act.
  const entries = jar ? deriveJar(jarActs(facts, jar.focus, jar.focusRateFrom), jar.from > startDay ? jar.from : startDay, today) : [];
  let carry = 0;
  for (const entry of entries) {
    const legBefore = Math.min(leg, legs.length - 1);
    const overCamp = complete() ? Math.max(0, leg - 1) : stretch === 0 ? Math.max(0, leg - 1) : leg;
    if (!complete()) carry += entry.counted;
    while (carry >= JAR.stretchMinutes && !complete()) {
      carry -= JAR.stretchMinutes;
      const state = legs[leg]!;
      state.stretches.push({ kind: entry.kind, dayKey: entry.dayKey });
      if (entry.kind === 'mind' && !state.gateOn) state.gateOn = entry.dayKey;
      stretch++;
      if (stretch === STRETCHES_PER_LEG) { state.doneOn = entry.dayKey; leg++; stretch = 0; }
    }
    // Only sessions light stars, as before; one past the cap shines over tonight's camp.
    if (entry.kind === 'train' || entry.kind === 'mind' || entry.kind === 'calm') stars.push({ id: entry.id, kind: entry.kind, dayKey: entry.dayKey, leg: entry.counted > 0 ? legBefore : overCamp, stretch: entry.counted > 0 });
  }
  const todayMinutes = entries.filter(entry => entry.dayKey === today).reduce((total, entry) => total + entry.counted, 0);
  // A leg's stars join into a constellation when the leg ends, or when a week of it has passed, whichever is first
  // (two or more stars make one; a lone star stays a star).
  const constellations: Constellation[] = [];
  legs.forEach(state => {
    const own = stars.filter(star => star.leg === state.index);
    if (!own.length) return;
    const first = own[0]!.dayKey;
    const windows = new Map<number, Star[]>();
    for (const star of own) { const window = Math.floor(daysBetween(first, star.dayKey) / WEEK); windows.set(window, [...(windows.get(window) ?? []), star]); }
    const lastWindow = Math.max(...windows.keys());
    for (const [window, group] of windows) {
      const weekEnd = addDays(first, (window + 1) * WEEK - 1);
      const closedByLeg = window === lastWindow && state.doneOn !== undefined;
      const closedByWeek = weekEnd < today;
      if ((!closedByLeg && !closedByWeek) || group.length < 2) continue;
      const id = window === 0 ? trail.legs[state.index]!.landmark.id : `${trail.legs[state.index]!.landmark.id}-${window + 1}`;
      const suggested = `${trail.legs[state.index]!.constellation}${ordinal[window] ?? ` ${window + 1}`}`;
      constellations.push({ id, leg: state.index, name: names[id]?.trim() || suggested, stars: group, formedOn: closedByLeg ? state.doneOn! : weekEnd });
    }
  });
  const todayStars = stars.filter(star => star.dayKey === today);
  return {
    trail, place: leg, stretch, complete: complete(), legs, stars, constellations,
    // A day with real things in the jar but no session still walked: not a camp day.
    today: { stars: todayStars, campDay: todayStars.length === 0 && todayMinutes === 0, atPlace: stretch === 0 },
    jar: { from: jar?.from, entries, todayMinutes, capped: todayMinutes >= JAR.dayCap, carry },
  };
}

/** Where the trek is, in words: "Stretch 2 of 3 to Chika", or the place reached. Never kilometres. */
export function trekLine(trek: Trek): string {
  const places = trek.trail.places;
  if (trek.complete) return `${trek.trail.name}: trail complete`;
  const next = places[trek.place + 1]!;
  return trek.stretch === 0 ? `At ${places[trek.place]!.name}. Next: ${next.name}` : `Stretch ${trek.stretch} of ${STRETCHES_PER_LEG} to ${next.name}`;
}
