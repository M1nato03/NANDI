import * as v from 'valibot';
import { RULES } from './rules.config';
import { deriveEconomy } from './economy/deriveEconomy';
import { focusElapsedMs } from './tasks/focus';
import { weeklySummary as taskSummary } from './tasks/planner';
import type {
  CardRow,
  DailyLogRow,
  ExStateRow,
  FlagRow,
  FocusRow,
  LedgerRow,
  LessonProgRow,
  PlanRow,
  PrRow,
  ProgramRow,
  PuzzleRunRow,
  QuestRow,
  SessionRow,
  SettingRow,
  TaskEventRow,
  TaskRow,
} from '../data/types';

const count = v.pipe(v.number(), v.finite(), v.minValue(0));
const ratio = v.pipe(count, v.maxValue(100));
const record = v.record(v.string(), count);
export const weeklySummarySchema = v.object({
  app: v.literal('prime-pocket'),
  formatVersion: v.literal(1),
  appVersion: v.string(),
  rulesVersion: count,
  week: v.object({
    isoWeek: v.pipe(v.string(), v.regex(/^\d{4}-W\d{2}$/)),
    from: v.string(),
    to: v.string(),
  }),
  tasks: v.object({
    planned: count,
    done: count,
    doneFirstDayPct: ratio,
    startAdherencePct: ratio,
    postpones: count,
    budget: count,
    overBudget: v.boolean(),
    reachedThirdPct: ratio,
    reasons: v.object({
      underestimated: count,
      blocked: count,
      lowEnergy: count,
      avoided: count,
      real: count,
    }),
    estimateRatioByCategory: record,
    focusMinutes: count,
    switchesPerBlock: count,
    somedayMoved: v.array(v.string()),
    rituals: v.object({ plans: count, shutdowns: count, review: v.boolean() }),
  }),
  train: v.object({
    sessions: count,
    target: count,
    minimumSessions: count,
    safetyStops: count,
    restDayChecks: count,
    prs: v.array(
      v.object({ exercise: v.string(), kind: v.string(), value: v.number() }),
    ),
    ladderSteps: v.record(v.string(), v.string()),
    heatMode: v.boolean(),
  }),
  mind: v.object({
    dropDays: count,
    mysteriesSolved: count,
    boards: v.record(
      v.string(),
      v.object({ solved: count, medianSec: count, hints: count }),
    ),
    lessonsDone: v.array(v.string()),
    plansFired: v.object({ yes: count, partly: count, no: count, na: count }),
    cardsReviewed: count,
    recallRate: ratio,
    flaggedItems: v.array(v.string()),
  }),
  quests: v.object({ offered: count, completed: count, swapped: count }),
  economy: v.object({
    xp: count,
    level: count,
    streakDays: count,
    cleanWeek: v.boolean(),
    hatTricks: count,
    restDaysUsed: count,
  }),
  life: v.object({
    reelsBuckets: v.array(v.string()),
    wellbeingMinutesWeek: v.optional(count),
    lightsOut: v.array(v.string()),
    bedtimeTarget: v.string(),
    nightOverrides: count,
    agencyScore: v.optional(count),
    openedInsteadOfTask: v.optional(v.boolean()),
  }),
  guard: v.object({ appMinutesExclTimers: count }),
  errors: v.optional(
    v.array(v.object({ at: v.string(), where: v.string(), code: v.string() })),
  ),
});
export type WeeklySummary = v.InferOutput<typeof weeklySummarySchema>;
export type WeeklySources = {
  tasks: TaskRow[];
  events: TaskEventRow[];
  focus: FocusRow[];
  logs: DailyLogRow[];
  sessions: SessionRow[];
  prs: PrRow[];
  programs: ProgramRow[];
  puzzleRuns: PuzzleRunRow[];
  lessonProg: LessonProgRow[];
  plans: PlanRow[];
  flags: FlagRow[];
  ledger: LedgerRow[];
  quests: QuestRow[];
  settings: SettingRow[];
  exState: ExStateRow[];
  cards?: CardRow[];
};

