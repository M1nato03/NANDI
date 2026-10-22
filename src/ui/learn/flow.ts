import { composeConceptPractice, composeDrop, orderOptions, type ConceptState, type DropItem, type ItemState, type Drop } from '../../core/learn/engine';
import { findStep, goldItems, interleave, lessonItemId, nextStep, practiceTail, taughtCatalog, type TailAnswer } from '../../core/learn/steps';
import { dailyDropId, nightDropId } from './dropIds';
import { bundledTopicPacks } from '../../data/packs/seed';
import type { TopicConcept, TopicItem } from '../../data/packs/schemas';
import type { LearnConceptRow, LearnItemRow } from '../../data/types';
import { dayKey, isAfterBedtime } from '../../core/time';
import { RULES } from '../../core/rules.config';

export const topics = bundledTopicPacks;
export const selectedTopicKey = 'learn.selectedTopics';
export { dailyDropId, nightDropId };
export function chosenTopics(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && topics.some(pack => pack.body.topic.id === id)) : [];
}
export function catalogFor(ids: readonly string[]): TopicConcept[] {
  return topics.filter(pack => ids.includes(pack.body.topic.id)).flatMap(pack => pack.body.modules.flatMap(module => module.concepts));
}
export function findItem(concepts: readonly TopicConcept[], id: string): { item: TopicItem; concept: TopicConcept } | undefined {
  for (const concept of concepts) {
    const item = concept.items.find(candidate => candidate.id === id);
    if (item) return { item, concept };
  }
}
/** Preserve answered steps and feedback, but remove unsolved new ideas at bedtime. */
/** A saved drop can outlive a content update (the inflation rebuild removed old ids): drop the unanswered steps that no longer exist. */
export function withoutMissing(drop: Drop, concepts: readonly TopicConcept[]): Drop {
  if (drop.pendingFeedback) return drop;
  const items = drop.items.filter((entry, index) => index < drop.cursor || (entry.lesson ? !!findStep(concepts, entry.lesson) : !!findItem(concepts, entry.itemId)));
  return items.length === drop.items.length ? drop : { ...drop, items };
}
export function reviewsOnlyRemainder(drop: Drop): Drop {
  const remaining = drop.items.slice(drop.cursor);
  if (!remaining.some(item => item.mode === 'new')) return drop;
  return { ...drop, items: [...drop.items.slice(0, drop.cursor), ...remaining.filter(item => item.mode !== 'new')] };
}
export function makeDrop(input: { ids: string[]; concepts: LearnConceptRow[]; items: LearnItemRow[]; now: number; daily: boolean; night?: boolean; itemCount?: number; preferredConceptId?: string; goldReview?: boolean; reviewDue?: boolean; bedtime?: string; answeredToday: number; newToday: number; spentMinutes: number; facts: import('../../core/learn/engine').AnswerFact[]; taughtSteps?: readonly string[]; taughtOn?: Readonly<Record<string, string>>; lessonToday?: boolean; answers?: readonly TailAnswer[] }): Drop {
  const conceptState = Object.fromEntries(input.concepts.filter(row => !row.deleted).map(row => [row.id, { ...row, conceptId: row.id } satisfies ConceptState]));
  const itemState = Object.fromEntries(input.items.filter(row => !row.deleted).map(row => [row.id, { ...row, itemId: row.id } satisfies ItemState]));
  const fullCatalog = catalogFor(input.ids);
  // Spec 14: items of a stepped concept are quiz material only once their step has been taught.
  // Spec 16 §5: and only from the day after, so a step's own questions are spaced, never asked
  // straight after its lesson (a step with no recorded day counts as taught before today).
  const taught = new Set(input.taughtSteps ?? []);
  const today = dayKey(input.now);
  const catalog = taughtCatalog(fullCatalog, new Set([...taught].filter(stepId => (input.taughtOn?.[stepId] ?? '') < today)));
  const lesson = (conceptId?: string): DropItem[] | undefined => {
    const next = nextStep(fullCatalog, taught, conceptId);
    if (!next) return undefined;
    return [{ itemId: lessonItemId(next.step.id), conceptId: next.concept.id, optionOrder: [], mode: 'new', lesson: next.step.id }];
  };
  if (input.goldReview && input.preferredConceptId) {
    // Gold review tests a mastered idea as a whole, once every step was taught on an earlier day;
    // until then the idea's practice below teaches the next step first.
    const concept = fullCatalog.find(row => row.id === input.preferredConceptId);
    const pool = concept && goldItems(concept, input.taughtOn ?? {}, today);
    if (concept && pool) return { id: `drop:gold:${concept.id}:${input.now}`, cursor: 0, ending: { kind: 'stopping-screen' },
      items: [...pool].sort((a, b) => b.difficultySeed - a.difficultySeed || a.id.localeCompare(b.id)).slice(0, RULES.gamify.goldReviewItems)
        .map(item => ({ itemId: item.id, conceptId: concept.id, optionOrder: item.options.map(option => option.id), mode: 'review' as const })) };
  }
  const afterBedtime = isAfterBedtime(input.now, input.bedtime ?? RULES.night.defaultBedtime);
  const due = input.reviewDue || afterBedtime ? catalog.filter(concept => {
    const state = conceptState[concept.id];
    return !!state && ((!!state.memory && state.memory.dueAt <= input.now) || ([7, 30] as const).some(day =>
      !!state.firstLearnedAt && input.now >= state.firstLearnedAt + day * 86_400_000 && !state.retentionChecks?.[day]));
  }) : catalog;
  const context = { catalog: { concepts: afterBedtime && input.preferredConceptId ? due.filter(concept => concept.id === input.preferredConceptId) : due }, concepts: conceptState, items: itemState,
    now: input.now, seed: input.now % 1_000_000, requestedItems: input.itemCount ?? 5, spentMinutes: input.night || !input.daily ? 0 : input.spentMinutes,
    answeredToday: input.night || !input.daily ? 0 : input.answeredToday, newToday: input.night || !input.daily ? 0 : input.newToday,
    afterBedtime, facts: input.facts };
  const id = input.night ? nightDropId(input.now) : input.daily ? dailyDropId(input.now) : `drop:practice:${input.now}`;
  if (!afterBedtime && !input.night) {
    // Practising an idea that still has an untaught step teaches that step first.
    const taughtFirst = input.preferredConceptId ? lesson(input.preferredConceptId) : input.daily && !input.lessonToday ? lesson() : undefined;
    if (taughtFirst) {
      // Spec 16 §5: the lesson, then your turn on OTHER ideas (earlier steps, due or not yet asked),
      // mixed so no two in a row share an idea. A brand-new learner with nothing earlier ends after the lesson.
      if (!input.preferredConceptId) {
        // Spec 16 §6: the daily tail draws up to 3 questions from every step taught on an earlier day,
        // wrong answers first, then never-asked items; a right answer is not asked again while one is unasked.
        const tail = practiceTail({ catalog: fullCatalog, taughtOn: Object.fromEntries([...taught].map(stepId => [stepId, input.taughtOn?.[stepId] ?? '0000-00-00'])),
          today, answers: input.answers ?? [], started: new Set(Object.keys(conceptState)), max: RULES.learningTracks.lessonReviews })
          .map(pick => ({ itemId: pick.item.id, conceptId: pick.conceptId, optionOrder: orderOptions(pick.item, input.now % 1_000_000), mode: pick.asked ? 'review' as const : 'new' as const }));
        return { id, items: [...taughtFirst, ...tail], cursor: 0, ending: { kind: 'stopping-screen' } };
      }
      const pool = catalog.some(concept => concept.id === input.preferredConceptId) ? composeConceptPractice(context, input.preferredConceptId).items : [];
      // Only ideas met on an earlier day (a stepped idea with a step taught before today, or an unstepped
      // one already started), at most one question per idea, so a brand-new learner ends on "Done".
      const earlier = new Set(catalog.filter(concept => concept.steps?.length || conceptState[concept.id]).map(concept => concept.id));
      const seen = new Set<string>();
      const tail = interleave(pool.filter(item => !item.lesson && earlier.has(item.conceptId)))
        .filter(item => !seen.has(item.conceptId) && !!seen.add(item.conceptId)).slice(0, RULES.learningTracks.lessonReviews);
      return { id, items: [...taughtFirst, ...tail], cursor: 0, ending: { kind: 'stopping-screen' } };
    }
  }
  const drop = input.preferredConceptId && !afterBedtime && catalog.some(row => row.id === input.preferredConceptId) ? composeConceptPractice(context, input.preferredConceptId) : composeDrop(context);
  return { ...drop, items: interleave(drop.items), id };
}
