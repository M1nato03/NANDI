import { RULES } from '../rules.config';
import { sessionCounts } from '../train/counts';
import type { LedgerRow } from '../../data/types';
import { isPlannedDone } from './planned';
import { weekStart } from './deriveEconomy';

export type Quest = { id: string; title: string; target: number; count: (facts: readonly LedgerRow[], day: string) => number };
// Mind done after bedtime earns no XP, so it fills no quest either, nor does a drop finished after bedtime (economy review 32, C10).
const matching = (facts: readonly LedgerRow[], day: string, mode: string, kind: string) => facts.filter(f => !f.deleted && f.dayKey === day && f.mode === mode && f.kind === kind && !((mode === 'mind' || mode === 'gamify') && f.inputs.afterBedtime === true));
const count = (mode: string, kind: string): Quest['count'] => (facts, day) => matching(facts, day, mode, kind).length;
export function longestCombo(facts: readonly LedgerRow[], dropId: string): number {
  let run = 0, best = 0;
  for (const fact of facts.filter(f => !f.deleted && f.kind === 'learn-answer' && f.inputs.dropId === dropId).sort((a, b) => Number(a.refId.split(':').at(-1)) - Number(b.refId.split(':').at(-1)))) {
    run = fact.inputs.correct === true ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}
/** Right answers in a row across all of today's Learn answers; a teach-first drop alone can be shorter than five. */
function dayCombo(facts: readonly LedgerRow[], day: string): number {
  let run = 0, best = 0;
  for (const fact of matching(facts, day, 'mind', 'learn-answer').sort((a, b) => a.updatedAt - b.updatedAt || a.id.localeCompare(b.id))) {
    run = fact.inputs.correct === true ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}
export function perfectDrop(facts: readonly LedgerRow[], dropId: string, length: number): boolean {
  const rows = facts.filter(f => !f.deleted && f.kind === 'learn-answer' && f.inputs.dropId === dropId);
  return length > 0 && rows.length === length && rows.every(f => f.inputs.correct === true);
}
export const questPool: Quest[] = [
  // A teach-first drop can be the lesson and a few questions, so "finished" is the drop itself, not five answers.
  { id: 'drop', title: "Finish today's Learn drop", target: 1, count: (f, d) => matching(f, d, 'gamify', 'learn-drop').length },
  { id: 'combo', title: 'Get 5 right in a row', target: 5, count: dayCombo },
  { id: 'learn-three', title: 'Explore 3 Learn questions', target: 3, count: (f, d) => matching(f, d, 'mind', 'learn-answer').length },
  { id: 'learn-perfect', title: 'Finish a drop with every answer right', target: 1, count: (f, d) => matching(f, d, 'gamify', 'perfect-drop').length },
  { id: 'task', title: 'Finish a planned task', target: 1, count: (f, d) => matching(f, d, 'tasks', 'done').filter(isPlannedDone).length },
  { id: 'tasks-two', title: 'Finish 2 tasks', target: 2, count: count('tasks', 'done') },
  { id: 'plan', title: 'Plan tomorrow before shutdown', target: 1, count: count('gamify', 'tomorrow-plan') },
  { id: 'session', title: 'Log a workout', target: 1, count: count('train', 'session') },
  { id: 'rest', title: 'Keep a rest day', target: 1, count: count('train', 'rest') },
  { id: 'body', title: 'Make time to move', target: 1, count: (f, d) => count('train', 'session')(f, d) + count('train', 'rest')(f, d) },
  { id: 'board', title: 'Solve the daily board', target: 1, count: (f, d) => matching(f, d, 'mind', 'board').filter(x => x.inputs.daily !== false && x.inputs.result !== 'revealed').length },
  { id: 'board-clean', title: 'Solve the daily board without a hint', target: 1, count: (f, d) => matching(f, d, 'mind', 'board').filter(x => x.inputs.daily !== false && Number(x.inputs.hintsUsed ?? 0) === 0 && x.inputs.result !== 'revealed').length },
  { id: 'case', title: 'Settle a case', target: 1, count: (f, d) => matching(f, d, 'mind', 'mystery').filter(x => x.inputs.result !== 'revealed').length },
  { id: 'night', title: 'Close the day on plan', target: 1, count: (f, d) => matching(f, d, 'bonuses', 'lightsout').filter(x => x.inputs.metTarget === true).length },
  { id: 'gold', title: 'Finish a Gold review', target: 1, count: count('gamify', 'gold-review') },
];
export function dailyQuests(day: string): Quest[] {
  let seed = [...day].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) | 0, 17) >>> 0;
  const shuffled = [...questPool];
  for (let i = shuffled.length - 1; i > 0; i--) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const j = seed % (i + 1); [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]; }
  return shuffled.slice(0, 3);
}
export const questProgress = (quest: Quest, facts: readonly LedgerRow[], day: string) => Math.min(quest.target, quest.count(facts, day));
export function completedQuests(facts: readonly LedgerRow[], day: string): Quest[] { return dailyQuests(day).filter(q => questProgress(q, facts, day) >= q.target); }
/**
 * The running boost: it opens only with its own fact, which reconcile writes in the day window and which says when
 * it ends (never past shutdown). An older fact without an end keeps the full window (item 51).
 */
