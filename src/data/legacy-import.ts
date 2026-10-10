import * as v from 'valibot';
import { trackWrite } from '../core/pendingWrites';
import type { NandiDb } from './db';
import type { CardRow, DeckProgRow, FlagRow, LessonProgRow, PlanRow, PuzzleRunRow, RatingRow, RowMeta, SettingRow } from './types';

const day = v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a YYYY-MM-DD dayKey'));
const nonempty = v.pipe(v.string(), v.minLength(1));
const timestamp = v.pipe(nonempty, v.check(value => !Number.isNaN(Date.parse(value)), 'Expected a date or timestamp'));
const count = v.pipe(v.number(), v.integer(), v.minValue(0));
const cardSchema = v.object({
  id: nonempty, law: v.optional(v.number()), track: v.optional(nonempty),
  due: day, box: v.optional(count), reviews: v.optional(count), last: v.optional(day),
});
const itemSchema = v.object({ b: v.optional(count), n: v.optional(count), c: v.optional(count), due: v.optional(day), last: v.optional(day) });
const caseSchema = v.object({
  diff: v.optional(nonempty), result: v.optional(v.picklist(['solved', 'revealed'])),
  secs: v.optional(v.pipe(v.number(), v.minValue(0))), hints: v.optional(count), tries: v.optional(count),
  at: v.optional(timestamp), started: v.optional(timestamp),
});
const planSchema = v.object({
  lesson: nonempty, i: nonempty, t: nonempty, made: day,
  fired: v.optional(v.nullable(v.picklist(['yes', 'partly', 'no', 'na']))),
});
const puzzleSchema = v.object({
  type: v.picklist(['sudoku', 'crowns', 'sunmoon', 'path', 'calc']),
  diff: v.optional(nonempty), result: v.optional(v.picklist(['solved', 'revealed'])),
  secs: v.optional(v.pipe(v.number(), v.minValue(0))), hints: v.optional(count),
});
export const legacyExportSchema = v.object({
  exportedAt: v.optional(timestamp),
  cards: v.array(cardSchema),
  progress: v.looseObject({
    migratedFrom: v.optional(v.unknown()),
    ratings: v.optional(v.record(v.string(), v.number())),
    nAns: v.optional(v.record(v.string(), count)),
    items: v.optional(v.record(v.string(), itemSchema)),
    cases: v.optional(v.record(v.string(), caseSchema)),
    hidden: v.optional(v.record(v.string(), v.boolean())),
    flags: v.optional(v.array(v.object({ id: nonempty, t: v.optional(nonempty), at: v.optional(timestamp) }))),
    learn: v.optional(v.object({
      done: v.optional(v.record(v.string(), v.object({
        at: day, g: v.optional(v.boolean()), c: v.optional(count),
        t: v.optional(v.boolean()), w: v.optional(v.boolean()),
      }))),
      last: v.optional(v.record(v.string(), day)),
      plans: v.optional(v.array(planSchema)),
    })),
    pzd: v.optional(v.record(v.string(), puzzleSchema)),
    pzs: v.optional(v.record(v.string(), v.unknown())),
  }),
});
export type LegacyExport = v.InferOutput<typeof legacyExportSchema>;

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Shape detection only; validateLegacy gives useful errors for malformed candidates. */
export function isLegacyExport(json: unknown): boolean {
  return object(json) && 'cards' in json && 'progress' in json;
}

export type LegacyValidation =
  | { success: true; data: LegacyExport; errors: [] }
  | { success: false; data: null; errors: string[] };

export function validateLegacy(json: unknown): LegacyValidation {
  let input = json;
  if (typeof json === 'string') {
    try { input = JSON.parse(json) as unknown; }
    catch { return { success: false, data: null, errors: ['Invalid JSON'] }; }
  }
  const parsed = v.safeParse(legacyExportSchema, input);
  if (!parsed.success) return {
    success: false, data: null,
    errors: parsed.issues.map(issue => `${v.getDotPath(issue) ?? 'legacy'}: ${issue.message}`),
  };
  const errors: string[] = [];
  const seenCards = new Set<string>();
  for (const [i, card] of parsed.output.cards.entries()) {
    if (card.law === undefined && card.track === undefined) errors.push(`cards.${i}: expected law or track`);
    if (seenCards.has(card.id)) errors.push(`cards.${i}.id: duplicate card ${card.id}`);
    seenCards.add(card.id);
  }
  for (const key of Object.keys(parsed.output.progress.cases ?? {})) {
    if (!/^daily:\d{4}-\d{2}-\d{2}$/.test(key) && !/^x:\d+:[^:]+$/.test(key)) {
      errors.push(`progress.cases.${key}: expected daily:<dayKey> or x:<seed>:<diff>`);
    }
  }
  for (const key of Object.keys(parsed.output.progress.pzd ?? {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) errors.push(`progress.pzd.${key}: expected a dayKey`);
  }
  return errors.length
    ? { success: false, data: null, errors }
    : { success: true, data: parsed.output, errors: [] };
}

export interface LegacyOptions { deviceId: string; now: number | Date }
export interface LegacyRows {
  cards: CardRow[];
  ratings: RatingRow[];
  deckProg: DeckProgRow[];
  puzzleRuns: PuzzleRunRow[];
  flags: FlagRow[];
  lessonProg: LessonProgRow[];
  plans: PlanRow[];
  settings: SettingRow[];
}
export type LegacyMapped = LegacyRows & { skipped: string[] };
export type LegacyCounts = { [K in keyof LegacyRows]: number } & { skipped: string[] };

const puzzleTypes = new Set<PuzzleRunRow['type']>(['sudoku', 'crowns', 'sunmoon', 'path', 'calc']);
const auxiliaryProgressKeys = new Set([
  'v', 'casesDone', 'days', 'decks', 'freezes', 'frozen', 'freezeCheck',
  'lastEarn', 'freezeNote', 'rhist', 'errors', 'updatedAt',
]);
const mappedProgressKeys = new Set([
  'migratedFrom', 'ratings', 'nAns', 'items', 'cases', 'hidden', 'flags', 'learn', 'pzd', 'pzs',
  ...auxiliaryProgressKeys,
]);

function storedDay(value: Record<string, unknown>): string | undefined {
  for (const field of ['dayKey', 'date', 'at']) {
    const date = value[field];
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(date)) return date.slice(0, 10);
  }
  return undefined;
}

