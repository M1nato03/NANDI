import { RULES } from '../../core/rules.config';
import { boardPay, chapterPay, trainSessionPay } from '../../core/economy/effort';
import type { LedgerRow } from '../../data/types';

/*
 * Spec 36 v2: plain lines that show why an effort paid what it did. Each reads the fact the app wrote, and shows XP only
 * when the fact pays (inside the day's limits, before bedtime). The 45 s set rule is never named: a set logged too soon
 * after the last simply adds no +4.
 */

/**
 * Train done: "6 sets · +72 XP". A session stopped early says "6 sets logged · +48 XP" and, as a pointer rather than a
 * judgement, what the whole plan pays ("The full plan pays +76 next time."). A safety stop gets no such line.
 */
export function trainLine(fact: LedgerRow | undefined): { line: string; next?: string } | null {
  if (!fact || typeof fact.inputs.paidSets !== 'number') return null;
  const sets = Number(fact.inputs.workingSets) || 0;
  const planned = Number(fact.inputs.plannedSets) || 0;
  const xp = trainSessionPay(fact.inputs, RULES);
  const stopped = fact.inputs.safety !== true && sets < planned;
  const line = `${sets} ${sets === 1 ? 'set' : 'sets'}${stopped ? ' logged' : ''}${xp ? ` · +${xp} XP` : ''}`;
  if (!stopped) return { line };
  const pay = RULES.train.setPay;
  return { line, next: `The full plan pays +${pay.baseXp + pay.perSetXp * Math.min(pay.maxSets, planned)} next time.` };
}

const DIFF_NAME: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

/** A solved board: "Hard board, solved · +30 XP" or "Medium board, 1 hint · +15 XP". Null for a board that pays nothing. */
export function boardLine(facts: readonly LedgerRow[], runId: string): string | null {
  const fact = facts.find(row => row.id === `board:${runId}` && !row.deleted);
  if (!fact || fact.inputs.afterBedtime === true) return null;
  const side = facts.filter(row => row.kind === 'board' && !row.deleted && row.dayKey === fact.dayKey && row.inputs.daily === false && row.inputs.afterBedtime !== true).sort((a, b) => a.updatedAt - b.updatedAt);
  if (fact.inputs.daily === false && side.indexOf(fact) >= RULES.mind.sideBoardsMaxPerDay) return null;
  const hints = Number(fact.inputs.hintsUsed) > 0 ? Math.floor(Number(fact.inputs.hintsUsed)) : 0;
  const name = DIFF_NAME[String(fact.inputs.diff)] ?? 'Easy';
  return `${name} board, ${hints ? `${hints} ${hints === 1 ? 'hint' : 'hints'}` : 'solved'} · +${boardPay(fact.inputs, RULES)} XP`;
}

/** A finished chapter: "2 new ideas, 2 right · +25 XP". The XP shows for the day's first three chapters before bedtime. */
/**
 * Spec 41: what one idea-sitting earned: its share of the chapter's pay (base on the chapter's first idea, then 5 a
 * step, 40 in all across the chapter), topped up to the drop's 15 when it was the day's drop. Past the cap it says the
 * chapter's XP is complete and the reading still counts, so a 0 never looks like a fault.
 */
export function ideaLine(facts: readonly LedgerRow[], chapter: string, conceptId: string): string | null {
  const pay = RULES.mind.chapterPay;
  const ideas = facts.filter(row => row.kind === 'idea' && !row.deleted && row.inputs.chapter === chapter && row.inputs.afterBedtime !== true).sort((a, b) => a.updatedAt - b.updatedAt);
  let paid = 0;
  for (const [index, row] of ideas.entries()) {
    const amount = Math.min((index === 0 ? pay.baseXp : 0) + pay.stepXp * (Number(row.inputs.newSteps) || 0), Math.max(0, pay.maxXp - paid));
    if (row.inputs.conceptId === conceptId) {
      const total = amount + (row.inputs.dropId ? Math.max(0, RULES.mind.learnDropXp - amount) : 0);
      return total ? `+${total} XP` : 'Chapter XP complete · your reading time still counts';
    }
    paid += amount;
  }
  return null;
}

export function chapterLine(facts: readonly LedgerRow[], ref: string): string | null {
  // Spec 41: a chapter read one idea a sitting shows what its last sitting earned.
  const lastIdea = facts.filter(row => row.kind === 'idea' && !row.deleted && row.inputs.chapter === ref).sort((a, b) => a.updatedAt - b.updatedAt).at(-1);
  if (lastIdea) return ideaLine(facts, ref, String(lastIdea.inputs.conceptId));
  const fact = facts.find(row => row.kind === 'chapter' && row.refId === ref && !row.deleted);
  if (!fact || typeof fact.inputs.newSteps !== 'number') return null;
  const steps = fact.inputs.newSteps, right = Number(fact.inputs.firstRight) || 0;
  const what = [steps ? `${steps} new ${steps === 1 ? 'idea' : 'ideas'}` : '', right ? `${right} right` : ''].filter(Boolean).join(', ');
  const day = facts.filter(row => row.kind === 'chapter' && !row.deleted && row.dayKey === fact.dayKey && row.inputs.afterBedtime !== true && typeof row.inputs.newSteps === 'number').sort((a, b) => a.updatedAt - b.updatedAt);
  const paid = fact.inputs.afterBedtime !== true && day.indexOf(fact) < RULES.mind.chapterPay.paidPerDay;
  const xp = paid ? chapterPay(fact.inputs, RULES) : null;
  return [what, xp ? `+${xp} XP` : ''].filter(Boolean).join(' · ') || null;
}
