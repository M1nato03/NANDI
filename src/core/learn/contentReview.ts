import { weekKey } from '../quests';
import type { TopicItem, TopicPack } from '../../data/packs/schemas';
import { RULES } from '../rules.config';

export const contentReviewKey = (itemId: string) => `learn.contentReview:${itemId}`;

export type ReviewSample = { topic: string; module: string; item: TopicItem; sources: { title: string; publisher: string; year: number; url: string }[] };

function hash(value: string): number {
  let result = 2166136261;
  for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
  return result >>> 0;
}

/** Five stable items per installed module for the current ISO week. */
export function weeklyContentSample(packs: readonly TopicPack[], now: number): ReviewSample[] {
  const week = weekKey(now);
  return packs.flatMap(pack => pack.body.modules.flatMap(module =>
    module.concepts.flatMap(concept => concept.items.map(item => ({
      topic: pack.title, module: module.title, item,
      sources: concept.sources.filter(source => item.sourceRefs.includes(source.id)),
    })))
      .sort((a, b) => hash(`${week}:${module.id}:${a.item.id}`) - hash(`${week}:${module.id}:${b.item.id}`) || a.item.id.localeCompare(b.item.id))
      .slice(0, RULES.teachingEngine.contentReviewSamplePerModule)));
}
