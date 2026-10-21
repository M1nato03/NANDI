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

/** What the selector may draw from: stepped concepts keep only items of taught steps, and drop out until one is taught. */
export function taughtCatalog(concepts: readonly TopicConcept[], taught: ReadonlySet<string>): TopicConcept[] {
  return concepts.flatMap(concept => {
    if (!concept.steps) return [concept];
    const items = concept.items.filter(item => item.step && taught.has(item.step));
    return items.length ? [{ ...concept, items }] : [];
  });
}

/** Your-turn items for a step: the easiest first, at most two. */
export function stepPractice(concept: TopicConcept, stepId: string, limit = 2) {
  return concept.items.filter(item => item.step === stepId)
    .sort((a, b) => a.difficultySeed - b.difficultySeed || a.id.localeCompare(b.id)).slice(0, limit);
}

/**
 * Spec 14 kill test: guided first tries should land at 85–95% and your-turn answers near 80%.
 * Your-turn answers are the answers in a lesson's own drop to items of that lesson's step.
 */
export function lessonMetrics(ledger: readonly { kind: string; deleted: number; refId: string; inputs: Record<string, unknown> }[], stepOf: (itemId: string) => string | undefined) {
  const lessons = ledger.filter(row => row.kind === 'learn-lesson' && !row.deleted);
  const guided = lessons.flatMap(row => Array.isArray(row.inputs.guidedFirstTry) ? row.inputs.guidedFirstTry as boolean[] : []);
  const own = ledger.filter(row => row.kind === 'learn-answer' && !row.deleted && lessons.some(lesson =>
    lesson.inputs.dropId === row.inputs.dropId && stepOf(String(row.inputs.itemId)) === lesson.refId));
  const share = (values: readonly boolean[]) => values.length ? Math.round(100 * values.filter(Boolean).length / values.length) : null;
  return { lessons: lessons.length, guidedFirstTry: share(guided), guidedCount: guided.length, yourTurn: share(own.map(row => row.inputs.correct === true)), yourTurnCount: own.length };
}