function metadata(options: LegacyOptions): RowMeta {
  const now = options.now instanceof Date ? options.now.getTime() : options.now;
  if (!Number.isSafeInteger(now) || now < 0) throw new RangeError('Invalid legacy import time');
  if (!options.deviceId) throw new Error('Missing deviceId');
  return { updatedAt: now, deleted: 0, deviceId: options.deviceId };
}

function hash(str: string): number {
  let value = 2166136261;
  for (let i = 0; i < str.length; i++) {
    value ^= str.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/** Validates then maps without changing its input or consulting the clock. */
export function mapLegacy(json: unknown, options: LegacyOptions): LegacyMapped {
  const checked = validateLegacy(json);
  if (!checked.success) throw new Error(`Invalid legacy export: ${checked.errors.join('; ')}`);
  const legacy = checked.data;
  const meta = metadata(options);
  const rows: LegacyMapped = { cards: [], ratings: [], deckProg: [], puzzleRuns: [], flags: [], lessonProg: [], plans: [], settings: [],
    skipped: Object.keys(legacy.progress).filter(key => !mappedProgressKeys.has(key)).map(key => `progress.${key}`),
  };
  const setting = (key: string, value: unknown) => rows.settings.push({ ...meta, key, value });
  if ('migratedFrom' in legacy.progress) setting('legacy.migratedFrom', legacy.progress.migratedFrom);
  for (const key of auxiliaryProgressKeys) {
    if (key in legacy.progress) setting(`legacy.progress.${key}`, legacy.progress[key]);
  }
  // Keep legacy-only state and unfinished daily puzzles alongside the derived run rows.
  if ('pzs' in legacy.progress) setting('legacy.progress.pzs', legacy.progress.pzs);
  if ('pzd' in legacy.progress) setting('legacy.progress.pzd', legacy.progress.pzd);
  for (const card of legacy.cards) {
    rows.cards.push({ ...meta, id: card.id, deckId: card.track ?? 'greene',
      ...(card.law === undefined ? {} : { topic: String(card.law) }),
      ...(card.track ? {} : { packId: 'deck.greene' }), itemId: card.id, due: card.due,
      ...(card.box === undefined ? {} : { box: card.box }),
      ...(card.reviews === undefined ? {} : { reviews: card.reviews }),
      ...(card.last === undefined ? {} : { last: card.last }),
    });
  }
  for (const id of new Set([...Object.keys(legacy.progress.ratings ?? {}), ...Object.keys(legacy.progress.nAns ?? {})])) {
    rows.ratings.push({ ...meta, id, value: legacy.progress.ratings?.[id], n: legacy.progress.nAns?.[id] ?? 0 });
  }
  for (const [id, state] of Object.entries(legacy.progress.items ?? {})) {
    rows.deckProg.push({ ...meta, id, due: state.due ?? legacy.exportedAt ?? new Date(meta.updatedAt).toISOString().slice(0, 10),
      ...(state.b === undefined ? {} : { b: state.b }),
      ...(state.n === undefined ? {} : { n: state.n }),
      ...(state.c === undefined ? {} : { c: state.c }),
      ...(state.last === undefined ? {} : { last: state.last }),
    });
  }
  for (const [key, state] of Object.entries(legacy.progress.cases ?? {})) {
    const daily = key.startsWith('daily:');
    const parts = key.split(':');
    const dayKey = daily ? key.slice(6) : (state.at ?? state.started ?? legacy.exportedAt ?? new Date(meta.updatedAt).toISOString()).slice(0, 10);
    rows.puzzleRuns.push({ ...meta, id: `legacy-case-${key.replaceAll(':', '-')}`, type: 'mystery', dayKey,
      seed: daily ? String(hash(key)) : (parts[1] ?? ''), daily, diff: state.diff ?? (daily ? undefined : parts[2]),
      result: state.result, source: 'legacy',
      ...(state.secs === undefined ? {} : { solveMs: Math.round(state.secs * 1000) }),
      ...(state.hints === undefined ? {} : { hintsUsed: state.hints }),
      ...(state.tries === undefined ? {} : { tries: state.tries }),
    });
  }
  const flagged = new Map<string, { t?: string; at?: string }>();
  for (const flag of legacy.progress.flags ?? []) flagged.set(flag.id, flag);
  const refIds = new Set([...Object.entries(legacy.progress.hidden ?? {}).filter(([, hidden]) => hidden).map(([id]) => id), ...flagged.keys()]);
  for (const refId of refIds) {
    const flag = flagged.get(refId);
    rows.flags.push({ ...meta, id: `legacy-flag-${refId}`, refId, kind: flag?.t ?? 'hidden', hidden: true,
      ...(flag?.at === undefined ? {} : { at: Date.parse(flag.at) }),
    });
  }
  for (const [id, done] of Object.entries(legacy.progress.learn?.done ?? {})) {
    const packId = /^g\d+$/.test(id) ? 'lessons.gita-restless-mind'
      : /^c\d+$/.test(id) ? 'lessons.charaka-holds-up' : 'legacy';
    rows.lessonProg.push({ ...meta, id, packId,
      doneDayKey: done.at, guessOk: done.g, conf: done.c, transferOk: done.t, whyOk: done.w });
  }
  // learn.last is keyed by course, while lessonProg is keyed by lesson.
  if (legacy.progress.learn?.last !== undefined) setting('legacy.learn.last', legacy.progress.learn.last);
  for (const [index, plan] of (legacy.progress.learn?.plans ?? []).entries()) {
    rows.plans.push({ ...meta, id: `legacy-plan-${index}`, lessonId: plan.lesson, madeDayKey: plan.made,
      ifText: plan.i, thenText: plan.t, fired: plan.fired ?? null });
  }
  for (const [dayKey, puzzle] of Object.entries(legacy.progress.pzd ?? {})) {
    if (!puzzle.result) continue;
    rows.puzzleRuns.push({ ...meta, id: `legacy-puzzle-daily-${dayKey}`, type: puzzle.type, dayKey,
      seed: String(hash(`daily:${dayKey}:${puzzle.type}:${puzzle.diff ?? ''}`)),
      diff: puzzle.diff, daily: true, result: puzzle.result, source: 'legacy',
      ...(puzzle.secs === undefined ? {} : { solveMs: Math.round(puzzle.secs * 1000) }),
      ...(puzzle.hints === undefined ? {} : { hintsUsed: puzzle.hints }),
    });
  }
  for (const [type, state] of Object.entries(legacy.progress.pzs ?? {})) {
    if (!puzzleTypes.has(type as PuzzleRunRow['type']) || !object(state) || !object(state.best)) continue;
    for (const [level, best] of Object.entries(state.best)) {
      const details = object(best) ? best : undefined;
      const secs = typeof best === 'number' ? best : details?.secs;
      const validSecs = typeof secs === 'number' && Number.isFinite(secs) && secs > 0;
      const score = details?.score;
      const dayKey = details && storedDay(details);
      rows.puzzleRuns.push({ ...meta, id: `legacy-best-${type}-${level}`, type: type as PuzzleRunRow['type'], diff: level,
        result: 'solved', source: 'legacy', legacyBest: true,
        ...(validSecs ? { solveMs: Math.round(secs * 1000) } : {}),
        ...(validSecs ? { hintsUsed: 0 } : {}),
        ...(typeof score === 'number' && Number.isFinite(score) ? { score } : {}),
        ...(dayKey ? { dayKey } : {}),
        ...(validSecs && !details ? {} : { legacyRaw: best }),
      });
    }
  }
  return rows;
}

/** Bulk writes all mapped tables atomically. */
export async function importLegacy(db: NandiDb, json: unknown, options: LegacyOptions): Promise<LegacyCounts> {
  const rows = mapLegacy(json, options);
  await trackWrite(() => db.transaction('rw', [db.cards, db.ratings, db.deckProg, db.puzzleRuns, db.flags, db.lessonProg, db.plans, db.settings], async () => {
    await db.cards.bulkPut(rows.cards);
    await db.ratings.bulkPut(rows.ratings);
    await db.deckProg.bulkPut(rows.deckProg);
    await db.puzzleRuns.bulkPut(rows.puzzleRuns);
    await db.flags.bulkPut(rows.flags);
    await db.lessonProg.bulkPut(rows.lessonProg);
    await db.plans.bulkPut(rows.plans);
    await db.settings.bulkPut(rows.settings);
  }));
  return { cards: rows.cards.length, ratings: rows.ratings.length, deckProg: rows.deckProg.length,
    puzzleRuns: rows.puzzleRuns.length, flags: rows.flags.length, lessonProg: rows.lessonProg.length,
    plans: rows.plans.length, settings: rows.settings.length, skipped: rows.skipped };
}
