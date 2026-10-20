import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Machine checks for the teaching quality of topic packs (spec 09 §4): each wrong option must
// say why it is wrong, and questions must not be templated. Packs made from 2026-10-20 on also
// need real choices and real numbers, because a two-option counting quiz teaches nothing.

interface Option { text: string; feedback: string; correct?: boolean }
interface Item { id: string; type: string; stem: string; difficultySeed: number; options?: Option[]; answer?: { unit?: string } }
interface Pack { id: string; createdAt: string; body: { modules: { concepts: { items: Item[] }[] }[] } }

const dir = join(process.cwd(), 'content', 'topics');
const packs: Pack[] = readdirSync(dir).filter(name => name.startsWith('topic.') && name.endsWith('.json'))
  .map(name => JSON.parse(readFileSync(join(dir, name), 'utf8')) as Pack);
const itemsOf = (pack: Pack) => pack.body.modules.flatMap(module => module.concepts.flatMap(concept => concept.items));
const firstSentence = (text: string) => text.split(/(?<=[.!?])\s/)[0]!.trim().toLowerCase();
const strict = (pack: Pack) => pack.createdAt >= '2026-10-20';
const choiceTypes = new Set(['predict', 'scenario', 'choose', 'why', 'true-not-quite', 'estimate', 'fill-the-step']);

describe.each(packs.map(pack => [pack.id, pack] as const))('%s', (_id, pack) => {
  const items = itemsOf(pack);

  it('gives every wrong option its own reason', () => {
    const wrong = items.flatMap(item => (item.options ?? []).filter(option => !option.correct).map(option => ({ item, option })));
    const openers = new Map<string, number>();
    for (const { option } of wrong) openers.set(firstSentence(option.feedback), (openers.get(firstSentence(option.feedback)) ?? 0) + 1);
    expect([...openers].filter(([, count]) => count > 3).map(([opener]) => opener)).toEqual([]);
    const echoes = wrong.filter(({ item, option }) => {
      const right = item.options?.find(candidate => candidate.correct)?.feedback.replace(/^yes\.\s*/i, '').trim().toLowerCase();
      return !!right && right.length > 20 && option.feedback.toLowerCase().includes(right);
    }).map(({ item }) => item.id);
    expect(echoes).toEqual([]);
  });

  it.runIf(strict(pack))('does not open many questions the same way', () => {
    const openers = new Map<string, number>();
    for (const item of items) { const key = item.stem.split(/\s+/).slice(0, 3).join(' ').toLowerCase(); openers.set(key, (openers.get(key) ?? 0) + 1); }
    expect([...openers].filter(([, count]) => count > 4).map(([opener]) => opener)).toEqual([]);
  });

  it.runIf(strict(pack))('offers real choices: three or more options from difficulty 2 up', () => {
    const thin = items.filter(item => choiceTypes.has(item.type) && item.difficultySeed >= 2 && (item.options?.length ?? 0) < 3).map(item => item.id);
    expect(thin).toEqual([]);
  });

  it.runIf(strict(pack))('estimates a sourced quantity, not a count of words in the question', () => {
    const counts = items.filter(item => item.type === 'estimate' && (!item.answer?.unit || item.answer.unit === 'count')).map(item => item.id);
    expect(counts).toEqual([]);
  });
});

// The full pack validator (readability, feedback length, sources) as a test, so it also runs where tsx cannot.
it('passes the pack validator', async () => {
  const { validateAll } = await import('./validate-packs');
  expect(await validateAll()).toEqual([]);
}, 60_000);
