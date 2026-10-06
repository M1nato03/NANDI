// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import fixtureText from '../../legacy/data/fixture-legacy-export.json?raw';
import { createDb, type NandiDb } from './db';
import { detectRestoreKind, exportBackup } from './backup';
import { importLegacy, isLegacyExport, mapLegacy, validateLegacy } from './legacy-import';

const fixture = JSON.parse(fixtureText) as {
  cards: { id: string; due: string; last?: string }[];
  progress: {
    ratings: Record<string, number>; items: Record<string, { b: number; due: string }>;
    cases: Record<string, { secs: number }>; hidden: Record<string, boolean>;
    flags: { id: string; t: string; at: string }[];
  };
};
const options = { deviceId: 'test-device', now: 123456789 };
let serial = 0;
const opened: NandiDb[] = [];
function freshDb() {
  const db = createDb(`legacy-import-test-${++serial}`);
  opened.push(db);
  return db;
}
afterEach(async () => { for (const db of opened.splice(0)) await db.delete(); });

describe('legacy import', () => {
  it('detects the legacy shape and routes restore files', async () => {
    expect(isLegacyExport(fixture)).toBe(true);
    expect(isLegacyExport({ cards: [], progress: null })).toBe(true);
    expect(isLegacyExport({ cards: [] })).toBe(false);
    expect(detectRestoreKind(fixture)).toBe('legacy');
    expect(detectRestoreKind(await exportBackup(freshDb(), 1000))).toBe('backup');
    expect(detectRestoreKind({ app: 'nandi', cards: [], progress: {} })).toBe('backup');
    expect(detectRestoreKind({ cards: 'junk', progress: {} })).toBe('legacy');
    expect(detectRestoreKind({ unrelated: true })).toBe('unknown');
    expect(detectRestoreKind('junk')).toBe('unknown');
  });

  it('validates loose legacy fields and reports bad paths', () => {
    expect(validateLegacy(fixture).success).toBe(true);
    expect(validateLegacy('{').errors).toContain('Invalid JSON');
    expect(validateLegacy({ cards: 'junk', progress: {} }).errors.join(' ')).toMatch(/cards/i);
    expect(validateLegacy({ cards: [{ id: 'a', due: 'bad' }], progress: {} }).errors.join(' ')).toMatch(/cards\.0\.due/i);
    expect(validateLegacy({ cards: [], progress: { items: { bad: { b: 'wrong' } } } }).errors.join(' ')).toMatch(/items.*b/i);
  });

  it('maps every fixture entry with natural IDs, preserved dates, and retired state', () => {
    const original = structuredClone(fixture);
    const rows = mapLegacy(fixture, options);
    const expected = {
      cards: fixture.cards.length,
      ratings: Object.keys(fixture.progress.ratings).length,
      deckProg: Object.keys(fixture.progress.items).length,
      puzzleRuns: Object.keys(fixture.progress.cases).length,
      flags: new Set([...Object.keys(fixture.progress.hidden).filter(id => fixture.progress.hidden[id]),
        ...fixture.progress.flags.map(flag => flag.id)]).size,
      lessonProg: 0,
      plans: 0,
      settings: 8,
      skipped: 0,
    };
    expect(expected).toEqual({ cards: 3, ratings: 2, deckProg: 3, puzzleRuns: 2, flags: 1, lessonProg: 0, plans: 0, settings: 8, skipped: 0 });
    expect(Object.fromEntries(Object.entries(rows).map(([key, value]) => [key, value.length]))).toEqual(expected);
    expect(rows.cards[0]).toMatchObject({ id: 'l4-1', deckId: 'greene', packId: 'deck.greene', itemId: 'l4-1', topic: '4', due: '2026-10-04' });
    expect(rows.cards.find(card => card.id === 'l4-2')).not.toHaveProperty('last');
    expect(rows.deckProg.find(item => item.id === 'mm-1')).toMatchObject({ b: 99, due: '9999-12-31' });
    expect(rows.puzzleRuns.find(run => run.daily)).toMatchObject({ id: 'legacy-case-daily-2026-10-03', dayKey: '2026-10-03', source: 'legacy', solveMs: 120000 });
    expect(rows.flags[0]).toMatchObject({ refId: 'sp-12-1', hidden: true, kind: 'spot' });
    expect(mapLegacy(fixture, options)).toEqual(rows);
    expect(fixture).toEqual(original);
  });

  it('imports in one transaction, preserves local settings, and is idempotent', async () => {
    const db = freshDb();
    for (const key of ['deviceId', 'lastBackupAt', 'retired']) {
      await db.settings.add({ key, value: key, updatedAt: 1, deleted: 0, deviceId: 'local' });
    }
    const counts = await importLegacy(db, fixture, options);
    const snapshot = async () => Object.fromEntries(await Promise.all(
      ['cards', 'ratings', 'deckProg', 'puzzleRuns', 'flags', 'lessonProg', 'plans', 'settings'].map(async name =>
        [name, await db.table(name).toArray()]),
    ));
    const first = await snapshot();
    expect(counts).toEqual({ cards: 3, ratings: 2, deckProg: 3, puzzleRuns: 2, flags: 1, lessonProg: 0, plans: 0, settings: 8, skipped: [] });
    expect(await importLegacy(db, fixture, options)).toEqual(counts);
    expect(await snapshot()).toEqual(first);
    for (const key of ['deviceId', 'lastBackupAt', 'retired']) {
      expect(await db.settings.get(key)).toEqual({ key, value: key, updatedAt: 1, deleted: 0, deviceId: 'local' });
    }
    await expect(importLegacy(db, { cards: 'bad', progress: {} }, options)).rejects.toThrow(/cards/i);
    expect(await snapshot()).toEqual(first);
  });

  it('accepts the newer lesson-card, lesson progress, plan, and daily puzzle fields', () => {
    const newer = structuredClone(fixture) as Record<string, unknown> & { cards: Record<string, unknown>[]; progress: Record<string, unknown> };
    newer.cards.push({ id: 'course-l1-1', track: 'course', due: '2026-10-05', box: 0, reviews: 0 });
    newer.progress.learn = {
      done: { c1: { at: '2026-10-03', g: true, c: 3, t: false, w: true } },
      last: { course: '2026-10-03' },
      plans: [{ lesson: 'c1', i: 'cue', t: 'action', made: '2026-10-03', fired: 'yes' }],
    };
    newer.progress.pzd = { '2026-10-03': { type: 'sudoku', diff: 'easy', result: 'solved', secs: 42, hints: 0 } };
    const rows = mapLegacy(newer, options);
    expect(rows.cards.at(-1)).toMatchObject({ deckId: 'course', itemId: 'course-l1-1' });
    expect(rows.lessonProg[0]).toMatchObject({ id: 'c1', packId: 'lessons.charaka-holds-up', doneDayKey: '2026-10-03', guessOk: true, conf: 3 });
    expect(rows.plans[0]).toMatchObject({ lessonId: 'c1', madeDayKey: '2026-10-03', ifText: 'cue', thenText: 'action', fired: 'yes' });
    expect(rows.puzzleRuns.at(-1)).toMatchObject({ id: 'legacy-puzzle-daily-2026-10-03', type: 'sudoku', dayKey: '2026-10-03', solveMs: 42000 });
    expect(rows.settings.find(row => row.key === 'legacy.learn.last')?.value).toEqual({ course: '2026-10-03' });
    expect(rows.skipped).toEqual([]);
  });

  it('imports mastery bests and course last dates from a fixture copy, and reports unknown keys', async () => {
    const newer = structuredClone(fixture) as Record<string, unknown> & { progress: Record<string, unknown> };
    newer.progress.pzs = {
      sudoku: { solved: 3, best: { easy: 42, hard: { secs: 90, date: '2026-10-02' } } },
      crowns: { solved: 1, best: { medium: { score: 7 } } },
    };
    newer.progress.learn = { last: { gita: '2026-10-03' } };
    newer.progress.zzz = { future: true };
    const rows = mapLegacy(newer, options);
    expect(rows.skipped).toEqual(['progress.zzz']);
    expect(rows.puzzleRuns).toHaveLength(5);
    expect(rows.puzzleRuns.find(run => run.id === 'legacy-best-sudoku-easy')).toMatchObject({
      type: 'sudoku', diff: 'easy', source: 'legacy', result: 'solved', legacyBest: true, solveMs: 42000, hintsUsed: 0,
    });
    expect(rows.puzzleRuns.find(run => run.id === 'legacy-best-sudoku-easy')).not.toHaveProperty('dayKey');
    expect(rows.puzzleRuns.find(run => run.id === 'legacy-best-sudoku-hard')).toMatchObject({
      dayKey: '2026-10-02', solveMs: 90000, legacyRaw: { secs: 90, date: '2026-10-02' },
    });
    expect(rows.puzzleRuns.find(run => run.id === 'legacy-best-crowns-medium')).toMatchObject({ score: 7, legacyRaw: { score: 7 } });
    expect(rows.settings.find(row => row.key === 'legacy.learn.last')?.value).toEqual({ gita: '2026-10-03' });
    const db = freshDb();
    const counts = await importLegacy(db, newer, options);
    expect(counts.skipped).toEqual(['progress.zzz']);
    expect(counts.puzzleRuns).toBe(5);
    const firstRuns = await db.puzzleRuns.toArray();
    const firstSettings = await db.settings.toArray();
    expect(await importLegacy(db, newer, options)).toEqual(counts);
    expect(await db.puzzleRuns.toArray()).toEqual(firstRuns);
    expect(await db.settings.toArray()).toEqual(firstSettings);
  });
});
