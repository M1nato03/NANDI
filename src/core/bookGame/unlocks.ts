import { MONTHS } from './arkad';

/**
 * Spec 40 §3 rule A with b2's 11 Nov ruling: count-based pacing blocks. N chapters of the book done (whichever ones)
 * open the first N blocks of months in calendar order: Jan-Mar, Apr-May, Jun-Aug, Sep-Oct, Nov-Dec (3/2/3/2/2). The
 * year plays in calendar order (salary and the pots carry over), so a month is playable when its block is open AND
 * every earlier month has been played. Eligibility comes only from the chapter facts; nothing is stored, and a review
 * falling due never relocks a month.
 */
export const BLOCKS: readonly (readonly number[])[] = [[0, 1, 2], [3, 4], [5, 6, 7], [8, 9], [10, 11]];

/** The game manifest (typed so later books plug in; only Babylon has a game). Rights are the game's own. */
export interface BookGame { gameId: string; bookId: string; title: string; contentVersion: number; rights: { edition: string; status: 'public-domain-in' }; chapters: readonly string[] }
export const BABYLON_GAME: BookGame = {
  gameId: 'arkad-year', bookId: 'richest-man-in-babylon', title: 'Your first year', contentVersion: 1,
  rights: { edition: 'George S. Clason, 1926 (public domain in India)', status: 'public-domain-in' },
  chapters: ['babylon-1', 'babylon-2', 'babylon-3', 'babylon-4', 'babylon-5'],
};
export const BOOK_GAMES: Readonly<Record<string, BookGame>> = { [BABYLON_GAME.bookId]: BABYLON_GAME };

export const blockOf = (month: number) => BLOCKS.findIndex(block => block.includes(month));

/** How many of the game's chapters are done (chapter facts' refIds are `<bookId>:<moduleId>`). */
export function chaptersDone(game: BookGame, done: ReadonlySet<string>): number {
  return game.chapters.filter(moduleId => done.has(`${game.bookId}:${moduleId}`)).length;
}

export type MonthLock = { open: true } | { open: false; reason: string };
/** Why a month is or is not playable now, in one plain line. `played` = months whose result is saved. */
export function monthLock(month: number, chapters: number, played: ReadonlySet<number>): MonthLock {
  const block = blockOf(month);
  if (block < 0) return { open: false, reason: 'This month is not part of the year.' };
  if (block >= chapters) {
    const need = block + 1;
    return { open: false, reason: `Finish ${need === 1 ? 'a chapter' : `${need} chapters`} of the book to open ${MONTHS[month]}.` };
  }
  for (let m = 0; m < month; m++) if (!played.has(m)) return { open: false, reason: `Play ${MONTHS[m]} first. Each month carries into the next.` };
  return { open: true };
}

/** The months open to play so far (the first N blocks), and the next one to play, if any. */
export function yearProgress(chapters: number, played: ReadonlySet<number>): { opened: number[]; next: number | null; playedCount: number } {
  const opened = BLOCKS.slice(0, Math.max(0, Math.min(chapters, BLOCKS.length))).flat();
  const next = opened.find(month => !played.has(month)) ?? null;
  return { opened, next: next !== null && monthLock(next, chapters, played).open ? next : null, playedCount: played.size };
}

/** The months a chapter's finish newly opens (for the chapter-done link): the block that count just reached. */
export function newMonthsAt(chaptersAfter: number): number[] {
  return chaptersAfter >= 1 && chaptersAfter <= BLOCKS.length ? [...BLOCKS[chaptersAfter - 1]!] : [];
}