function addDays(key: string, days: number): string {
  const date = new Date(`${key}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function isoFileWeek(key: string): string {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 3 - ((date.getUTCDay() + 6) % 7));
  const year = date.getUTCFullYear();
  const first = new Date(Date.UTC(year, 0, 4));
  first.setUTCDate(first.getUTCDate() + 3 - ((first.getUTCDay() + 6) % 7));
  return `${year}-W${String(1 + Math.round((date.getTime() - first.getTime()) / (7 * 86_400_000))).padStart(2, '0')}`;
}
function pct(part: number, total: number): number {
  return total ? Math.round((part / total) * 100) : 0;
}
function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return Math.round(
    (sorted[Math.floor((sorted.length - 1) / 2)]! +
      sorted[Math.floor(sorted.length / 2)]!) /
      2,
  );
}
function setting(rows: SettingRow[], key: string): unknown {
  return rows.find((row) => row.key === key && !row.deleted)?.value;
}

export function buildWeeklySummary(
  weekStart: string,
  source: WeeklySources,
  budget: number,
): WeeklySummary {
  const to = addDays(weekStart, 6),
    next = addDays(weekStart, 7);
  const startAt = new Date(`${weekStart}T04:00:00`).getTime(),
    endAt = new Date(`${next}T04:00:00`).getTime();
  const inTime = (at: number | undefined) =>
    at !== undefined && at >= startAt && at < endAt;
  const inDay = (key: string | undefined) =>
    key !== undefined && key >= weekStart && key < next;
  const logs = source.logs.filter((row) => !row.deleted && inDay(row.dayKey));
  const events = source.events.filter((row) => !row.deleted);
  const focus = source.focus.filter(
    (row) => !row.deleted && inTime(row.startedAt),
  );
  const focusOverlapping = source.focus.filter(
    (row) =>
      !row.deleted && row.startedAt < endAt && (row.endedAt ?? endAt) > startAt,
  );
  const facts = source.ledger.filter(
    (row) => !row.deleted && inDay(row.dayKey),
  );
  const taskData = taskSummary({
    weekStart,
    budget,
    tasks: source.tasks.filter((row) => !row.deleted),
    events,
    focus,
    logs,
  });
  const reasonKeys = [
    'underestimated',
    'blocked',
    'lowEnergy',
    'avoided',
    'real',
  ] as const;
  const reasons = Object.fromEntries(
    reasonKeys.map((key) => [key, taskData.reasons[key] ?? 0]),
  ) as Record<(typeof reasonKeys)[number], number>;
  reasons.real = events.filter(row => row.kind === 'realReasonMove' && inTime(row.at)).length;
  const plannedIds = new Set(source.tasks.filter(row => !row.deleted && inDay(row.firstScheduledDayKey)).map(row => row.id));
  for (const row of events) if ((row.kind === 'scheduled' || row.kind === 'postponed' || row.kind === 'realReasonMove') && inTime(row.at)) plannedIds.add(row.taskId);
  const sessions = source.sessions.filter(
    (row) =>
      !row.deleted &&
      inDay(row.dayKey) &&
      row.status !== 'active' &&
      row.status !== 'skipped',
  );
  const prs = source.prs.filter(
    (row) =>
      !row.deleted &&
      inTime(row.at ?? row.updatedAt) &&
      row.value !== undefined,
  );
  const runs = source.puzzleRuns.filter(
    (row) => !row.deleted && inDay(row.dayKey),
  );
  const boards: WeeklySummary['mind']['boards'] = {};
  for (const type of new Set(
    runs.filter((row) => row.type !== 'mystery').map((row) => row.type),
  )) {
    const solved = runs.filter(
      (row) => row.type === type && row.result === 'solved',
    );
    boards[type] = {
      solved: solved.length,
      medianSec: median(
        solved.map((row) => Math.round((row.solveMs ?? 0) / 1000)),
      ),
      hints: solved.reduce((sum, row) => sum + (row.hintsUsed ?? 0), 0),
    };
  }
  const cardFacts = facts.filter(
    (row) => row.mode === 'mind' && row.kind === 'card',
  );
  const dropDays = new Set(
    facts
      .filter((row) => row.mode === 'mind' && row.kind === 'mystery')
      .map((row) => row.dayKey),
  );
  for (const key of [...dropDays]) {
    if (
      !facts.some(
        (row) =>
          row.dayKey === key &&
          row.mode === 'mind' &&
          row.kind === 'board' &&
          row.inputs.daily === true,
      ) ||
      !facts.some(
        (row) =>
          row.dayKey === key && row.mode === 'mind' && row.kind === 'lesson',
      ) ||
      setting(source.settings, `mind.reviewsDone:${key}`) !== true
    )
      dropDays.delete(key);
  }
  const knownRecall = cardFacts.filter(
    (row) => typeof row.inputs.correct === 'boolean',
  );
  const planAnswers = source.plans.filter(
    (row) => !row.deleted && row.fired && inTime(row.updatedAt),
  );
  const fired = { yes: 0, partly: 0, no: 0, na: 0 };
  for (const row of planAnswers) if (row.fired) fired[row.fired]++;
  const economy = deriveEconomy(source.ledger, undefined, source.settings, to);
  const totalXp = economy.days.filter(day => inDay(day.dayKey)).reduce((sum, day) => sum + day.total, 0);
  const streakDays = economy.streak.days;
  const agency = logs
    .filter((row) => row.agency1to5 !== undefined)
    .map((row) => row.agency1to5!);
  const wellbeing = logs
    .filter((row) => row.wellbeingMinutes !== undefined)
    .reduce((sum, row) => sum + row.wellbeingMinutes!, 0);
  const errors = setting(source.settings, 'errorRing');
  const summary: WeeklySummary = {
    app: 'prime-pocket',
    formatVersion: 1,
    appVersion: '0.1.0',
    rulesVersion: 1,
    week: { isoWeek: isoFileWeek(weekStart), from: weekStart, to },
    tasks: {
      planned: plannedIds.size,
      done: source.tasks.filter((row) => !row.deleted && inTime(row.doneAt))
        .length,
      doneFirstDayPct: pct(
        taskData.firstDayDone.met,
        taskData.firstDayDone.total,
      ),
      startAdherencePct: pct(
        taskData.startAdherence.met,
        taskData.startAdherence.total,
      ),
      postpones: taskData.postpones,
      budget,
      overBudget: taskData.budgetOverrun > 0,
      reachedThirdPct: taskData.reachedThreeShare,
      reasons,
      estimateRatioByCategory: taskData.estimateRatio,
      focusMinutes: Math.round(
        focusOverlapping.reduce(
          (sum, row) =>
            sum +
            focusElapsedMs(row, Math.min(endAt, row.endedAt ?? endAt)) -
            focusElapsedMs(row, Math.max(startAt, row.startedAt)),
          0,
        ) / 60_000,
      ),
      switchesPerBlock: taskData.switchesPerBlock,
      somedayMoved: taskData.somedayMoved,
      rituals: {
        plans: taskData.rituals.plan,
        shutdowns: taskData.rituals.shutdown,
        review: taskData.rituals.review > 0,
      },
    },
    train: {
      sessions: sessions.filter((row) => row.status === 'completed').length,
      target:
        source.programs.find((row) => !row.deleted)?.weeklyTarget ??
        RULES.train.weeklyTarget,
      minimumSessions: sessions.filter((row) => row.status === 'minimum')
        .length,
      safetyStops: sessions.filter((row) => row.status === 'safety').length,
      restDayChecks: facts.filter(
        (row) => row.mode === 'train' && row.kind === 'rest',
      ).length,
      prs: prs.map((row) => ({
        exercise: row.exerciseId,
        kind: row.kind,
        value: row.value!,
      })),
      ladderSteps: Object.fromEntries(
        source.exState
          .filter((row) => !row.deleted && row.ladderStep !== undefined)
          .map((row) => [row.id, String(row.ladderStep)]),
      ),
      heatMode: sessions.some((row) => !!row.heatMode),
    },
    mind: {
      dropDays: dropDays.size,
      mysteriesSolved: runs.filter(
        (row) => row.type === 'mystery' && row.result === 'solved',
      ).length,
      boards,
      lessonsDone: source.lessonProg
        .filter((row) => !row.deleted && inDay(row.doneDayKey))
        .map((row) => row.id),
      plansFired: fired,
      cardsReviewed: cardFacts.length,
      recallRate: pct(
        knownRecall.filter((row) => row.inputs.correct === true).length,
        knownRecall.length,
      ),
      flaggedItems: source.flags
        .filter(
          (row) =>
            !row.deleted && row.hidden && inTime(row.at ?? row.updatedAt),
        )
        .map((row) => row.refId),
    },
    quests: {
      offered: source.quests.filter(
        (row) => !row.deleted && row.week === isoFileWeek(weekStart),
      ).length,
      completed: facts.filter(
        (row) => row.mode === 'quests' && row.kind === 'quest',
      ).length,
      swapped: source.quests.filter(
        (row) =>
          !row.deleted &&
          row.week === isoFileWeek(weekStart) &&
          row.status === 'swapped',
      ).length,
    },
    economy: {
      xp: totalXp,
        level: economy.level,
      streakDays,
        cleanWeek: economy.cleanWeek.complete,
        hatTricks: economy.cleanWeek.count,
        restDaysUsed: economy.streak.restDaysUsed,
    },
    life: {
      reelsBuckets: logs
        .map((row) => row.reelsBucket)
        .filter((value): value is string => !!value),
      ...(logs.some((row) => row.wellbeingMinutes !== undefined)
        ? { wellbeingMinutesWeek: wellbeing }
        : {}),
      lightsOut: logs
        .filter((row) => row.lightsOutAt !== undefined)
        .map((row) => new Date(row.lightsOutAt!).toISOString()),
      bedtimeTarget: String(
        setting(source.settings, 'planner.bedtime') ??
          RULES.night.defaultBedtime,
      ),
      nightOverrides: logs.reduce(
        (sum, row) => sum + (row.nightOverrides ?? 0),
        0,
      ),
      ...(agency.length
        ? {
            agencyScore:
              Math.round(
                (agency.reduce((a, b) => a + b, 0) / agency.length) * 10,
              ) / 10,
          }
        : {}),
      ...(logs.some((row) => row.agencyOpenedInstead !== undefined)
        ? { openedInsteadOfTask: logs.some((row) => row.agencyOpenedInstead) }
        : {}),
    },
    guard: {
      appMinutesExclTimers: logs.reduce(
        (sum, row) => sum + (row.appMinutes ?? 0),
        0,
      ),
    },
    ...(Array.isArray(errors)
      ? {
          errors: errors
            .filter(
              (row): row is { at: number; source: string; message: string } =>
                !!row &&
                typeof row === 'object' &&
                'at' in row &&
                'source' in row &&
                'message' in row,
            )
            .filter((row) => inTime(row.at))
            .map((row) => ({
              at: new Date(row.at).toISOString(),
              where: row.source,
              code: row.message.slice(0, 120),
            })),
        }
      : {}),
  };
  return v.parse(weeklySummarySchema, summary);
}
