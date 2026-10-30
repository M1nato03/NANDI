import type { FocusRow, LedgerRow } from '../../data/types';
import { focusElapsedMs } from '../tasks/focus';
import type { Rules } from '../rules.config';

/**
 * Spec 36 "Effort pays": measured effort earns more. These read only measured facts (minutes on a running timer with
 * the focus guard watching, a window the usage log checked, minutes sat in Calm); self-reported effort never pays.
 * Each is paid only from economy.v6From, the day the build first ran on this phone (deriveEconomy).
 */

const MINUTE = 60_000;

/**
 * Full blocks of `blockMin` with no break in one focus: each run between pauses counts its own whole blocks. A pause
 * (yours, Still working? or the guard's) or a moment in a distracting app (`breaks`) ends a run, so a broken block pays
 * its minutes but no block bonus.
 */
export function cleanBlocks(focus: Pick<FocusRow, 'startedAt' | 'pauses' | 'endedAt'>, end: number, blockMin: number, breaks: readonly (readonly [number, number])[] = []): number {
  const stop = focus.endedAt ?? end;
  const runs: [number, number][] = [];
  let from: number | undefined = focus.startedAt;
  for (const pause of focus.pauses ?? []) {
    if (from != null) runs.push([from, Math.min(pause.at, stop)]);
    from = pause.resumeAt;
  }
  if (from != null) runs.push([from, stop]);
  // Each break splits the run it falls in.
  const pieces = [...breaks].sort((a, b) => a[0] - b[0]).reduce((list, [a, b]) => list.flatMap(([x, y]) =>
    b <= x || a >= y ? [[x, y] as [number, number]] : [[x, Math.max(x, a)] as [number, number], [Math.min(y, b), y] as [number, number]]), runs);
  return pieces.reduce((sum, [x, y]) => sum + Math.floor(Math.max(0, y - x) / (blockMin * MINUTE)), 0);
}

/** The XP a set of focus minutes and blocks earns: one task's whole time, so Stop for now and Start never round twice. */
export function focusXp(paidMs: number, blocks: number, rules: Rules): number {
  const pay = rules.tasks.focusPay;
  if (!pay) return 0;
  return Math.floor(Math.max(0, paidMs) / (pay.minutesPerXp * MINUTE)) + Math.max(0, blocks) * pay.blockXp;
}

/**
 * One day's focus pay: the day's `focus-time` facts grouped by task, each task paid on its summed minutes. Only a focus
 * the guard watched pays (Jenil: "we will be seen as stupid people who are easy to fool").
 */
export function focusDayXp(facts: readonly LedgerRow[], rules: Rules): number {
  const byTask = new Map<string, { ms: number; blocks: number }>();
  const seen = new Set<string>();
  for (const fact of facts) {
    if (fact.deleted || fact.mode !== 'tasks' || fact.kind !== 'focus-time' || seen.has(fact.id) || fact.inputs.guard !== true) continue;
    seen.add(fact.id);
    const task = String(fact.inputs.taskId ?? fact.refId);
    const row = byTask.get(task) ?? { ms: 0, blocks: 0 };
    row.ms += Number(fact.inputs.paidMs) > 0 ? Number(fact.inputs.paidMs) : 0;
    row.blocks += Number(fact.inputs.blocks) > 0 ? Math.floor(Number(fact.inputs.blocks)) : 0;
    byTask.set(task, row);
  }
  return [...byTask.values()].reduce((sum, row) => sum + focusXp(row.ms, row.blocks, rules), 0);
}

/**
 * What a task's focus has earned so far, as the economy will pay it: every guard-watched focus of the task, less its
 * distracted time, with its clean blocks. Null when the guard is off for the open focus (it earns no focus XP).
 */
export function focusSoFar(rows: readonly FocusRow[], taskId: string, now: number, rules: Rules): number | null {
  const mine = rows.filter(row => row.taskId === taskId && !row.deleted);
  const open = mine.find(row => row.endedAt == null);
  if (!rules.tasks.focusPay || (open && open.guard?.on !== true)) return null;
  const watched = mine.filter(row => row.guard?.on === true);
  const paid = watched.reduce((sum, row) => sum + Math.max(0, focusElapsedMs(row, now) - (row.guard?.distractedMs ?? 0)), 0);
  const blocks = watched.reduce((sum, row) => sum + cleanBlocks(row, now, rules.tasks.focusPay.blockMin, row.guard?.spans ?? []), 0);
  return focusXp(paid, blocks, rules);
}

/** A kept, measured chhutti: xp for the first startMin minutes, then extraXpPer10Min for each further 10 (60 → 16, 180 → 40). */
export function chhuttiXp(fact: LedgerRow, rules: Rules): number {
  const pay = rules.plan.chhutti;
  if (fact.inputs.kept !== true || fact.inputs.source !== 'usage') return 0;
  const minutes = Number(fact.inputs.plannedMin);
  const extra = 'extraXpPer10Min' in pay ? Number(pay.extraXpPer10Min) : 0;
  return pay.xp + (Number.isFinite(minutes) ? Math.floor(Math.max(0, minutes - pay.startMin) / 10) * extra : 0);
}

