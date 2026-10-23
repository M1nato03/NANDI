import type { TopicItem } from '../../../data/packs/schemas';
import { RULES } from '../../rules.config';
import type { RetentionDay } from './analytics';

export type Confidence = 'guess' | 'fairly-sure' | 'certain';
export interface MemoryState { stability: number; difficulty: number; interval: number; lastReview: number; dueAt: number }
export interface ConceptState { conceptId: string; mastery: number; memory?: MemoryState; attempts: number; firstLearnedAt?: number;
  retentionChecks?: Partial<Record<RetentionDay, { answeredAt: number; correct: boolean }>>; activeMisconceptions: string[] }
export interface ItemState { itemId: string; rating: number; attempts: number; lastSeen?: number }
export const INITIAL_MASTERY = 0.2;
export const DAY_MS = 86_400_000;
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
export type ItemAnswer = string | string[] | { left: string; right: string }[] | number;
/** Unordered pair keys, so a→b and b→a are one pair. */
export const matchPairKeys = (pairs: readonly { left: string; right: string }[]): Set<string> =>
  new Set(pairs.map(pair => [pair.left, pair.right].sort().join('\u0000')));
export function gradeItem(item: TopicItem, answer: ItemAnswer): { correct: boolean; score: number } {
  if (item.type === 'estimate') {
    if (typeof answer !== 'number' || !Number.isFinite(answer)) return { correct: false, score: 0 };
    const { value, min, max } = item.answer;
    const span = Math.max(1e-9, value - min, max - value);
    const correct = answer >= min && answer <= max;
    return { correct, score: correct ? clamp(1 - 0.5 * Math.abs(answer - value) / span, 0, 1) : 0 };
  }
  if (item.type === 'order') {
    const correct = Array.isArray(answer) && answer.every(value => typeof value === 'string')
      && answer.length === item.answer.length && answer.every((value, index) => value === item.answer[index]);
    return { correct, score: Number(correct) };
  }
  if (item.type === 'match') {
    // A pair has no direction: the packs list each pair both ways (a→b and b→a), and the learner enters it once.
    const expected = matchPairKeys(item.answer);
    const actual = Array.isArray(answer) && answer.every(pair => typeof pair === 'object' && pair !== null && 'left' in pair && 'right' in pair)
      ? matchPairKeys(answer as { left: string; right: string }[]) : new Set<string>();
    const correct = Array.isArray(answer) && answer.length === expected.size && actual.size === expected.size && [...actual].every(pair => expected.has(pair));
    return { correct, score: Number(correct) };
  }
  const correct = typeof answer === 'string' && item.options.some(option => option.id === answer && option.correct);
  return { correct, score: Number(correct) };
}

export const ENGINE_RULES = {
  bkt: RULES.teachingEngine.bkt satisfies Record<TopicItem['type'], readonly [number, number]>,
  learn: RULES.teachingEngine.learn, masteryBounds: [0.001, 0.999] as const,
  eloK: RULES.teachingEngine.eloK, eloBounds: [400, 2400] as const,
  targetSuccess: RULES.teachingEngine.targetSuccess,
};

/** Editorial levels are stored as 1-3; legacy packs still contain Elo seeds. */
export const itemSeedRating = (seed: number): number => seed === 1 ? 800 : seed === 2 ? 950 : seed === 3 ? 1100 : seed;

export function updateMastery(prior: number, type: TopicItem['type'], correct: boolean): number {
  const [slip, guess] = ENGINE_RULES.bkt[type];
  const p = clamp(prior, ...ENGINE_RULES.masteryBounds);
  const posterior = correct
    ? p * (1 - slip) / (p * (1 - slip) + (1 - p) * guess)
    : p * slip / (p * slip + (1 - p) * (1 - guess));
  return clamp(posterior + (1 - posterior) * ENGINE_RULES.learn, ...ENGINE_RULES.masteryBounds);
}

