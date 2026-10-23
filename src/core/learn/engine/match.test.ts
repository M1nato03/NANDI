import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { TopicItem } from '../../../data/packs/schemas';
import { gradeItem, matchPairKeys } from '.';

// Batch 3 (a): the packs list every match pair both ways, and the drop marks both terms of a pair as used.
// So a learner enters each pair once, in either direction, and must be able to get it right.
const dir = join(process.cwd(), 'content', 'topics');
const matches = readdirSync(dir).filter(file => file.endsWith('.json'))
  .flatMap(file => (JSON.parse(readFileSync(join(dir, file), 'utf8')) as { body: { modules: { concepts: { items: TopicItem[] }[] }[] } }).body.modules)
  .flatMap(module => module.concepts.flatMap(concept => concept.items))
  .filter((item): item is Extract<TopicItem, { type: 'match' }> => item.type === 'match');

/** The pairs as the drop takes them: one tap pair per unordered pair, never reusing a term. */
function enter(item: Extract<TopicItem, { type: 'match' }>, flip: boolean) {
  const used = new Set<string>(), pairs: { left: string; right: string }[] = [];
  for (const pair of item.answer) {
    if (used.has(pair.left) || used.has(pair.right)) continue;
    used.add(pair.left); used.add(pair.right);
    pairs.push(flip ? { left: pair.right, right: pair.left } : pair);
  }
  return pairs;
}

describe('match items', () => {
  it('exist in the packs', () => expect(matches.length).toBeGreaterThan(0));
  it.each(matches.map(item => [item.id, item] as const))('%s can be answered right in either direction', (_id, item) => {
    const pairs = enter(item, false);
    // The drop opens Check once every unordered pair is in, and every option is then used.
    expect(pairs).toHaveLength(matchPairKeys(item.answer).size);
    expect(pairs.length * 2).toBe(item.options.length);
    expect(gradeItem(item, pairs).correct).toBe(true);
    expect(gradeItem(item, enter(item, true)).correct).toBe(true);
  });
  it.each(matches.map(item => [item.id, item] as const))('%s marks a wrong pairing wrong', (_id, item) => {
    const pairs = enter(item, false);
    const [first, second, ...rest] = pairs;
    const swapped = [{ left: first!.left, right: second!.right }, { left: second!.left, right: first!.right }, ...rest];
    expect(gradeItem(item, swapped).correct).toBe(false);
    // A pair entered twice does not stand in for a missing one.
    expect(gradeItem(item, [first!, { left: first!.right, right: first!.left }, ...rest]).correct).toBe(false);
  });
});
