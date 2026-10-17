import type { SettingRow, TaskRow } from '../data/types';
import { nightPlanText, readNightPlan } from './nightPlan';
import { effectiveShutdown } from './tasks/planner';
import { dayKey } from './time/dayKey';
import { RULES } from './rules.config';

export type WidgetState = {
  dayTitle: string;
  daySubtitle: string;
  nightTitle: string;
  nightSubtitle: string;
  shutdownMinutes: number;
};

function shortTitle(value: string): string {
  const title = value.trim().replace(/\s+/g, ' ');
  return title.length > 40 ? `${title.slice(0, 39).trimEnd()}…` : title;
}

export function buildWidgetText(tasks: TaskRow[], settings: SettingRow[], now: number): WidgetState {
  const today = dayKey(now);
  const parents = new Set(tasks.filter(row => row.parentId && !row.deleted).map(row => row.parentId));
  const visible = tasks.filter(row => !row.deleted && !parents.has(row.id));
  const planned = visible.filter(row => row.status === 'planned' && row.dayKey === today)
    .sort((a, b) => (a.scheduledStart ?? 0) - (b.scheduledStart ?? 0));
  const done = visible.filter(row => row.doneAt != null && dayKey(row.doneAt) === today);
  const next = planned[0]?.title?.trim() || 'Choose your first step';
  const setting = (key: string, fallback: string) => {
    const value = settings.find(row => row.key === key && !row.deleted)?.value;
    return typeof value === 'string' ? value : fallback;
  };
  const shutdown = effectiveShutdown(
    setting('planner.shutdown', RULES.night.defaultShutdown),
    setting('planner.bedtime', RULES.night.defaultBedtime),
  );
  const [hour = 23, minute = 15] = shutdown.split(':').map(Number);
  const plan = readNightPlan(settings);
  return {
    dayTitle: shortTitle(`Now · ${next}`),
    daySubtitle: `${done.length} of ${done.length + planned.length} done today`,
    nightTitle: 'Night deck ready',
    nightSubtitle: plan ? nightPlanText(plan) : 'Six calm cards, then phone down.',
    shutdownMinutes: hour * 60 + minute,
  };
}
