import { RULES } from '../rules.config';
import { weekKey } from '../quests';

export type TrackDayKind = 'new' | 'review' | 'apply' | 'off' | 'parked' | 'done';
export type CompletedUnit = { id: string; day: string };
export type TrackDay = { kind: TrackDayKind; unitId: string | null; reason?: 'backlog' | 'weekly-limit' | 'budget' };

/** Monday to Thursday introduce one unit; Friday reviews, Saturday applies, Sunday rests. */
export function rhythmForDay(day: string): 'new' | 'review' | 'apply' | 'off' {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  return weekday === 0 ? 'off' : weekday === 5 ? 'review' : weekday === 6 ? 'apply' : 'new';
}

export function chooseTrackDay(input: { day: string; active: boolean; unitIds: string[]; completed: CompletedUnit[]; dueReviews: number; spentMinutes?: number }): TrackDay {
  if (!input.active) return { kind: 'parked', unitId: null };
  if (input.completed.some(row => row.day === input.day)) return { kind: 'done', unitId: null };
  const rhythm = rhythmForDay(input.day);
  if (rhythm !== 'new') return { kind: rhythm, unitId: null };
  if (input.dueReviews > RULES.learningTracks.backlogBrakeDue) return { kind: 'review', unitId: null, reason: 'backlog' };
  if ((input.spentMinutes ?? 0) >= RULES.learningTracks.dailyBudgetMin) return { kind: 'done', unitId: null, reason: 'budget' };
  const thisWeek = input.completed.filter(row => weekKey(new Date(`${row.day}T12:00:00`)) === weekKey(new Date(`${input.day}T12:00:00`))).length;
  if (thisWeek >= RULES.learningTracks.newUnitsPerWeek) return { kind: 'review', unitId: null, reason: 'weekly-limit' };
  const finished = new Set(input.completed.map(row => row.id));
  const unitId = input.unitIds.find(id => !finished.has(id)) ?? null;
  return unitId ? { kind: 'new', unitId } : { kind: 'done', unitId: null };
}

export function budgetBar(input: { unitMinutes: number; checkMinutes: number; dueReviews: number; spentMinutes: number }): { used: number; limit: number; remaining: number; full: boolean } {
  const limit = RULES.learningTracks.dailyBudgetMin;
  const used = Math.min(limit, Math.max(0, input.spentMinutes) + Math.max(0, input.unitMinutes) + Math.max(0, input.checkMinutes) + Math.max(0, input.dueReviews));
  return { used, limit, remaining: limit - used, full: used >= limit };
}

export function soonerWeakCards<T extends { id: string; due: string; box?: number }>(cards: T[], weakIds: Set<string>, day: string): T[] {
  return cards.map(card => weakIds.has(card.id) && card.due > day ? { ...card, due: day } : card);
}
