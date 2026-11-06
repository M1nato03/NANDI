import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as v from 'valibot';
import { packSchema, type TopicPack } from '../../../src/data/packs/schemas.ts';

export const questionTypes = ['choose', 'estimate', 'order', 'match', 'why', 'true-not-quite', 'scenario'] as const;
export type QuestionFitFixture = { type: typeof questionTypes[number]; size: 'shortest' | 'longest'; id: string; stemLength: number };

// Mirror seed.ts: all JSON under content/, schema-validated, then keep topic packs only.
export const questionFitPacks = readdirSync('content', { recursive: true, encoding: 'utf8' }).filter(path => path.endsWith('.json')).sort().flatMap(path => {
  const result = v.safeParse(packSchema, JSON.parse(readFileSync(resolve('content', path), 'utf8')));
  return result.success && result.output.kind === 'topic' ? [result.output as TopicPack] : [];
});
export const bundledItems = questionFitPacks.flatMap(pack => pack.body.modules.flatMap(module => module.concepts.flatMap(concept => concept.items)));

/** Stem length is JS string.length, as in LearnDrop. Break ties by id so fixtures and shots stay repeatable. */
export function questionFitExtremes(): QuestionFitFixture[] {
  return questionTypes.flatMap(type => {
    const items = bundledItems.filter(item => item.type === type).sort((a, b) => a.stem.length - b.stem.length || a.id.localeCompare(b.id, 'en'));
    const shortest = items[0], longest = items.at(-1);
    if (!shortest || !longest) throw new Error(`No bundled questions for ${type}`);
    return [{ type, size: 'shortest', id: shortest.id, stemLength: shortest.stem.length },
      { type, size: 'longest', id: longest.id, stemLength: longest.stem.length }];
  });
}
