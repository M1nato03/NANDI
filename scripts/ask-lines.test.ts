import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { askLineProblems } from '../src/core/learn/askLine';

type Concept = { id: string; title: string; askLine?: string; items: { options: { text: string; correct: boolean }[] }[] };
describe('shipped askLines', () => {
  const packs = readdirSync('content/topics').filter(name => name.endsWith('.json')).map(name => JSON.parse(readFileSync(`content/topics/${name}`, 'utf8')) as { body: { modules: { concepts: Concept[] }[] } });
  it('one per topic, on the first idea of its first module, each answer-free', () => {
    expect(packs).toHaveLength(6);
    for (const pack of packs) {
      const lines = pack.body.modules.flatMap(module => module.concepts).filter(item => item.askLine);
      expect(lines.map(item => item.id)).toEqual([pack.body.modules[0]!.concepts[0]!.id]);
      expect(askLineProblems(lines[0]!), lines[0]!.id).toEqual([]);
    }
  });
});
