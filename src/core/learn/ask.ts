import type { TopicItem } from '../../data/packs/schemas';

/**
 * Spec 13 K: the line above a question says what to do, in plain words.
 * The raw item type ("true not quite", "fill the step") never reaches the screen.
 */
export const ASK: Record<TopicItem['type'], string> = {
  predict: 'What happens next?',
  choose: 'Pick the best answer',
  scenario: 'Pick the best answer',
  why: 'Why?',
  'fill-the-step': 'Fill the gap',
  'true-not-quite': 'Spot the mistake',
  'explain-it-back': 'Pick the simplest way to say it',
  order: 'Put in order',
  match: 'Match the pairs',
  estimate: 'Guess the number',
};

export const askFor = (type: TopicItem['type']): string => ASK[type];
