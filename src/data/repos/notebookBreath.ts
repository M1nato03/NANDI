import type { NandiDb } from '../db';
import type { SettingRow } from '../types';
import { trackWrite } from '../../core/pendingWrites';
import { getOrCreateDeviceId } from '../device';
import { OPENING_MODES, type OpeningMode } from '../../core/calm/squareBreath';

/**
 * Spec 45a: the square breath's three settings. They live in the settings table, so a backup carries them; anything
 * missing or unreadable reads as its default (once a day, holds on, never shown).
 */
export const breathKeys = { opening: 'notebook.breath.opening', holds: 'notebook.breath.holds', lastShownDay: 'notebook.breath.lastShownDay' } as const;
export type BreathSettings = { opening: OpeningMode; holds: boolean; lastShownDay: string | null };
export const DEFAULT_BREATH_SETTINGS: BreathSettings = { opening: 'daily', holds: true, lastShownDay: null };

const DAY = /^\d{4}-\d{2}-\d{2}$/;
export function readBreathSettings(rows: readonly Pick<SettingRow, 'key' | 'value' | 'deleted'>[] | undefined): BreathSettings {
  const value = (key: string) => rows?.find(row => row.key === key && !row.deleted)?.value;
  const opening = value(breathKeys.opening), holds = value(breathKeys.holds), last = value(breathKeys.lastShownDay);
  return {
    opening: OPENING_MODES.includes(opening as OpeningMode) ? opening as OpeningMode : DEFAULT_BREATH_SETTINGS.opening,
    holds: typeof holds === 'boolean' ? holds : DEFAULT_BREATH_SETTINGS.holds,
    lastShownDay: typeof last === 'string' && DAY.test(last) ? last : null,
  };
}

export async function loadBreathSettings(db: NandiDb): Promise<BreathSettings> {
  return readBreathSettings(await db.settings.where('key').anyOf(Object.values(breathKeys)).toArray());
}

async function put(db: NandiDb, key: string, value: unknown, now: number): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.settings.put({ key, value, updatedAt: now, deleted: 0, deviceId }));
}
export const saveOpeningMode = (db: NandiDb, mode: OpeningMode, now: number) => put(db, breathKeys.opening, mode, now);
export const saveHolds = (db: NandiDb, holds: boolean, now: number) => put(db, breathKeys.holds, holds, now);
/** Written when the opening breath is actually shown (skipped or not), so it does not come back the same day. */
export const markBreathShown = (db: NandiDb, day: string, now: number) => put(db, breathKeys.lastShownDay, day, now);