/** FSRS-4.5 DSR equations and 17 default weights, with R=(1+19t/81S)^-0.5.
 * Source: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm/bc401d9ed5093c66358738f4b8834f8d24ab211b
 * Each concept is treated as one memory trace; binary answers map to grades 1/3.
 */
export const FSRS45_WEIGHTS = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61] as const;
const w = FSRS45_WEIGHTS;
const fsrsClamp = (value: number) => clamp(value, 1, 10);
export function retrievability(memory: MemoryState, now: number): number {
  const days = Math.max(0, (now - memory.lastReview) / DAY_MS);
  return Math.pow(1 + (19 / 81) * days / memory.stability, -0.5);
}
export function fsrsInterval(stability: number, retention = 0.9): number {
  return Math.max(0, stability / (19 / 81) * (Math.pow(retention, -2) - 1));
}
export function updateMemory(previous: MemoryState | undefined, correct: boolean, confidence: Confidence, now: number): MemoryState {
  const grade = correct ? 3 : 1;
  let stability: number;
  let difficulty: number;
  if (!previous) {
    stability = w[grade - 1]!;
    difficulty = fsrsClamp(w[4] - (grade - 3) * w[5]);
  } else {
    const r = retrievability(previous, now);
    const d = previous.difficulty;
    const s = previous.stability;
    difficulty = fsrsClamp(w[7] * w[4] + (1 - w[7]) * (d - w[6] * (grade - 3)));
    stability = correct
      ? s * (1 + Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp(w[10] * (1 - r)) - 1))
      : Math.min(s, w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp(w[14] * (1 - r)));
  }
  stability = Math.max(0.1, stability);
  // A confident miss is a calibration signal, so ask again sooner.
  const interval = Math.max(0.1, fsrsInterval(stability) * (!correct && confidence === 'certain' ? 0.5 : 1));
  return { stability, difficulty, interval, lastReview: now, dueAt: now + interval * DAY_MS };
}

export function predictedSuccess(mastery: number, itemRating: number, memory?: MemoryState, now = 0): number {
  const p = clamp(mastery, 0.01, 0.99);
  const ability = 1000 + 400 * Math.log10(p / (1 - p));
  const elo = 1 / (1 + Math.pow(10, (itemRating - ability) / 400));
  return clamp(elo * (memory ? retrievability(memory, now) : 1), 0.001, 0.999);
}
export function updateItemRating(state: ItemState | undefined, seed: number, mastery: number, correct: boolean, now: number): ItemState {
  const rating = state?.rating ?? seed;
  const expected = predictedSuccess(mastery, rating);
  // Item rating rises when an unexpected miss exposes a harder item.
  return { itemId: state?.itemId ?? '', rating: clamp(rating + ENGINE_RULES.eloK * (expected - Number(correct)), ...ENGINE_RULES.eloBounds), attempts: (state?.attempts ?? 0) + 1, lastSeen: now };
}
export function answerConcept(state: ConceptState | undefined, item: TopicItem, correct: boolean, confidence: Confidence, now: number): ConceptState {
  const misconceptions = new Set(state?.activeMisconceptions ?? []);
  for (const tag of item.misconceptionTags) {
    if (correct) misconceptions.delete(tag);
    else misconceptions.add(tag);
  }
  return { conceptId: item.conceptId, mastery: updateMastery(state?.mastery ?? INITIAL_MASTERY, item.type, correct),
    memory: updateMemory(state?.memory, correct, confidence, now), attempts: (state?.attempts ?? 0) + 1,
    firstLearnedAt: state?.firstLearnedAt ?? now, retentionChecks: state?.retentionChecks,
    activeMisconceptions: [...misconceptions].sort() };
}
export type MasteryMapState = 'Not started' | 'Learning' | 'Strong' | 'Mastered';
export function masteryMapState(state?: Pick<ConceptState, 'attempts' | 'mastery' | 'memory'>): MasteryMapState {
  if (!state?.attempts) return 'Not started';
  if (state.mastery >= 0.95 && (state.memory?.stability ?? 0) >= 21) return 'Mastered';
  return state.mastery >= 0.8 ? 'Strong' : 'Learning';
}