export function focusBoost(facts: readonly LedgerRow[], day: string, now: number): { endsAt: number; remainingMs: number } | null {
  const boost = facts.find(f => !f.deleted && f.kind === 'focus-boost' && f.refId === day);
  if (!boost) return null;
  const until = typeof boost.inputs.until === 'number' ? boost.inputs.until : Infinity;
  const endsAt = Math.min(boost.updatedAt + RULES.gamify.focusMinutes * 60_000, until);
  return now < endsAt ? { endsAt, remainingMs: Math.max(0, endsAt - now) } : null;
}

export type Badge = { id: string; title: string; count: (facts: readonly LedgerRow[]) => number };
const all = (facts: readonly LedgerRow[], mode: string, kind: string) => facts.filter(f => !f.deleted && f.mode === mode && f.kind === kind);
const badgeCount = (mode: string, kind: string): Badge['count'] => f => all(f, mode, kind).length;
export const badges: Badge[] = [
  { id: 'tasks', title: 'Tasks settled', count: badgeCount('tasks', 'done') },
  { id: 'planned', title: 'Plans kept', count: f => all(f, 'tasks', 'done').filter(isPlannedDone).length },
  { id: 'early', title: 'First-day finishes', count: f => all(f, 'tasks', 'done').filter(x => x.inputs.isFirstDay === true).length },
  // A session with no set logged is not a workout (bug hunt 30 Oct, jenil-87).
  { id: 'workouts', title: 'Workouts logged', count: f => all(f, 'train', 'session').filter(x => sessionCounts(x.inputs)).length },
  { id: 'rest', title: 'Rest days kept', count: badgeCount('train', 'rest') },
  { id: 'prs', title: 'Personal bests', count: badgeCount('train', 'pr') },
  { id: 'drops', title: 'Drops finished', count: badgeCount('gamify', 'learn-drop') },
  // Only right answers count, so a first wrong answer never earns a badge (audit 10-21).
  { id: 'answers', title: 'Questions answered right', count: f => all(f, 'mind', 'learn-answer').filter(x => x.inputs.correct === true).length },
  { id: 'perfect', title: 'Perfect drops', count: badgeCount('gamify', 'perfect-drop') },
  { id: 'gold', title: 'Gold reviews', count: badgeCount('gamify', 'gold-review') },
  { id: 'boards', title: 'Boards solved', count: badgeCount('mind', 'board') },
  { id: 'clean-boards', title: 'Boards without hints', count: f => all(f, 'mind', 'board').filter(x => Number(x.inputs.hintsUsed ?? 0) === 0).length },
  { id: 'cases', title: 'Cases settled', count: badgeCount('mind', 'mystery') },
  { id: 'nights', title: 'Nights on plan', count: f => all(f, 'bonuses', 'lightsout').filter(x => x.inputs.metTarget === true).length },
  { id: 'quests', title: 'Daily quests', count: badgeCount('gamify', 'daily-quest') },
  { id: 'chests', title: 'Unit chests', count: badgeCount('gamify', 'unit-chest') },
  { id: 'focus', title: 'Focus boosts', count: badgeCount('gamify', 'focus-boost') },
  { id: 'reviews', title: 'Ideas revisited', count: badgeCount('mind', 'learn-retention') },
  { id: 'lessons', title: 'Lessons finished', count: badgeCount('mind', 'lesson') },
  // A 3-session week writes a one-short milestone and then a met one; count each week whose target was met, once (audit 16.17).
  { id: 'weeks', title: 'Weekly training targets', count: f => new Set(all(f, 'train', 'weekly').filter(x => x.inputs.target == null || Number(x.inputs.milestone) >= Number(x.inputs.target)).map(x => weekStart(x.dayKey))).size },
];
export const badgeTier = (badge: Badge, facts: readonly LedgerRow[]) => { const count = badge.count(facts); return RULES.gamify.badgeThresholds.filter(n => count >= n).length; };
export function monthlyQuestCount(facts: readonly LedgerRow[], month: string): number { return facts.filter(f => !f.deleted && f.kind === 'daily-quest' && f.dayKey.startsWith(month)).length; }
export function chestReady(conceptIds: readonly string[], mastered: ReadonlySet<string>): boolean { return conceptIds.length > 0 && conceptIds.every(id => mastered.has(id)); }
export function goldReviewPassed(correct: number, total: number): boolean { return total === RULES.gamify.goldReviewItems && correct >= RULES.gamify.goldReviewPass; }
