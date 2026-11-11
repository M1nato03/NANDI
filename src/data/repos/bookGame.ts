import { trackWrite } from '../../core/pendingWrites';
import { dayKey } from '../../core/time';
import { shutdownAt } from '../../core/tasks/planner';
import { allSignsFound, applyAction, enterMonth, fresh, SIGN_MONTHS, type Action, type ArkadState } from '../../core/bookGame/arkad';
import { bookGameFactId, SIGN_XP_DEFAULT, SIGN_XP_FLAG } from '../../core/bookGame/award';
import { BOOK_GAMES } from '../../core/bookGame/unlocks';
import { getOrCreateDeviceId } from '../device';
import type { NandiDb } from '../db';
import type { BookGameStateRow } from '../types';
import { effectiveBedtime } from './night';

/**
 * Spec 40 §5: a book game's year lives in Dexie (bookGameStates, v7), one row per book. Each step of the engine is
 * saved in one transaction with what it pays (only when the XP flag is on); a month's result is saved once and
 * reopens read-only; a replay is a separate read-only path, so nothing here erases the history.
 */
export async function loadGame(db: NandiDb, bookId: string): Promise<ArkadState | null> {
  const row = await db.bookGameStates.get(bookId);
  return row && !row.deleted ? row.state : null;
}

/** The months with a saved result (history point), the year's only notion of "played". */
export const playedMonths = (state: ArkadState | null): Set<number> => new Set((state?.history ?? []).flatMap((point, month) => point ? [month] : []));

async function put(db: NandiDb, bookId: string, state: ArkadState, now: number) {
  const game = BOOK_GAMES[bookId];
  if (!game) throw new Error(`No game for ${bookId}`);
  const row: BookGameStateRow = { id: bookId, bookId, gameId: game.gameId, contentVersion: game.contentVersion, state, updatedAt: now, deleted: 0, deviceId: await getOrCreateDeviceId(db, now) };
  await db.bookGameStates.put(row);
}

/** Saves an in-month change (goal, split chips, cancelled subscriptions, found phrases, festival number). */
export async function saveDraft(db: NandiDb, bookId: string, state: ArkadState, now = Date.now()): Promise<void> {
  await trackWrite(() => put(db, bookId, state, now));
}

/**
 * Opens a month. Re-entering a month whose salary already landed changes nothing (the engine's `credited`), and a month
 * whose result is saved is never re-entered (read-only), so a double tap applies salary once.
 */
export async function startMonth(db: NandiDb, bookId: string, month: number, now = Date.now()): Promise<ArkadState> {
  let next: ArkadState | null = null;
  await trackWrite(() => db.transaction('rw', [db.bookGameStates, db.settings], async () => {
    const current = (await db.bookGameStates.get(bookId))?.state ?? fresh();
    if (current.history[month]) { next = current; return; }
    if (current.phase === 'play' && current.month === month) { next = current; return; }
    next = enterMonth(current, month);
    await put(db, bookId, next, now);
  }));
  return next!;
}

/**
 * Plays the month's move and saves the result in one transaction. With the XP flag on (off by default) a sign month
 * whose warnings were all found writes its one fact (existing-id check), and the first one sets economy.v11From.
 * Returns the new state and what it paid (0 with the flag off).
 */
export async function playMove(db: NandiDb, bookId: string, action: Action, now = Date.now()): Promise<{ state: ArkadState; paid: number }> {
  let out = { state: fresh(), paid: 0 };
  const night = now >= shutdownAt(now, await effectiveBedtime(db, now));
  const deviceId = await getOrCreateDeviceId(db, now);
  await trackWrite(() => db.transaction('rw', [db.bookGameStates, db.ledger, db.settings], async () => {
    const current = (await db.bookGameStates.get(bookId))?.state;
    if (!current || current.phase !== 'play' || current.history[current.month]) { out = { state: current ?? fresh(), paid: 0 }; return; }
    const month = current.month;
    const next = applyAction(current, action);
    await put(db, bookId, next, now);
    let paid = 0;
    const flag = (await db.settings.get(SIGN_XP_FLAG))?.value;
    if ((flag === true || (flag === undefined && SIGN_XP_DEFAULT)) && (SIGN_MONTHS as readonly number[]).includes(month) && allSignsFound(month, current.found)) {
      const id = bookGameFactId(bookId, month);
      if (!await db.ledger.get(id)) {
        const today = dayKey(now);
        if (!(await db.settings.get('economy.v11From'))) await db.settings.put({ key: 'economy.v11From', value: today, updatedAt: now, deleted: 0, deviceId });
        await db.ledger.add({ id, mode: 'read', kind: 'book-game', refId: `${bookId}:${month}`, dayKey: today, inputs: { month, afterBedtime: night }, updatedAt: now, deleted: 0, deviceId });
        paid = night ? 0 : 10;
      }
    }
    out = { state: next, paid };
  }));
  return out;
}
