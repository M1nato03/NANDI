import { describe, expect, it } from 'vitest';
import { askLineFor, askLineProblems, askMessage } from './askLine';

type Concept = { id: string; title: string; askLine?: string; items: { options: { text: string; correct: boolean }[] }[] };
const concept = (askLine?: string): Concept => ({ id: 'lift', title: 'Lift', askLine, items: [{ options: [{ text: 'Air pushes the wing up.', correct: true }, { text: 'The engine pulls it.', correct: false }] }, { options: [{ text: 'Down.', correct: true }, { text: 'Up.', correct: false }] }] });

describe('askLine validator (spec 19 E)', () => {
  it('accepts a short, answer-free question', () => {
    expect(askLineProblems(concept('A paper plane has no engine. So what keeps it up in the air while it glides?'))).toEqual([]);
    expect(askLineProblems(concept())).toEqual([]);
  });
  it('needs a question mark at the end and at most 140 characters', () => {
    expect(askLineProblems(concept('What keeps a paper plane up.'))).toEqual(['askLine must end with "?"']);
    expect(askLineProblems(concept(`${'Why '.repeat(35)}?`))).toContain('askLine is longer than 140 characters');
  });
  it('rejects a line that contains a right answer, ignoring case and punctuation, but not a wrong one', () => {
    expect(askLineProblems(concept('Is it true that AIR pushes the wing up?'))).toEqual(['askLine contains the right answer "Air pushes the wing up."']);
    expect(askLineProblems(concept('Which way does weight point: down or up?'))).toEqual(['askLine contains the right answer "Down."']);
    expect(askLineProblems(concept('Does the engine pull it?'))).toEqual([]);
    // Whole words only: "downtown" is not "down".
    expect(askLineProblems(concept('Can a paper plane fly downtown?'))).toEqual([]);
  });
  it("rejects the idea's key term (its title)", () => {
    expect(askLineProblems(concept('What makes lift on a wing?'))).toEqual(['askLine names the key term "Lift"']);
  });
});

describe('Ask someone', () => {
  it('sends the fixed message with a plain link', () => {
    expect(askMessage('What keeps a paper plane up?')).toBe('Quick one: What keeps a paper plane up? Guess, then ask me. I learned it on NANDI today. nandi.nandi11.workers.dev');
  });
  it('offers the first idea met today that has an askLine; none means no button', () => {
    const now = new Date(2026, 10, 5, 12).getTime();
    const earlier = new Date(2026, 10, 1, 12).getTime();
    const touched = [{ id: 'a', askLine: 'A?' }, { id: 'b' }, { id: 'c', askLine: 'C?' }, { id: 'd', askLine: 'D?' }];
    const states = [{ id: 'a', firstLearnedAt: earlier }, { id: 'b', firstLearnedAt: now }, { id: 'c', firstLearnedAt: now }, { id: 'd', firstLearnedAt: now }];
    expect(askLineFor(touched, states, now)).toBe('C?');
    expect(askLineFor(touched, states, now, ['a'])).toBe('A?');
    expect(askLineFor([{ id: 'b' }], states, now)).toBeUndefined();
    expect(askLineFor(touched, [{ id: 'c', firstLearnedAt: now, deleted: 1 }], now)).toBeUndefined();
  });
});
