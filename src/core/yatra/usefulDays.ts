import type { LedgerRow } from '../../data/types';
import type { EconomyDay } from '../economy/deriveEconomy';
import { weekStart } from '../economy/deriveEconomy';
import { sessionCounts } from '../train/counts';

/**
 * Spec 45b, review decision 7 (Jenil approved the consistency proposal, 31 Oct): Home's top line is one honest
 * progress line, "N useful days this season" ("this week" before Season 1 is active). A useful day is a date that
 * met today's streak-day rule (the economy's `mark`: a planned task done, a workout or rest, a mind slot, or a soft
 * day's gentle thing), at most one per date. It only counts up: no bar, no time, no "missed" line.
 */
export function usefulDays(days: readonly Pick<EconomyDay, 'dayKey' | 'mark'>[], season: { active: boolean; start: string }, today: string): { count: number; span: 'season' | 'week'; from: string } {
  const span = season.active ? 'season' : 'week';
  const from = season.active ? season.start : weekStart(today);
  const dates = new Set(days.filter(day => day.mark && day.dayKey >= from && day.dayKey <= today).map(day => day.dayKey));
  return { count: dates.size, span, from };
}

export type RecordDay = { dayKey: string; items: string[] };

/**
 * The record behind the count: each useful day, newest first, with what was finished on it, read from the ledger.
 * `titles` names done tasks by id; a task with no title left is "A planned task".
 */
export function usefulRecord(days: readonly Pick<EconomyDay, 'dayKey' | 'mark'>[], facts: readonly LedgerRow[], from: string, today: string, titles: ReadonlyMap<string, string> = new Map()): RecordDay[] {
  const useful = [...new Set(days.filter(day => day.mark && day.dayKey >= from && day.dayKey <= today).map(day => day.dayKey))].sort().reverse();
  return useful.map(key => {
    const rows = facts.filter(row => !row.deleted && row.dayKey === key);
    const count = (test: (row: LedgerRow) => boolean) => rows.filter(test).length;
    const items: string[] = [];
    for (const row of rows.filter(row => row.mode === 'tasks' && row.kind === 'done')) items.push(titles.get(row.refId) ?? 'A planned task');
    const sessions = count(row => row.mode === 'train' && row.kind === 'session' && sessionCounts(row.inputs ?? {}));
    if (sessions) items.push(sessions === 1 ? 'A workout' : `${sessions} workouts`);
    if (count(row => row.mode === 'train' && row.kind === 'rest')) items.push('A rest-day walk');
    const ideas = count(row => row.mode === 'read' && row.kind === 'idea');
    if (ideas) items.push(ideas === 1 ? 'An idea read' : `${ideas} ideas read`);
    if (count(row => row.mode === 'read' && row.kind === 'chapter-check')) items.push('A Book check');
    const boards = count(row => row.mode === 'mind' && row.kind === 'board');
    if (boards) items.push(boards === 1 ? 'A puzzle board' : `${boards} puzzle boards`);
    if (count(row => row.mode === 'mind' && row.kind === 'mystery' && row.inputs.result === 'solved')) items.push('A case solved');
    if (count(row => row.kind === 'learn-drop')) items.push('The day\'s drop');
    const calm = rows.filter(row => row.mode === 'calm' && row.kind === 'session').reduce((sum, row) => sum + (Number(row.inputs.minutes) > 0 ? Math.floor(Number(row.inputs.minutes)) : 0), 0);
    if (calm) items.push(`Calm, ${calm} min`);
    if (count(row => row.mode === 'soft' && row.kind === 'soft')) items.push('A gentle thing on a soft day');
    return { dayKey: key, items: items.length ? items : ['The day counted'] };
  });
}
