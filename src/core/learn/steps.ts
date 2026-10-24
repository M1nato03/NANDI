import type { TopicConcept, TopicStep } from '../../data/packs/schemas';

/**
 * Spec 14, teach first. A stepped concept is taught one small idea at a time; its items are quiz
 * material only after the step they test has been taught. Concepts without steps keep today's drop.
 */
export const LESSON_PREFIX = 'lesson:';
export const lessonItemId = (stepId: string) => `${LESSON_PREFIX}${stepId}`;
export const isLessonItemId = (itemId: string) => itemId.startsWith(LESSON_PREFIX);

export interface StepRef { concept: TopicConcept; step: TopicStep; index: number }

export function findStep(concepts: readonly TopicConcept[], stepId: string): StepRef | undefined {
  for (const concept of concepts) {
    const index = concept.steps?.findIndex(step => step.id === stepId) ?? -1;
    if (index >= 0) return { concept, step: concept.steps![index]!, index };
  }
  return undefined;
}

/** The first step not yet taught, in catalog order; one concept's steps are taught in order. */
export function nextStep(concepts: readonly TopicConcept[], taught: ReadonlySet<string>, conceptId?: string): StepRef | undefined {
  for (const concept of concepts) {
    if (conceptId && concept.id !== conceptId) continue;
    const index = concept.steps?.findIndex(step => !taught.has(step.id)) ?? -1;
    if (index >= 0) return { concept, step: concept.steps![index]!, index };
  }
  return undefined;
}

/**
 * The hook on a topic card (idea engine items 71 B3 and 72, Jenil approved): while the topic has an untaught step,
 * the card shows that next step's own hook guess, which the same lesson answers, so the card never promises what the
 * next lesson does not teach. Once every step is taught, it shows the idea's hook (`fallback` picks the idea).
 */
export function cardHook(concepts: readonly TopicConcept[], taught: ReadonlySet<string>, fallback?: TopicConcept): { conceptId?: string; stepId?: string; text?: string } {
  const next = nextStep(concepts, taught);
  if (next) return { conceptId: next.concept.id, stepId: next.step.id, text: next.step.hook.stem };
  const concept = fallback ?? concepts[0];
  return { conceptId: concept?.id, text: concept?.hook };
}

/**
 * The daily lesson across several chosen topics (idea engine item 71, B2): take the next step of the topic whose last
 * taught step is oldest (a topic never taught counts as oldest), so one topic is not used up before the next begins.
 * Ties keep the catalog order. A step with no recorded day counts as taught long ago.
 */
export function nextStepAcross(topics: readonly (readonly TopicConcept[])[], taught: ReadonlySet<string>, taughtOn: Readonly<Record<string, string>> = {}): StepRef | undefined {
  let best: StepRef | undefined;
  let bestDay = '';
  for (const concepts of topics) {
    const next = nextStep(concepts, taught);
    if (!next) continue;
    const last = concepts.flatMap(concept => concept.steps ?? []).filter(step => taught.has(step.id)).map(step => taughtOn[step.id] ?? '0000-00-00').sort().at(-1) ?? '';
    if (!best || last < bestDay) { best = next; bestDay = last; }
  }
  return best;
}

/** What the selector may draw from: stepped concepts keep only items of taught steps, and drop out until one is taught. */
export function taughtCatalog(concepts: readonly TopicConcept[], taught: ReadonlySet<string>): TopicConcept[] {
  return concepts.flatMap(concept => {
    if (!concept.steps) return [concept];
    const items = concept.items.filter(item => item.step && taught.has(item.step));
    return items.length ? [{ ...concept, items }] : [];
  });
}

/**
 * Gold review tests a whole idea, so it waits until every step was taught on an earlier day (spec 16 §5:
 * a step's own questions are never asked on the day it is taught). Ideas without steps use all their items.
 * Returns undefined while a step is still untaught or was taught today.
 */
export function goldItems(concept: TopicConcept, taughtOn: Readonly<Record<string, string>>, today: string): TopicConcept['items'] | undefined {
  if (!concept.steps?.length) return concept.items;
  if (concept.steps.some(step => !taughtOn[step.id] || taughtOn[step.id]! >= today)) return undefined;
  return concept.items;
}

/**
 * Spec 16 §5: never two items of one idea in a row. Keeps the given order where it can; when the
 * next item shares the last one's idea, the first later item from another idea moves up instead.
 */
export function interleave<T extends { conceptId: string }>(items: readonly T[]): T[] {
  const left = [...items];
  const out: T[] = [];
  while (left.length) {
    const last = out.at(-1)?.conceptId;
    const index = Math.max(0, left.findIndex(item => item.conceptId !== last));
    out.push(left.splice(index, 1)[0]!);
  }
  return out;
}

/**
 * Spec 14 kill test: guided first tries should land at 85–95% and your-turn answers near 80%.
 * Your-turn answers are the first answer to each item of a taught step, in whatever later drop it
 * came (spec 16 §5 serves a step's own items from the next day, mixed with other ideas).
 */
