import { RULES } from '../../rules.config';
import type { TopicConcept, TopicItem } from '../../../data/packs/schemas';
import { DAY_MS, ENGINE_RULES, INITIAL_MASTERY, itemSeedRating, predictedSuccess, type ConceptState, type ItemState } from './model';
import type { AnswerFact, RetentionDay } from './analytics';

export interface EngineCatalog { concepts: readonly TopicConcept[] }
export interface SelectionContext {
  catalog: EngineCatalog; concepts: Readonly<Record<string, ConceptState>>; items: Readonly<Record<string, ItemState>>;
  now: number; seed: number; recentTypes: readonly TopicItem['type'][]; excludedItemIds?: readonly string[];
  mode?: 'review' | 'new' | 'retention' | 'either'; newConceptId?: string;
  facts?: readonly AnswerFact[]; scheduledRetention?: readonly { conceptId: string; day: RetentionDay }[];
}
export interface Selection { item: TopicItem; concept: TopicConcept; predictedSuccess: number; mode: 'review' | 'new' | 'retention'; retentionDay?: RetentionDay }
const hash = (id: string, seed: number) => {
  let value = seed >>> 0;
  for (const char of id) value = Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0;
  return value / 0x1_0000_0000;
};
export function selectNextItem(context: SelectionContext): Selection | null {
  const byId = context.concepts;
  const excluded = new Set(context.excludedItemIds ?? []);
  const lastTwo = context.recentTypes.slice(-2);
  const lastThree = new Set(context.recentTypes.slice(-3));
  const candidates: (Selection & { score: number })[] = [];
  for (const concept of context.catalog.concepts) {
    const state = byId[concept.id];
    const started = Boolean(state && (state.attempts > 0 || state.mastery > 0));
    const mode = context.mode === 'retention' ? 'retention' : started ? 'review' : 'new';
    if (context.mode && context.mode !== 'either' && context.mode !== mode) continue;
    if (mode === 'new' && (context.newConceptId && concept.id !== context.newConceptId)) continue;
    if (mode === 'new' && concept.prerequisites.some(id => (byId[id]?.mastery ?? 0) < 0.8)) continue;
    if (mode === 'review' && state?.memory && state.memory.dueAt > context.now) continue;
    let retentionDay: RetentionDay | undefined;
    if (mode === 'retention') {
      if (!started || state?.firstLearnedAt === undefined) continue;
      retentionDay = ([7, 30] as const).find(day => context.now >= state.firstLearnedAt! + day * DAY_MS
        && !state.retentionChecks?.[day]
        && !context.facts?.some(fact => fact.kind === 'retention' && fact.conceptId === concept.id && fact.retentionDay === day)
        && !context.scheduledRetention?.some(check => check.conceptId === concept.id && check.day === day));
      if (!retentionDay) continue;
    }
    for (const item of concept.items) {
      if (excluded.has(item.id)) continue;
      const itemState = context.items[item.id];
      if (itemState?.lastSeen !== undefined && context.now - itemState.lastSeen < 2 * DAY_MS) continue;
      if (lastTwo.length === 2 && lastTwo[0] === item.type && lastTwo[1] === item.type) continue;
      const success = predictedSuccess(state?.mastery ?? INITIAL_MASTERY, itemState?.rating ?? itemSeedRating(item.difficultySeed), state?.memory, context.now);
      const [low, high] = ENGINE_RULES.targetSuccess;
      const distance = success < low ? low - success : success > high ? success - high : 0;
      const active = item.misconceptionTags.some(tag => state?.activeMisconceptions.includes(tag));
      // Target band dominates all preferences; seeded tie break is stable.
      const score = distance * 100 + (active ? -0.1 : 0) + hash(item.id, context.seed) * 0.001;
      candidates.push({ item, concept, predictedSuccess: success, mode, retentionDay, score });
    }
  }
  const interleaved = candidates.filter(candidate => !lastThree.has(candidate.item.type));
  const pool = interleaved.length ? interleaved : candidates;
  const [low, high] = ENGINE_RULES.targetSuccess;
  const inBand = pool.filter(candidate => candidate.predictedSuccess >= low && candidate.predictedSuccess <= high);
  const ranked = inBand.length ? inBand : pool;
  ranked.sort((a, b) => a.score - b.score || a.item.id.localeCompare(b.item.id));
  return ranked[0] ?? null;
}

export interface DropItem { itemId: string; conceptId: string; optionOrder: string[]; mode: 'review' | 'new' | 'retention'; retentionDay?: RetentionDay }
export interface Drop { id: string; items: DropItem[]; cursor: number; ending: { kind: 'stopping-screen' } }
export interface ComposeContext extends Omit<SelectionContext, 'recentTypes' | 'excludedItemIds' | 'mode'> {
  spentMinutes: number; answeredToday: number; newToday: number; busyDay?: boolean; afterBedtime?: boolean;
  minutesPerItem?: number; requestedItems?: number;
}
function orderOptions(item: TopicItem, seed: number): string[] {
  return item.options.map(option => option.id).sort((a, b) => hash(`${item.id}:${a}`, seed) - hash(`${item.id}:${b}`, seed));
}
export function composeDrop(context: ComposeContext): Drop {
  const minutesPerItem = context.minutesPerItem ?? 0.7;
  const budgetItems = Math.max(0, Math.floor((RULES.learningTracks.dailyBudgetMin - context.spentMinutes) / minutesPerItem));
  const wanted = context.busyDay ? 3 : Math.min(10, Math.max(6, context.requestedItems ?? 8));
  const limit = Math.max(0, Math.min(wanted, budgetItems));
  const newLimit = context.afterBedtime ? 0 : Math.max(0, Math.min(RULES.learningTracks.newCardsPerDay - context.newToday, Math.round(limit * 0.4)));
  const items: DropItem[] = [];
  const recentTypes: TopicItem['type'][] = [];
  let newConceptId: string | undefined;
  for (let i = 0; i < limit; i++) {
    const newCount = items.filter(item => item.mode === 'new').length;
    const retentionCount = items.filter(item => item.mode === 'retention').length;
    const remaining = limit - i;
    const mode = newCount >= newLimit ? 'review' : newLimit - newCount >= remaining ? 'new' : i % 5 === 3 || i % 5 === 4 ? 'new' : 'review';
    const base = { ...context, seed: context.seed + i, recentTypes, newConceptId, excludedItemIds: items.map(item => item.itemId),
      scheduledRetention: items.filter(item => item.mode === 'retention').map(item => ({ conceptId: item.conceptId, day: item.retentionDay! })) };
    const selected = (retentionCount < 2 ? selectNextItem({ ...base, mode: 'retention' }) : null)
      ?? selectNextItem({ ...base, mode })
      ?? selectNextItem({ ...base, mode: context.afterBedtime || newCount >= newLimit ? 'review' : 'either' });
    if (!selected || (context.afterBedtime && selected.mode === 'new')) break;
    if (selected.mode === 'new') newConceptId = selected.concept.id;
    items.push({ itemId: selected.item.id, conceptId: selected.concept.id, optionOrder: orderOptions(selected.item, context.seed + i), mode: selected.mode, retentionDay: selected.retentionDay });
    recentTypes.push(selected.item.type);
  }
  return { id: `drop:${context.now}:${context.seed}`, items, cursor: 0, ending: { kind: 'stopping-screen' } };
}
export function currentDropStep(drop: Drop): DropItem | Drop['ending'] {
  return drop.items[drop.cursor] ?? drop.ending;
}
export function advanceDrop(drop: Drop): Drop {
  return { ...drop, cursor: Math.min(drop.items.length, drop.cursor + 1) };
}
