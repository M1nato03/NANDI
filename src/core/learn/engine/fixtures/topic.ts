import type { TopicPack } from '../../../../data/packs/schemas';

const source = { id: 's1', title: 'How Seeds Grow', publisher: 'Garden Lab', year: 2024, url: 'https://example.org/seeds' };
const option = (id: string, label: string, correct: boolean) => ({ id, text: label, correct, feedback: correct ? 'Yes, that is right.' : 'Try the next idea.', sourceRefs: ['s1'] });
const base = (id: string, conceptId: string, difficultySeed: number) => ({ id, conceptId, stem: 'What can you see next?', difficultySeed, misconceptionTags: ['m1'], sourceRefs: ['s1'] });
const first = {
  id: 'seed', title: 'Seeds and water', prerequisites: [], hook: 'A dry seed can sit in a jar.', hookSourceRefs: ['s1'],
  rule: 'A seed needs water to start to grow.', ruleSourceRefs: ['s1'],
  claims: [{ id: 'c1', text: 'A seed needs water to grow.', sourceRefs: ['s1'] }],
  sources: [source], misconceptions: [{ id: 'm1', name: 'Dry seed', correction: 'A dry seed will wait.', sourceRefs: ['s1'] }],
  factCheck: { verdicts: [{ claimId: 'c1', verdict: 'supported' as const }] },
  items: [
    { ...base('i1', 'seed', 500), type: 'predict' as const, options: [option('a', 'It may grow.', true), option('b', 'It may fly.', false)] },
    { ...base('i2', 'seed', 650), type: 'choose' as const, options: [option('a', 'Add some water.', true), option('b', 'Add a rock.', false)] },
    { ...base('i3', 'seed', 800), type: 'estimate' as const, options: [option('a', 'One day.', false), option('b', 'Ten days.', false)], answer: { value: 5, min: 3, max: 7, unit: 'days' } },
  ],
};
const second = {
  id: 'sprout', title: 'New leaves', prerequisites: ['seed'], hook: 'A small leaf can rise from soil.', hookSourceRefs: ['s1'],
  rule: 'Light can help a leaf make food.', ruleSourceRefs: ['s1'],
  claims: [{ id: 'c2', text: 'A leaf can use light to make food.', sourceRefs: ['s1'] }],
  sources: [source], misconceptions: [{ id: 'm1', name: 'No light', correction: 'A leaf can use light.', sourceRefs: ['s1'] }],
  factCheck: { verdicts: [{ claimId: 'c2', verdict: 'supported' as const }] },
  items: [
    { ...base('i4', 'sprout', 500), type: 'why' as const, options: [option('a', 'Light can help.', true), option('b', 'A rock can help.', false)] },
    { ...base('i5', 'sprout', 650), type: 'order' as const, options: [option('a', 'Add water.', false), option('b', 'See a leaf.', false)], answer: ['a', 'b'] },
    { ...base('i6', 'sprout', 800), type: 'scenario' as const, options: [option('a', 'Set it near light.', true), option('b', 'Put it in a box.', false)] },
  ],
};
export const fixtureTopic: TopicPack = {
  id: 'topic.seed-lab', version: '1.0.0', schema: 1, minAppVersion: '0.1.0', title: 'Seed lab', author: 'jenil',
  createdAt: '2026-10-11T00:00:00.000Z', kind: 'topic', body: { topic: { id: 'seed-lab', title: 'Seed lab' }, modules: [{ id: 'growth', title: 'How seeds grow', concepts: [first, second] }] },
};
