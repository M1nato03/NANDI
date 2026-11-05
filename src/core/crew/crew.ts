import { CREW_MAX, type AddLink, type CrewLink, type CrewSize, type CrewSource, type JoinLink } from './links';
import { JAR, jarDuration, type JarEntry, type JarKind } from '../yatra/jar';

/**
 * Spec 55: a crew is a shared jar kept on every member's phone and moved only by links people choose to send. No
 * server. Each phone keeps the latest known cumulative minutes per member; the crew total is their sum. Nothing is
 * ever taken away: a member who leaves keeps their dot and their past minutes in the others' totals.
 */
export const CREW_KEY = 'crew.current';
export const CREW_SEEN_KEY = 'crew.seen';

/** `last` and `src`: what the newest add link added and its top source, for the crew screen's "today's adds". */
export interface CrewMember { id: string; first: string; colour: number; cum: number; date: string; last?: number; src?: CrewSource }
export interface Crew {
  id: string; plan: string; size: CrewSize; made: string;
  /** This phone's own member; `joinedAt` starts its minutes, `sentCum`/`sentDay` are what its last add link carried. */
  me: { id: string; first: string; colour: number; joinedAt: number; sentCum: number; sentDay?: string; skipDay?: string };
  /** The other members, in join order. */
  members: CrewMember[];
}

const days = (from: string, to: string) => Math.round((new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()) / 86_400_000);
const addDays = (day: string, n: number) => { const date = new Date(`${day}T12:00:00`); date.setDate(date.getDate() + n); return date.toISOString().slice(0, 10); };

/** The most anyone can have put in since the crew was made: the jar's daily cap for each day. */
export const plausibleMax = (made: string, date: string) => JAR.dayCap * (days(made, date) + 1);

export function readCrew(value: unknown): Crew | null {
  if (!value || typeof value !== 'object') return null;
  const crew = value as Crew;
  return typeof crew.id === 'string' && typeof crew.plan === 'string' && crew.me && Array.isArray(crew.members) ? crew : null;
}

export function makeCrew(input: { id: string; plan: string; size: CrewSize; me: { id: string; first: string; colour: number }; now: number; today: string }): Crew {
  return { id: input.id, plan: input.plan, size: input.size, made: input.today, me: { ...input.me, joinedAt: input.now, sentCum: 0 }, members: [] };
}

/** Joining from an invite: the maker is the first other member. */
export function joinCrew(link: JoinLink, me: { id: string; first: string; colour: number }, now: number): Crew {
  return { id: link.c, plan: link.p, size: link.s, made: link.mk, me: { ...me, joinedAt: now, sentCum: 0 }, members: [{ id: link.m, first: link.n, colour: link.k, cum: 0, date: link.mk }] };
}

/**
 * A "joined" or "add" link arriving. Returns the crew unchanged when the link is for another crew, from this phone,
 * impossible, older than what is known, or would make a sixth member. Never throws, never blames anyone.
 */
export function applyLink(crew: Crew, link: CrewLink, today: string): Crew {
  if (link.t === 'join' || link.c !== crew.id || link.m === crew.me.id) return crew;
  if (link.d < crew.made || link.d > addDays(today, 1)) return crew;
  const known = crew.members.find(member => member.id === link.m);
  if (!known && crew.members.length + 1 >= CREW_MAX) return crew;
  if (link.t === 'joined') {
    if (known) return { ...crew, members: crew.members.map(member => member.id === link.m ? { ...member, first: link.n, colour: link.k } : member) };
    return { ...crew, members: [...crew.members, { id: link.m, first: link.n, colour: link.k, cum: 0, date: link.d }] };
  }
  if (link.u > plausibleMax(crew.made, link.d)) return crew;
  if (known) {
    // By date first; on the same date the higher total wins; a newer date with a lower total is ignored (never back).
    const newer = link.d > known.date ? link.u >= known.cum : link.d === known.date && link.u > known.cum;
    if (!newer) return crew;
    return { ...crew, members: crew.members.map(member => member.id === link.m ? { ...member, first: link.n, colour: link.k, cum: link.u, date: link.d, last: link.u - known.cum, src: link.src } : member) };
  }
  return { ...crew, members: [...crew.members, { id: link.m, first: link.n, colour: link.k, cum: link.u, date: link.d, last: link.u, src: link.src }] };
}

