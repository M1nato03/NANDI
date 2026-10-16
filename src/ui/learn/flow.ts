import { composeDrop, type ConceptState, type ItemState, type Drop } from '../../core/learn/engine';
import { dayKey } from '../../core/time';
import { bundledTopicPacks } from '../../data/packs/seed';
import type { TopicConcept, TopicItem } from '../../data/packs/schemas';
import type { LearnConceptRow, LearnItemRow } from '../../data/types';

export const topics = bundledTopicPacks;
export const selectedTopicKey = 'learn.selectedTopics';
export const dailyDropId = (now: number) => `drop:daily:${dayKey(now)}`;
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
export function makeDrop(input: { ids: string[]; concepts: LearnConceptRow[]; items: LearnItemRow[]; now: number; daily: boolean; answeredToday: number; newToday: number; spentMinutes: number; facts: import('../../core/learn/engine').AnswerFact[] }): Drop {
  const conceptState = Object.fromEntries(input.concepts.filter(row => !row.deleted).map(row => [row.id, { ...row, conceptId: row.id } satisfies ConceptState]));
  const itemState = Object.fromEntries(input.items.filter(row => !row.deleted).map(row => [row.id, { ...row, itemId: row.id } satisfies ItemState]));
  const drop = composeDrop({ catalog: { concepts: catalogFor(input.ids) }, concepts: conceptState, items: itemState,
    now: input.now, seed: input.now % 1_000_000, requestedItems: 5, spentMinutes: input.spentMinutes,
    answeredToday: input.answeredToday, newToday: input.newToday, facts: input.facts });
  return { ...drop, id: input.daily ? dailyDropId(input.now) : `drop:practice:${input.now}` };
}
