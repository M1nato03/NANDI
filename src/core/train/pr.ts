import { RULES } from '../rules.config';

export type PrKind = 'load' | 'repsAtLoad' | 'e1rm' | 'hold';
export type PrCandidate = { kind: PrKind; value: number; needsConfirmation: boolean };

export function detectSetPrs(
  set: { load: number; reps: number; type?: 'warmup' | 'working'; painFlag?: boolean; isHold?: boolean; repMax?: number },
  best: { load?: number; repsAtLoad?: number; e1rm?: number; hold?: number },
): PrCandidate[] {
  if (set.type === 'warmup' || set.painFlag || set.reps <= 0 || set.load < 0 || !Number.isFinite(set.load) || !Number.isFinite(set.reps)) return [];
  const needsConfirmation = best.load != null && best.load > 0 && set.load > best.load * (1 + RULES.train.prLoadJumpConfirmPct / 100);
  if (set.isHold) return set.reps > (best.hold ?? 0) ? [{ kind: 'hold', value: set.reps, needsConfirmation: false }] : [];
  const prs: PrCandidate[] = [];
  // Spec 03: the game never pays for going past the plan, so reps above the planned top count as the top (item 51).
  const reps = set.repMax != null && set.repMax > 0 ? Math.min(set.reps, set.repMax) : set.reps;
  if (set.load > (best.load ?? 0) && set.load > 0) prs.push({ kind: 'load', value: set.load, needsConfirmation });
  if (reps > (best.repsAtLoad ?? 0)) prs.push({ kind: 'repsAtLoad', value: reps, needsConfirmation });
  const e1rm = set.load * (1 + reps / 30);
  if (set.load > 0 && e1rm > (best.e1rm ?? 0)) prs.push({ kind: 'e1rm', value: Math.round(e1rm * 10) / 10, needsConfirmation });
  return prs;
}
