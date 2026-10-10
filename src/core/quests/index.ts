import { dayKey } from '../time/dayKey';

export type QuestKind = 'once' | 'total';
export type QuestStatus = 'active' | 'done' | 'archived' | 'swapped';
export interface Quest {
  id: string;
  sourceId: string;
  week: string;
  title: string;
  kind: QuestKind;
  target: number;
  unit: string;
  step: number;
  progress: number;
  tapIds: string[];
  status: QuestStatus;
  custom: boolean;
}

/** ISO week of the local 04:00 planning day. */
export function weekKey(at: Date | number): string {
  const key = dayKey(at);
  const date = new Date(`${key}T12:00:00Z`);
  const weekday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() + 3 - weekday);
  const year = date.getUTCFullYear();
  const first = new Date(Date.UTC(year, 0, 4));
  const week = 1 + Math.round((date.getTime() - first.getTime()) / 604_800_000);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function hash(value: string): number {
  let result = 2166136261;
  for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
  return result >>> 0;
}

export function selectWeekly<T extends { sourceId: string }>(pack: T[], week: string, previous: string[] = [], count = 3): T[] {
  const prior = new Set(previous);
  const candidates = pack.filter(q => !prior.has(q.sourceId));
  const pool = candidates.length >= count ? candidates : pack;
  return [...pool].sort((a, b) => hash(`${week}:${a.sourceId}`) - hash(`${week}:${b.sourceId}`) || a.sourceId.localeCompare(b.sourceId)).slice(0, count);
}

export function applyTap<T extends Quest>(quest: T, tapId: string, delta: number): T {
  if (quest.status !== 'active' || quest.tapIds.includes(tapId) || !Number.isFinite(delta) || delta === 0) return quest;
  const progress = Math.min(quest.target, Math.max(0, quest.progress + delta));
  return { ...quest, progress, tapIds: [...quest.tapIds, tapId], status: progress >= quest.target ? 'done' : 'active' };
}

export function complete<T extends Quest>(quest: T): T {
  if (quest.status !== 'active') return quest;
  return { ...quest, progress: quest.target, status: 'done' };
}

export function archivePast<T extends Quest>(quests: T[], currentWeek: string): T[] {
  return quests.map(q => q.week < currentWeek && q.status === 'active' ? { ...q, status: 'archived' } : q);
}

export function completionFactId(quest: Quest): string { return `quest:${quest.id}:${quest.week}`; }
