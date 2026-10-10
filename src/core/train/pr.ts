import { RULES } from '../rules.config';

export type PrKind = 'load' | 'repsAtLoad' | 'e1rm' | 'hold';
export type PrCandidate = { kind: PrKind; value: number; needsConfirmation: boolean };

export function detectSetPrs(
  set: { load: number; reps: number; type?: 'warmup' | 'working'; painFlag?: boolean; isHold?: boolean },
  best: { load?: number; repsAtLoad?: number; e1rm?: number; hold?: number },
): PrCandidate[] {
  if (set.type === 'warmup' || set.painFlag || set.reps <= 0 || set.load < 0 || !Number.isFinite(set.load) || !Number.isFinite(set.reps)) return [];
  const needsConfirmation = best.load != null && best.load > 0 && set.load > best.load * (1 + RULES.train.prLoadJumpConfirmPct / 100);
  if (set.isHold) return set.reps > (best.hold ?? 0) ? [{ kind: 'hold', value: set.reps, needsConfirmation: false }] : [];
  const prs: PrCandidate[] = [];
  if (set.load > (best.load ?? 0) && set.load > 0) prs.push({ kind: 'load', value: set.load, needsConfirmation });
  if (set.reps > (best.repsAtLoad ?? 0)) prs.push({ kind: 'repsAtLoad', value: set.reps, needsConfirmation });
  const e1rm = set.load * (1 + set.reps / 30);
  if (set.load > 0 && e1rm > (best.e1rm ?? 0)) prs.push({ kind: 'e1rm', value: Math.round(e1rm * 10) / 10, needsConfirmation });
  return prs;
}