/** This phone's minutes for the crew: jar minutes counted (after the daily cap) since joining. */
export function myCrewMinutes(crew: Crew, entries: readonly JarEntry[]): number {
  return entries.filter(entry => entry.at >= crew.me.joinedAt).reduce((total, entry) => total + entry.counted, 0);
}

export function crewTotal(crew: Crew, mine: number): number {
  return mine + crew.members.reduce((total, member) => total + member.cum, 0);
}
export const crewFilled = (crew: Crew, mine: number) => crewTotal(crew, mine) >= crew.size * 60;

/** "as of Riya today, Dev yesterday", in day words from the link dates; no clock times. */
export function asOfLine(crew: Crew, today: string): string | null {
  if (!crew.members.length) return null;
  const word = (date: string) => { const gap = days(date, today); return gap <= 0 ? 'today' : gap === 1 ? 'yesterday' : `${gap} days ago`; };
  return `as of ${crew.members.map(member => `${member.first} ${word(member.date)}`).join(', ')}`;
}

const SOURCE: Record<JarKind, CrewSource> = { train: 'workout', mind: 'puzzle', calm: 'Calm', focus: 'focus', read: 'chapter', lesson: 'lesson', lightsout: 'lights out' };

/** The minutes not yet sent and whether they reach back before today ("Send your 45 min" vs "Send today's 45 min"). */
export function unsent(crew: Crew, entries: readonly JarEntry[], today: string): { minutes: number; onlyToday: boolean; top: CrewSource } {
  const mine = myCrewMinutes(crew, entries);
  const minutes = Math.max(0, mine - crew.me.sentCum);
  const counted = entries.filter(entry => entry.at >= crew.me.joinedAt && entry.counted > 0);
  const todays = counted.filter(entry => entry.dayKey === today).reduce((total, entry) => total + entry.counted, 0);
  const by = new Map<CrewSource, number>();
  for (const entry of counted) { const source = entry.label === 'idea read' ? 'idea' : SOURCE[entry.kind]; by.set(source, (by.get(source) ?? 0) + entry.counted); }
  const top = [...by].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'focus';
  return { minutes, onlyToday: minutes <= todays, top };
}

/** The add link this phone would send now (cumulative, so a missed message heals with the next). */
export function addLink(crew: Crew, entries: readonly JarEntry[], today: string): AddLink {
  const { top } = unsent(crew, entries, today);
  return { v: 1, t: 'add', c: crew.id, m: crew.me.id, n: crew.me.first, k: crew.me.colour, u: myCrewMinutes(crew, entries), d: today, src: top };
}

/** The crew screen's "today's adds only": "Riya +10 · workout" for members whose newest add is dated today. */
export function todaysAdds(crew: Crew, today: string): string[] {
  return crew.members.filter(member => member.date === today && (member.last ?? 0) > 0).map(member => `${member.first} +${jarDuration(member.last ?? 0)} · ${member.src ?? 'jar'}`);
}

/** The words that travel in chats: they must read well for someone without the app (Jenil sees them at the preview). */
export function inviteText(crew: Crew, url: string): string {
  return `Join my NANDI crew: when we fill ${crew.size} h together, it's ${crew.plan}. ${url}`;
}
export function joinedText(crew: Crew, url: string): string {
  return `${crew.me.first} joined the ${crew.plan} crew on NANDI. ${url}`;
}
export function addText(crew: Crew, minutes: number, total: number, url: string): string {
  return `${crew.me.first} added ${jarDuration(minutes)} to ${crew.plan} · ${jarDuration(total)} of ${crew.size} h · ${url}`;
}

