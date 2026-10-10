import { RULES } from '../rules.config';
import { dayKey } from '../time/dayKey';
import { minutesAfterNoon } from '../time/nightTimeline';

const clock = (minutes: number) => `${String((Math.floor(minutes / 60) + 12) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const duration = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

export function effectiveShutdown(shutdown: string, bedtime: string): string {
  return clock(Math.min(minutesAfterNoon(shutdown), minutesAfterNoon(bedtime) - RULES.night.shutdownMinBeforeBedtime));
}

export function shutdownAt(now: number, shutdown: string): number {
  const date = new Date(`${dayKey(now)}T00:00:00`);
  const [hour = 23, minute = 15] = shutdown.split(':').map(Number);
  date.setHours(hour, minute, 0, 0);
  if (hour < 4) date.setDate(date.getDate() + 1);
  return date.getTime();
}

export function dayHorizon(plannedMinutes: number, now: number, shutdown: string): string {
  const left = Math.max(0, Math.floor((shutdownAt(now, shutdown) - now) / 60_000));
  return `${duration(plannedMinutes)} planned · ${duration(left)} left before shutdown (${shutdown})`;
}

export function nightWindow(now: number, shutdown: string, bedtime: string, windDownAt?: number): 'day' | 'windDown' | 'lightsOut' {
  if (now >= shutdownAt(now, bedtime)) return 'lightsOut';
  if ((windDownAt != null && windDownAt <= now) || now >= shutdownAt(now, shutdown)) return 'windDown';
  return 'day';
}

export function capacity(estimatedMinutes: number, overrunRatio: number, now: number) {
  const weekend = [0, 6].includes(new Date(now).getDay());
  const available = 60 * (weekend ? RULES.tasks.freeHours.weekend : RULES.tasks.freeHours.classDay);
  const planned = Math.round(estimatedMinutes * overrunRatio);
  return { planned, available, over: planned > available };
}

export function suggestSlots(now: number, minutes: number, occupied: { start: number; end: number }[], count = 3): number[] {
  const date = new Date(now);
  date.setMinutes(Math.ceil(date.getMinutes() / 30) * 30, 0, 0);
  if (date.getTime() < now) date.setMinutes(date.getMinutes() + 30);
  const results: number[] = [];
  for (let start = date.getTime(); results.length < count && start < now + 2 * 86_400_000; start += 30 * 60_000) {
    if (occupied.every((slot) => start + minutes * 60_000 <= slot.start || start >= slot.end)) results.push(start);
  }
  return results;
}

export function nextBedtimeTarget(current: string, goal: string, metLastThree: boolean[], daysAtTarget: number): string {
  if (daysAtTarget < RULES.night.bedtimeRampEveryDays || metLastThree.slice(-3).filter(Boolean).length < RULES.night.bedtimeRampNeedsMetOfLast3) return current;
  return clock(Math.max(minutesAfterNoon(goal), minutesAfterNoon(current) - RULES.night.bedtimeStepMin));
}

export function stepDownOffer(budget: number, lastFourCounts: number[]): number | null {
  return lastFourCounts.length === 4 && lastFourCounts.filter((count) => count < budget).length >= 3 && budget > RULES.tasks.postpone.autoBudgetMin ? budget - 1 : null;
}

type SummaryTask = { id: string; title?: string; status: string; dayKey: string; category?: string; estimateMin?: number; scheduledStart?: number | null; firstScheduledDayKey?: string; doneAt?: number; postponeCount?: number };
type SummaryEvent = { taskId: string; kind: string; at: number; reason?: string; budgetCounted?: boolean };
type SummaryFocus = { taskId: string; startedAt: number; endedAt?: number; pauses?: { at: number; resumeAt?: number }[]; switches?: number };
type SummaryLog = { planDone?: boolean; shutdownDone?: boolean; reviewDone?: boolean };

export function weeklySummary(input: { weekStart: string; budget: number; tasks: SummaryTask[]; events: SummaryEvent[]; focus: SummaryFocus[]; logs: SummaryLog[] }) {
  const end = new Date(`${input.weekStart}T04:00:00`).getTime() + 7 * 86_400_000;
  const start = end - 7 * 86_400_000;
  const events = input.events.filter((row) => row.at >= start && row.at < end);
  const focus = input.focus.filter((row) => row.startedAt >= start && row.startedAt < end);
  const taskById = new Map(input.tasks.map((task) => [task.id, task]));
  const started = new Set<string>();
  let adherent = 0;
  for (const event of events.filter((row) => row.kind === 'started')) {
    const task = taskById.get(event.taskId);
    if (!task?.scheduledStart || started.has(task.id)) continue;
    started.add(task.id);
    if (Math.abs(event.at - task.scheduledStart) <= RULES.tasks.startAdherenceWindowMin * 60_000) adherent++;
  }
  const done = input.tasks.filter((task) => task.doneAt && task.doneAt >= start && task.doneAt < end && task.firstScheduledDayKey);
  const postponed = events.filter((row) => row.kind === 'postponed' && row.budgetCounted);
  const reachedThree = new Set<string>();
  const postponeCount = new Map<string, number>();
  for (const event of input.events.filter((row) => row.kind === 'postponed' && row.budgetCounted).sort((a, b) => a.at - b.at)) {
    const count = (postponeCount.get(event.taskId) ?? 0) + 1;
    postponeCount.set(event.taskId, count);
    if (count === 3 && event.at >= start && event.at < end) reachedThree.add(event.taskId);
  }
  const postponedTaskCount = new Set(postponed.map((row) => row.taskId)).size;
  const reasons: Record<string, number> = {};
  for (const event of postponed) if (event.reason) reasons[event.reason] = (reasons[event.reason] ?? 0) + 1;
  const timedMinutes = new Map<string, number>();
  for (const row of focus) {
    const task = taskById.get(row.taskId);
    if (!task?.estimateMin || !row.endedAt) continue;
    const paused = (row.pauses ?? []).reduce((sum, pause) => sum + ((pause.resumeAt ?? row.endedAt!) - pause.at), 0);
    timedMinutes.set(task.id, (timedMinutes.get(task.id) ?? 0) + (row.endedAt - row.startedAt - paused) / 60_000);
  }
  const ratios: Record<string, { actual: number; estimate: number }> = {};
  for (const [id, actual] of timedMinutes) {
    const task = taskById.get(id)!;
    const item = (ratios[task.category ?? 'general'] ??= { actual: 0, estimate: 0 });
    item.actual += actual;
    item.estimate += task.estimateMin!;
  }
  const estimateRatio = Object.fromEntries(Object.entries(ratios).map(([key, item]) => [key, Math.round(item.actual / item.estimate * 100) / 100]));
  const somedayMoved = [...new Set(events.filter((row) => row.kind === 'someday').map((row) => row.taskId))];
  return {
    weekStart: input.weekStart, startAdherence: { met: adherent, total: started.size },
    firstDayDone: { met: done.filter((task) => dayKey(task.doneAt!) === task.firstScheduledDayKey).length, total: done.length },
    postpones: postponed.length, reachedThree: reachedThree.size, reachedThreeShare: postponedTaskCount ? Math.round(reachedThree.size / postponedTaskCount * 100) : 0,
    reasons, budget: input.budget, budgetRemaining: Math.max(0, input.budget - postponed.length), budgetOverrun: Math.max(0, postponed.length - input.budget),
    estimateRatio, switchesPerBlock: focus.length ? Math.round(focus.reduce((sum, row) => sum + (row.switches ?? 0), 0) / focus.length * 100) / 100 : 0,
    rituals: { plan: input.logs.filter((row) => row.planDone).length, shutdown: input.logs.filter((row) => row.shutdownDone).length, review: input.logs.filter((row) => row.reviewDone).length },
    somedayMoved,
  };
}
