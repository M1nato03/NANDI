import { addEconomyDays } from '../economy/deriveEconomy';
import { retentionSummary, type AnswerFact } from '../learn/engine/analytics';
import type { LedgerRow, SettingRow } from '../../data/types';

export const OWNER_OPENS_KEY = 'owner.opens';
export const OWNER_PIN_KEY = 'owner.pinHash';
/** A return after this long in the background counts as a new open. */
export const OPEN_GAP_MS = 60_000;
export const OPENS_KEPT_DAYS = 60;

export type OpensByDay = Record<string, number>;

export function readOpens(settings: readonly SettingRow[]): OpensByDay {
  const value = settings.find(row => row.key === OWNER_OPENS_KEY && !row.deleted)?.value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter((entry): entry is [string, number] => /^\d{4}-\d{2}-\d{2}$/.test(entry[0]) && typeof entry[1] === 'number' && entry[1] >= 0));
}

/** Adds one open for the day and drops days older than the keep window. */
export function addOpen(opens: OpensByDay, day: string): OpensByDay {
  const oldest = addEconomyDays(day, -(OPENS_KEPT_DAYS - 1));
  const next: OpensByDay = {};
  for (const [key, count] of Object.entries(opens)) if (key >= oldest && key <= day) next[key] = count;
  next[day] = (next[day] ?? 0) + 1;
  return next;
}

export interface DayPoint { day: string; opens: number; facts: number }
export interface OwnerMetrics {
  days: DayPoint[];
  opensToday: number; opensAvg7: number;
  activeDays7: number; activeDays30: number;
  tasksDone7: number; workouts7: number; boards7: number; cases7: number;
  answers7: number; accuracy7: number | null;
  retention: { checked7: number; recalled7: number; checked30: number; recalled30: number };
  pauseOpenings: number; pauseWentAnyway: number;
  errors: number;
}

const live = (rows: readonly LedgerRow[]) => rows.filter(row => !row.deleted);

export function ownerMetrics(input: { ledger: readonly LedgerRow[]; settings: readonly SettingRow[]; today: string; now: number }): OwnerMetrics {
  const facts = live(input.ledger);
  const opens = readOpens(input.settings);
  const days: DayPoint[] = Array.from({ length: 30 }, (_, index) => {
    const day = addEconomyDays(input.today, index - 29);
    return { day, opens: opens[day] ?? 0, facts: facts.filter(row => row.dayKey === day).length };
  });
  const last = (count: number) => days.slice(-count);
  const week = new Set(last(7).map(point => point.day));
  const inWeek = facts.filter(row => week.has(row.dayKey));
  const answers = inWeek.filter(row => row.kind === 'learn-answer');
  const answerFacts: AnswerFact[] = facts.filter(row => row.kind === 'learn-answer' || row.kind === 'learn-retention').map(row => ({
    conceptId: String(row.inputs.conceptId ?? ''), answeredAt: row.updatedAt, correct: row.inputs.correct === true,
    confidence: row.inputs.confidence === 'certain' || row.inputs.confidence === 'guess' ? row.inputs.confidence : 'fairly-sure',
    kind: row.kind === 'learn-retention' ? 'retention' : 'practice',
    retentionDay: row.inputs.retentionDay === 7 || row.inputs.retentionDay === 30 ? row.inputs.retentionDay : undefined,
  }));
  const counter = (key: string) => Number(input.settings.find(row => row.key === key && !row.deleted)?.value ?? 0) || 0;
  const errorRing = input.settings.find(row => row.key === 'errorRing' && !row.deleted)?.value;
  const active = (point: DayPoint) => point.opens > 0 || point.facts > 0;
  return {
    days,
    opensToday: days[days.length - 1]!.opens,
    opensAvg7: Math.round(last(7).reduce((sum, point) => sum + point.opens, 0) / 7 * 10) / 10,
    activeDays7: last(7).filter(active).length,
    activeDays30: days.filter(active).length,
    tasksDone7: inWeek.filter(row => row.mode === 'tasks' && (row.kind === 'done' || row.kind === 'task-done')).length,
    workouts7: inWeek.filter(row => row.mode === 'train' && row.kind === 'session').length,
    boards7: inWeek.filter(row => row.mode === 'mind' && row.kind === 'board').length,
    cases7: inWeek.filter(row => row.mode === 'mind' && row.kind === 'mystery').length,
    answers7: answers.length,
    accuracy7: answers.length ? Math.round(answers.filter(row => row.inputs.correct === true).length / answers.length * 100) : null,
    retention: retentionSummary({ facts: answerFacts }, input.now),
    pauseOpenings: counter('night.pause.openings'),
    pauseWentAnyway: counter('night.pause.dismissals'),
    errors: Array.isArray(errorRing) ? errorRing.length : 0,
  };
}

/** SHA-256 of the PIN with a fixed app salt, as hex. The PIN never leaves the phone. */
export async function hashPin(pin: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`nandi-owner:${pin}`));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

export const validPin = (pin: string) => /^\d{4,6}$/.test(pin);
