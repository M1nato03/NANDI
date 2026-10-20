import type { DailyLogRow, SettingRow } from '../data/types';
import { shutdownAt } from './tasks/planner';

export type NightPlan = { cue: string; action: string };
export const NIGHT_PLAN_KEY = 'night.plan';
export const CUES = ['get into bed with my phone', 'reach for one more scroll'];
/** Earlier cue wording, saved before the sentence read "If I <cue>". */
const OLD_CUES: Record<string, string> = { 'getting into bed with my phone': 'get into bed with my phone', 'reaching for one more scroll': 'reach for one more scroll' };
export const ACTIONS = ['open my night deck', 'read 5 pages', 'put the phone on the charger outside the bed'];

export function readNightPlan(settings: SettingRow[]): NightPlan | null {
  const value = settings.find(row => row.key === NIGHT_PLAN_KEY && !row.deleted)?.value;
  if (!value || typeof value !== 'object' || !('cue' in value) || !('action' in value)) return null;
  const { cue, action } = value;
  return typeof cue === 'string' && cue.trim() && typeof action === 'string' && action.trim()
    ? { cue: OLD_CUES[cue.trim()] ?? cue.trim(), action: action.trim() } : null;
}

export function nightPlanText(plan: NightPlan): string {
  return `If I ${plan.cue}, then I ${plan.action}.`;
}

export function planLeadsNow(now: number, bedtime: string): boolean {
  return now >= shutdownAt(now, bedtime) - 30 * 60_000;
}

export function nightsBackOnPlan(logs: DailyLogRow[]): number {
  return logs.filter(row => !row.deleted && row.lightsOutAt != null && row.bedtimeTarget != null && row.lightsOutAt <= row.bedtimeTarget).length;
}