/** Calm: each whole minute sat in a counted session pays, up to the daily cap. */
export function calmDayXp(facts: readonly LedgerRow[], rules: Rules): number {
  const pay = (rules as Rules & { calm?: { xpPerMin: number; dailyCap: number } }).calm;
  if (!pay) return 0;
  const minutes = facts.filter(fact => !fact.deleted && fact.mode === 'calm' && fact.kind === 'session')
    .reduce((sum, fact) => sum + (Number(fact.inputs.minutes) > 0 ? Math.floor(Number(fact.inputs.minutes)) : 0), 0);
  return Math.min(pay.dailyCap, minutes * pay.xpPerMin);
}

/**
 * Spec 39: the Pause card. Each 2-minute act finished with NANDI in front (an attempt whose outcome is act_done) pays
 * actXp, up to dailyCap a day. Backing out or opening the app anyway pays nothing.
 */
export function pauseDayXp(facts: readonly LedgerRow[], rules: Rules): number {
  const pay = (rules as Rules & { pause?: { actXp: number; dailyCap: number } }).pause;
  if (!pay) return 0;
  const acts = facts.filter(fact => !fact.deleted && fact.mode === 'pause' && fact.kind === 'attempt' && fact.inputs.outcome === 'act_done').length;
  return Math.min(pay.dailyCap, acts * pay.actXp);
}

/*
 * Spec 36 v2: effort pays in Train, Mind and Read, from economy.v7From. Each reads only what the app itself checked: a
 * set's slot and the time it was logged, a board's generated difficulty and the hints it took, the steps a chapter
 * newly taught and the first answers its check graded. Typed reps, kg, hold seconds and how hard it felt pay nothing.
 */

/** How many working sets pay: in time order, each at least minGapS after the last paid one (so 12 taps in 10 s pay 1). */
export function paidSetCount(completedAt: readonly number[], rules: Rules): number {
  if (!('setPay' in rules.train)) return 0;
  const pay = rules.train.setPay;
  let last = -Infinity, paid = 0;
  for (const at of [...completedAt].filter(Number.isFinite).sort((a, b) => a - b)) {
    if (at - last < pay.minGapS * 1000) continue;
    paid += 1; last = at;
  }
  return Math.min(paid, pay.maxSets);
}

/**
 * A session's pay from its paid sets. The whole plan pays baseXp + perSetXp a set; a session stopped early pays
 * partialPerSetXp a set (so stopping never pays more than finishing), at least the old 40 when every exercise was
 * touched, and never more than the whole-plan figure for the same sets. A safety or pain stop keeps its 40 with no set
 * bonus. Null for a fact without paid sets (an older build).
 */
export function trainSessionPay(inputs: Record<string, unknown>, rules: Rules): number | null {
  if (!('setPay' in rules.train) || typeof inputs.paidSets !== 'number') return null;
  const pay = rules.train.setPay;
  if (inputs.safety === true) return rules.train.minimumOrSafetyXp;
  if (!(Number(inputs.workingSets) > 0)) return 0;
  const paid = Math.min(pay.maxSets, Math.max(0, Math.floor(inputs.paidSets)));
  const full = pay.baseXp + pay.perSetXp * paid;
  if (Number(inputs.workingSets) >= Number(inputs.plannedSets)) return full;
  const everyExercise = Number(inputs.touchedExercises) >= Number(inputs.plannedExercises) && Number(inputs.plannedExercises) > 0;
  return Math.min(full, Math.max(everyExercise ? rules.train.sessionPartialFloorXp : 0, pay.partialPerSetXp * paid));
}

/** A solved board by its difficulty, less a little per hint and never below minXp; how fast it went pays nothing. */
export function boardPay(inputs: Record<string, unknown>, rules: Rules): number | null {
  if (!('boardPay' in rules.mind)) return null;
  const pay = rules.mind.boardPay;
  const base = inputs.diff === 'hard' ? pay.hard : inputs.diff === 'medium' ? pay.medium : pay.easy;
  const hints = Number(inputs.hintsUsed) > 0 ? Math.floor(Number(inputs.hintsUsed)) : 0;
  return Math.max(pay.minXp, base - pay.hintXp * hints);
}

/** A new chapter: base, each step it newly taught, each right first answer in its check (up to rightMax), up to maxXp. */
export function chapterPay(inputs: Record<string, unknown>, rules: Rules): number | null {
  if (!('chapterPay' in rules.mind) || typeof inputs.newSteps !== 'number') return null;
  const pay = rules.mind.chapterPay;
  const steps = Math.max(0, Math.floor(inputs.newSteps));
  const right = Math.min(pay.rightMax, Math.max(0, Math.floor(Number(inputs.firstRight) || 0)));
  return Math.min(pay.maxXp, pay.baseXp + pay.stepXp * steps + pay.rightXp * right);
}
