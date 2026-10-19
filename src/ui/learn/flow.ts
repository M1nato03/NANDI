import { composeConceptPractice, composeDrop, type ConceptState, type ItemState, type Drop } from '../../core/learn/engine';
import { dailyDropId, nightDropId } from './dropIds';
import { bundledTopicPacks } from '../../data/packs/seed';
import type { TopicConcept, TopicItem } from '../../data/packs/schemas';
import type { LearnConceptRow, LearnItemRow } from '../../data/types';
import { isAfterBedtime } from '../../core/time';
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
export function reviewsOnlyRemainder(drop: Drop): Drop {
  const remaining = drop.items.slice(drop.cursor);
  if (!remaining.some(item => item.mode === 'new')) return drop;
  return { ...drop, items: [...drop.items.slice(0, drop.cursor), ...remaining.filter(item => item.mode !== 'new')] };
}
export function makeDrop(input: { ids: string[]; concepts: LearnConceptRow[]; items: LearnItemRow[]; now: number; daily: boolean; night?: boolean; itemCount?: number; preferredConceptId?: string; reviewDue?: boolean; bedtime?: string; answeredToday: number; newToday: number; spentMinutes: number; facts: import('../../core/learn/engine').AnswerFact[] }): Drop {
  const conceptState = Object.fromEntries(input.concepts.filter(row => !row.deleted).map(row => [row.id, { ...row, conceptId: row.id } satisfies ConceptState]));
  const itemState = Object.fromEntries(input.items.filter(row => !row.deleted).map(row => [row.id, { ...row, itemId: row.id } satisfies ItemState]));
  const catalog = catalogFor(input.ids);
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
  const drop = input.preferredConceptId && !afterBedtime ? composeConceptPractice(context, input.preferredConceptId) : composeDrop(context);
  return { ...drop, id: input.night ? nightDropId(input.now) : input.daily ? dailyDropId(input.now) : `drop:practice:${input.now}` };
}
