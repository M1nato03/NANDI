import type { NandiDb } from '../db';
import { trackWrite } from '../../core/pendingWrites';
import { getOrCreateDeviceId } from '../device';
import { dayKey } from '../../core/time/dayKey';
import { applyLink, CREW_KEY, CREW_SEEN_KEY, joinCrew, readCrew, type Crew } from '../../core/crew/crew';
import { decodeCrewLink, type CrewLink } from '../../core/crew/links';

/**
 * Spec 55: the crew lives in two backed-up settings rows (one crew per person in v1, at most five members), so there is
 * no new table and no Dexie bump. Leaving deletes this phone's crew; the others keep this phone's past minutes.
 */
const SEEN_MAX = 200;

export async function loadCrew(db: NandiDb): Promise<Crew | null> {
  const row = await db.settings.get(CREW_KEY);
  return row && !row.deleted ? readCrew(row.value) : null;
}

export async function saveCrew(db: NandiDb, crew: Crew | null, now: number): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.settings.put({ key: CREW_KEY, value: crew, updatedAt: now, deleted: crew ? 0 : 1, deviceId }));
}

/** A fresh id for a crew or a member: lowercase letters and digits, as the link validator expects. */
export function crewId(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => (byte % 36).toString(36)).join('');
}

export type LinkOutcome = 'joined-offer' | 'applied' | 'ignored' | 'invalid' | 'no-crew' | 'other-crew';

/**
 * One route for every crew link, from the app or the browser: validate, then apply. A join link is only offered (the
 * person taps Join); "joined" and "add" links update the crew once (the same link twice changes nothing).
 */
export async function receiveCrewLink(db: NandiDb, route: string, now: number, today: string): Promise<{ outcome: LinkOutcome; link?: CrewLink }> {
  const link = decodeCrewLink(route);
  if (!link) return { outcome: 'invalid' };
  if (link.t === 'join') return { outcome: 'joined-offer', link };
  const crew = await loadCrew(db);
  if (!crew) return { outcome: 'no-crew', link };
  if (crew.id !== link.c) return { outcome: 'other-crew', link };
  const next = applyLink(crew, link, today);
  if (next === crew) return { outcome: 'ignored', link };
  await saveCrew(db, next, now);
  const seen = await db.settings.get(CREW_SEEN_KEY);
  const list = Array.isArray(seen?.value) ? (seen!.value as string[]) : [];
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.settings.put({ key: CREW_SEEN_KEY, value: [...list, route.replace(/^#/, '')].slice(-SEEN_MAX), updatedAt: now, deleted: 0, deviceId }));
  return { outcome: 'applied', link };
}

export async function acceptJoin(db: NandiDb, route: string, me: { first: string; colour: number }, now: number): Promise<Crew | null> {
  const link = decodeCrewLink(route);
  if (!link || link.t !== 'join') return null;
  const crew = joinCrew(link, { id: crewId(), ...me }, now, dayKey(now));
  await saveCrew(db, crew, now);
  return crew;
}
