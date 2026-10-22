import { describe, expect, it } from 'vitest';
import { contentWords, freshPracticeErrors } from './fresh';

const opt = (id, text, correct = false) => ({ id, text, correct, feedback: 'Because this is the reason it works out.', sourceRefs: ['s'] });
const step = (id) => ({
  id, title: 'A step', claimId: 'c1', sourceRefs: ['s'],
  hook: { stem: 'Prices rise 6% this year. What does ₹250 buy?', options: [opt('a', 'Less than before', true), opt('b', 'More than before')] },
  teach: 'Prices rise, so the same money buys less each year.', visual: { kind: 'flow', nodes: ['Prices rise', 'Money buys less'] },
  example: { ask: 'Tap the cause.', parts: ['Riya pays ₹250 for a basket,', 'prices climb 6%,', 'so the basket costs more.'], spot: 'prices climb 6%,', feedback: 'That is the cause.' },
  guided: [{ stem: 'Bread costs ₹40 and prices rise. What happens?', hint: 'Think about next year.', options: [opt('a', 'Bread costs more', true), opt('b', 'Bread costs less')] }],
  takeaway: 'Rising prices shrink what money buys.',
});
const item = (id, stepId, job, extra = {}) => ({
  id, conceptId: 'inflation', step: stepId, ...(job ? { job } : {}), type: 'choose', stem: 'A shop raises its prices. What follows?', difficultySeed: 1, misconceptionTags: [], sourceRefs: ['s'],
  options: [opt('a', 'Your money buys a bit less', true), opt('b', 'Your money buys a lot more'), opt('c', 'Your money stays worth it')], ...extra,
});
const pack = (change = () => {}) => {
  const concept = { id: 'inflation', title: 'Inflation', rule: 'Prices rise over time.', hook: 'Why does the same note buy less?', claims: [{ id: 'c1', text: 'Prices rise over time.' }], steps: [step('s1'), step('s2')],
    items: [item('i1', 's1', 'transfer'), item('i2', 's1', 'misconception'), item('i3', 's2', 'reverse'), item('i4', 's2', 'edge')] };
  change(concept);
  return { id: 'topic.test', kind: 'topic', body: { modules: [{ id: 'm', concepts: [concept] }] } };
};
const errors = (change) => freshPracticeErrors(pack(change)).join('\n');

describe('spec 16 fresh-practice rules', () => {
  it('a clean stepped idea passes every per-step rule', () => {
    expect(errors()).not.toMatch(/inflation|i\d/);
  });
  it('R1: each practice item has its own job; one recall per idea, never in step 1', () => {
    expect(errors(c => { delete c.items[0].job; })).toContain('i1: needs a practice job');
    expect(errors(c => { c.items[1].job = 'transfer'; })).toContain('i2: job transfer repeats in s1');
    expect(errors(c => { c.items[2].job = 'transfer'; })).toContain('i3: job transfer repeats in inflation');
    expect(errors(c => { c.items[0].job = 'recall'; })).toContain('i1: no plain recall in the first step');
    expect(errors(c => { c.items[2].job = 'recall'; c.items.push(item('i5', 's2', 'recall')); })).toContain('inflation: at most one plain recall item per idea');
  });
  it('each step has exactly 2 practice items (spec 16 §5)', () => {
    expect(errors(c => { c.items.push(item('i5', 's2', 'combine')); })).toContain('inflation.step.s2: 3 practice items; each step needs exactly 2');
    expect(errors(c => { c.items.splice(0, 1); })).toContain('inflation.step.s1: 1 practice items; each step needs exactly 2');
  });
  it('R2: no number or named person from the step lesson', () => {
    expect(errors(c => { c.items[0].stem = 'Prices rise 6% again. What follows?'; })).toContain('i1: reuses 6 from');
    expect(errors(c => { c.items[0].stem = 'A shop near Riya raises prices. What follows?'; })).toContain('i1: reuses Riya from');
    expect(errors(c => { c.items[0].stem = 'A shop in Delhi raises prices by 10%. What follows?'; })).not.toContain('i1: reuses');
    expect(errors(c => { for (const s of c.steps) s.hook.stem = 'Prices rise 0, 1, 2 or 100 times. What does ₹250 buy?'; c.items[0].stem = 'Prices rise 0, 1, 2 or 100 times again. What follows?'; })).not.toContain('i1: reuses');
  });
  it('R3: a match has 3-4 pairs with no shared words', () => {
    const match = (options, answer) => ({ type: 'match', options, answer });
    expect(errors(c => { Object.assign(c.items[0], match([opt('a', 'Rent'), opt('b', 'Housing cost')], [{ left: 'a', right: 'b' }, { left: 'b', right: 'a' }])); })).toContain('i1: a match needs 3-4 pairs (has 1)');
    expect(errors(c => { Object.assign(c.items[0], match([opt('a', 'Paying a shop'), opt('b', 'Needs a shop PIN'), opt('c', 'Rent'), opt('d', 'Housing'), opt('e', 'Fuel'), opt('f', 'Transport')],
      [{ left: 'a', right: 'b' }, { left: 'c', right: 'd' }, { left: 'e', right: 'f' }])); })).toContain('i1: pair a-b shares "shop"');
  });
  it('R4: fill-the-step never asks for the idea\'s own name', () => {
    expect(errors(c => { c.items[0].type = 'fill-the-step'; c.items[0].options[0].text = 'Inflation'; })).toContain("i1: fill-the-step answer repeats the idea's title");
  });
  it('R5: the right answer is not the longest in most questions', () => {
    expect(errors(c => { for (const entry of c.items) entry.options[0].text = 'Your money buys a little bit less than it did a year ago'; for (const s of c.steps) { s.hook.options[0].text = 'Much less than it bought before now'; s.guided[0].options[0].text = 'Bread costs more than it did last year'; } }))
      .toMatch(/topic: the right answer is the longest option in \d+% of questions/);
  });
  it('R5: absolute words do not sit mostly in the wrong options', () => {
    const loaded = c => { for (const entry of c.items) { entry.options[1].text = 'Your money always buys more'; entry.options[2].text = 'Every rupee keeps its worth'; } };
    expect(errors(loaded)).toMatch(/topic: absolute words \(always, never, only, every\.\.\.\) sit mostly in wrong options \(8 in \d+ wrong vs 0 in \d+ right\)/);
    expect(errors(c => { loaded(c); for (const entry of c.items) entry.options[0].text = 'Every rupee always buys less'; })).not.toContain('absolute words');
  });
  it('R6: a hint points without giving the answer', () => {
    expect(errors(c => { c.steps[0].guided[0].hint = 'Bread prices follow the rest.'; })).toContain('s1.guided.0: hint gives the answer away ("bread")');
  });
  it('R7: teach cards give the reason, not the authority', () => {
    expect(errors(c => { c.steps[0].teach = 'Prices rise every year for most goods.'; })).toContain('s1: teach card needs a reason link');
    expect(errors(c => { c.steps[0].teach = 'The RBI says prices rise, so money buys less.'; })).toContain('s1: teach card leans on an authority');
    expect(errors(c => { c.steps[0].teach = 'Since WHO tracks sugar, the limit sits low.'; })).toContain('s1: teach card leans on an authority');
    expect(errors(c => { c.steps[0].teach = 'Prices rise, which means the same note buys less.'; })).not.toContain('s1: teach card');
  });
  it('content words skip short and stop words and fold plurals', () => {
    expect([...contentWords('The prices of the goods, and this rise')]).toEqual(['price', 'good', 'rise']);
  });
});
