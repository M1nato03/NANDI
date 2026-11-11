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
/** `joined`: the member's join day (from their "joined" link), the stable key for join order on every phone. */
export interface CrewMember { id: string; first: string; colour: number; cum: number; date: string; joined?: string; last?: number; src?: CrewSource }
export interface Crew {
  id: string; plan: string; size: CrewSize; made: string;
  /** This phone's own member; `joinedAt` starts its minutes, `sentCum`/`sentDay` are what its last add link carried, `at` its place in join order. */
  me: { id: string; first: string; colour: number; joinedAt: number; sentCum: number; sentDay?: string; skipDay?: string; at?: number; day?: string };
  /** The maker's member id: first in join order on every phone. */
  maker?: string;
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
  return { id: input.id, plan: input.plan, size: input.size, made: input.today, me: { ...input.me, joinedAt: input.now, sentCum: 0, at: 0, day: input.today }, maker: input.me.id, members: [] };
}

/** Joining from an invite: the maker is the first other member. */
export function joinCrew(link: JoinLink, me: { id: string; first: string; colour: number }, now: number, today: string): Crew {
  return { id: link.c, plan: link.p, size: link.s, made: link.mk, me: { ...me, joinedAt: now, sentCum: 0, at: 1, day: today }, maker: link.m, members: [{ id: link.m, first: link.n, colour: link.k, cum: 0, date: link.mk, joined: link.mk }] };
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
    if (known) return { ...crew, members: crew.members.map(member => member.id === link.m ? { ...member, first: link.n, colour: link.k, joined: member.joined && member.joined < link.d ? member.joined : link.d } : member) };
    return { ...crew, members: [...crew.members, { id: link.m, first: link.n, colour: link.k, cum: 0, date: link.d, joined: link.d }] };
  }
  if (link.u > plausibleMax(crew.made, link.d)) return crew;
  if (known) {
    // By date first; on the same date the higher total wins; a newer date with a lower total is ignored (never back).
    const newer = link.d > known.date ? link.u >= known.cum : link.d === known.date && link.u > known.cum;
    if (!newer) return crew;
    return { ...crew, members: crew.members.map(member => member.id === link.m ? { ...member, first: link.n, colour: link.k, cum: link.u, date: link.d, last: link.u - known.cum, src: link.src } : member) };
  }
  return { ...crew, members: [...crew.members, { id: link.m, first: link.n, colour: link.k, cum: link.u, date: link.d, joined: link.d, last: link.u, src: link.src }] };
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
  return `as of ${crew.members.map(member => `${member.first} ${dayWord(member.date, today)}`).join(', ')}`;
}

const SOURCE: Record<JarKind, CrewSource> = { train: 'workout', mind: 'puzzle', calm: 'Calm', focus: 'focus', read: 'chapter', lesson: 'lesson', lightsout: 'lights out' };

/** The minutes not yet sent and whether they reach back before today ("Send your 45 m" vs "Send today's 45 m"). */
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

/** Everyone in join order, the same on every phone: the maker first, this phone at its own place (never put first). */
export function joinOrder(crew: Crew): { first: string; colour: number }[] {
  // A key every phone has, whatever order the links arrived in: the maker first, then join day, then member id.
  const everyone = [{ id: crew.me.id, first: crew.me.first, colour: crew.me.colour, joined: crew.me.day ?? crew.made }, ...crew.members.map(member => ({ id: member.id, first: member.first, colour: member.colour, joined: member.joined ?? member.date }))];
  const maker = crew.maker ?? (crew.me.at === 0 ? crew.me.id : crew.members[0]?.id);
  const people = everyone.sort((a, b) => Number(b.id === maker) - Number(a.id === maker) || a.joined.localeCompare(b.joined) || a.id.localeCompare(b.id))
    .map(({ first, colour }) => ({ first, colour }));
  // No two dots in a crew share a colour: walking in join order, a colour already used moves to the next free one,
  // so every phone (same join order) shows the same colours.
  const used = new Set<number>();
  return people.map(person => {
    let colour = ((person.colour % CREW_COLOURS) + CREW_COLOURS) % CREW_COLOURS;
    while (used.has(colour)) colour = (colour + 1) % CREW_COLOURS;
    used.add(colour);
    return { ...person, colour };
  });
}
/** The palette size (Crew.tsx's COLOURS); a crew holds at most 5, so a free colour always exists. */
export const CREW_COLOURS = 8;
/** A joiner's own colour: never the maker's (the invite carries it), and the same for the same invite. */
export const joinerColour = (makerColour: number) => (makerColour + 1) % CREW_COLOURS;

/**
 * The crew screen's "Latest": each member's newest add, in join order, with the day of its link ("Dev +4 h · workout ·
 * sent today"). An add carries everything since that member's last link, so it is named by its day, never as "today's".
 */
export function latestAdds(crew: Crew, today: string): string[] {
  return crew.members.filter(member => (member.last ?? 0) > 0).map(member => `${member.first} +${jarDuration(member.last ?? 0)} · ${member.src ?? 'jar'} · sent ${dayWord(member.date, today)}`);
}
const dayWord = (date: string, today: string) => { const gap = days(date, today); return gap <= 0 ? 'today' : gap === 1 ? 'yesterday' : `${gap}\u00a0days ago`; };

/** The words that travel in chats: they must read well for someone without the app (Jenil sees them at the preview). */
export function inviteText(crew: Crew, url: string): string {
  return `Join my NANDI crew: when we fill ${crew.size} h together, it's ${crew.plan}. ${url}`;
}
/** After the invite the plan never travels again: these two read as "our crew" (jenil-a9's wording, Jenil's at the preview). */
export function joinedText(crew: Crew, url: string): string {
  return `${crew.me.first} joined our NANDI crew. ${url}`;
}
export function addText(crew: Crew, minutes: number, total: number, url: string): string {
  return `${crew.me.first} added ${jarDuration(minutes)} to our crew jar · ${jarDuration(total)} of ${crew.size} h · ${url}`;
}