export function lessonMetrics(ledger: readonly { kind: string; deleted: number; refId: string; inputs: Record<string, unknown> }[], stepOf: (itemId: string) => string | undefined) {
  const lessons = ledger.filter(row => row.kind === 'learn-lesson' && !row.deleted);
  const guided = lessons.flatMap(row => Array.isArray(row.inputs.guidedFirstTry) ? row.inputs.guidedFirstTry as boolean[] : []);
  const taught = new Set(lessons.map(lesson => lesson.refId));
  const seen = new Set<string>();
  const own = ledger.filter(row => {
    const itemId = String(row.inputs.itemId);
    if (row.kind !== 'learn-answer' || row.deleted || seen.has(itemId) || !taught.has(stepOf(itemId) ?? '')) return false;
    seen.add(itemId);
    return true;
  });
  const share = (values: readonly boolean[]) => values.length ? Math.round(100 * values.filter(Boolean).length / values.length) : null;
  return { lessons: lessons.length, guidedFirstTry: share(guided), guidedCount: guided.length, yourTurn: share(own.map(row => row.inputs.correct === true)), yourTurnCount: own.length };
}

export interface TailAnswer { itemId: string; correct: boolean; at: number; day?: string }
export interface TailPick { item: TopicConcept['items'][number]; conceptId: string; asked: boolean }
/**
 * Spec 16 §6, the your-turn tail after a lesson: up to `max` questions from steps taught on an earlier day
 * (and ideas without steps already started). Chosen in this order: items last answered wrong; then never-asked
 * items, oldest taught step first; then items answered right on an earlier day, oldest first, so a right answer
 * only comes back once every taught item has been asked. At most 2 items of one step. The chosen set is then
 * ordered so one step (and one idea) is not back to back while another is waiting.
 */
export function practiceTail(input: { catalog: readonly TopicConcept[]; taughtOn: Readonly<Record<string, string>>; today: string;
  answers: readonly TailAnswer[]; started: ReadonlySet<string>; max: number; due?: ReadonlySet<string>; removed?: ReadonlySet<string> }): TailPick[] {
  const last = new Map<string, TailAnswer>();
  for (const answer of input.answers) if (!last.has(answer.itemId) || last.get(answer.itemId)!.at <= answer.at) last.set(answer.itemId, answer);
  type Candidate = TailPick & { step: string; taughtOn: string; order: number; lastAt: number };
  const pool: Candidate[] = [];
  const spacedOut = (day: string | undefined) => {
    if (!day) return true;
    const gap = (Date.parse(`${input.today}T12:00:00Z`) - Date.parse(`${day}T12:00:00Z`)) / 86_400_000;
    return gap >= 3;
  };
  for (const concept of input.catalog) {
    // A concept whose saved state was removed (reset) is not practised from old answers.
    if (input.removed?.has(concept.id)) continue;
    concept.items.forEach((item, order) => {
      let taughtOn = '';
      if (concept.steps?.length) {
        const day = item.step ? input.taughtOn[item.step] : undefined;
        if (!day || day >= input.today) return;
        taughtOn = day;
      } else if (!input.started.has(concept.id)) return;
      const answer = last.get(item.id);
      pool.push({ item, conceptId: concept.id, asked: !!answer, step: item.step ?? concept.id, taughtOn, order, lastAt: answer?.at ?? 0 });
    });
  }
  const answer = (c: Candidate) => last.get(c.item.id)!;
  const wrong = pool.filter(c => c.asked && !answer(c).correct).sort((a, b) => a.lastAt - b.lastAt);
  const fresh = pool.filter(c => !c.asked).sort((a, b) => a.taughtOn.localeCompare(b.taughtOn) || a.step.localeCompare(b.step) || a.order - b.order);
  // A right answer comes back only when its spacing is due: the idea's review is due, or 3+ days have passed (item 38).
  const right = pool.filter(c => c.asked && answer(c).correct && (answer(c).day ?? '') < input.today && (input.due?.has(c.conceptId) || spacedOut(answer(c).day))).sort((a, b) => a.lastAt - b.lastAt);
  // Within one tier, take ideas in turn so the tail spreads across ideas when it can.
  const spread = (tier: Candidate[]) => {
    const queues = new Map<string, Candidate[]>();
    for (const c of tier) queues.set(c.conceptId, [...(queues.get(c.conceptId) ?? []), c]);
    const out: Candidate[] = [];
    while ([...queues.values()].some(queue => queue.length)) for (const queue of queues.values()) if (queue.length) out.push(queue.shift()!);
    return out;
  };
  const chosen: Candidate[] = [];
  const perStep = new Map<string, number>();
  const take = (tier: Candidate[]) => {
    for (const candidate of spread(tier)) {
      if (chosen.length >= input.max) return;
      if ((perStep.get(candidate.step) ?? 0) >= 2) continue;
      chosen.push(candidate); perStep.set(candidate.step, (perStep.get(candidate.step) ?? 0) + 1);
    }
  };
  take(wrong); take(fresh);
  // A right answer comes back only once every never-asked taught item is in this tail or was asked before.
  if (fresh.every(c => chosen.includes(c))) take(right);
  const out: Candidate[] = [];
  while (chosen.length) {
    const prev = out.at(-1);
    const index = [chosen.findIndex(c => c.step !== prev?.step && c.conceptId !== prev?.conceptId), chosen.findIndex(c => c.step !== prev?.step), 0].find(i => i >= 0)!;
    out.push(chosen.splice(index, 1)[0]!);
  }
  return out.map(({ item, conceptId, asked }) => ({ item, conceptId, asked }));
}
