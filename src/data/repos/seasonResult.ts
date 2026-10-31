import type { NandiDb } from '../db';
import { trackWrite } from '../../core/pendingWrites';
import { getOrCreateDeviceId } from '../device';
import { finishedSeasons, resultDue, resultShownKey, type SeasonResult } from '../../core/economy/seasonResult';

/** Spec 47c: the result due on this open, if any. Before Season 1 has ended it reads nothing. */
export async function loadResultDue(db: NandiDb, today: string): Promise<SeasonResult | undefined> {
  if (!finishedSeasons(today).length) return undefined;
  const [facts, settings] = await Promise.all([db.ledger.toArray(), db.settings.toArray()]);
  return resultDue(facts, settings, today);
}

/** Written when the page is actually on screen, so an open that was interrupted first shows it next time. */
export async function markResultShown(db: NandiDb, seasonStart: string, now: number): Promise<void> {
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.settings.put({ key: resultShownKey(seasonStart), value: new Date(now).toISOString(), updatedAt: now, deleted: 0, deviceId }));
}
