/**
 * Sat Q1 (b2 13 Nov, a9's map): the restore review names what a file holds in plain words, in a fixed order, live rows
 * only and never a 0. Every other table is summed into one "Other app data" row. Quest photos and the daily minutes
 * record are never shown: neither lands from a file.
 */
export const RESTORE_LABELS: readonly (readonly [table: string, label: string])[] = [
  ['tasks', 'Tasks'],
  ['focus', 'Focus sessions'],
  ['sessions', 'Workouts'],
  ['puzzleRuns', 'Puzzles played'],
  ['cards', 'Remember cards'],
  ['learnConcepts', 'Learn ideas'],
  ['quests', 'Side quests'],
  ['plans', 'If-then plans'],
  ['dailyLog', 'Daily check-ins'],
  ['reminders', 'Reminders'],
  ['notebookPages', 'Notebook pages'],
  ['privatePacks', 'Private books'],
  ['bookGameStates', 'Read game'],
  ['inventory', 'Things you own'],
  ['ledger', 'Progress record'],
];
/** Tables the review never shows (they are always empty in a file). */
export const RESTORE_HIDDEN: readonly string[] = ['questPhotos', 'phoneUsageMinutes'];
/** The tables known to go into "Other app data" (any table not named anywhere goes there too). */
export const RESTORE_OTHER: readonly string[] = ['taskEvents', 'exercises', 'ladders', 'programs', 'exState', 'sets', 'prs', 'deckProg',
  'lessonProg', 'ratings', 'flags', 'unlocks', 'packs', 'settings', 'learnItems', 'learnDrops', 'skillAttempts', 'notebookVersions'];
export const OTHER_LABEL = 'Other app data';

/** The review's rows from a table → live-row count map: labelled tables in order, then Other; zeros left out. */
export function restoreRows(counts: Readonly<Record<string, number>>): { label: string; count: number }[] {
  const labelled = new Set(RESTORE_LABELS.map(([table]) => table));
  const rows = RESTORE_LABELS.map(([table, label]) => ({ label, count: counts[table] ?? 0 })).filter(row => row.count > 0);
  const other = Object.entries(counts).filter(([table]) => !labelled.has(table) && !RESTORE_HIDDEN.includes(table)).reduce((sum, [, count]) => sum + count, 0);
  return other > 0 ? [...rows, { label: OTHER_LABEL, count: other }] : rows;
}
