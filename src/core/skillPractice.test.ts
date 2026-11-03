import { describe, expect, it } from 'vitest';
import { addDays, checkAnswer, nextRetry, normalize, stepLoop, type LoopState, type NarrowCheck } from './skillPractice';

const choice: NarrowCheck = { kind: 'choice', options: ['Could you send the notes?', 'I was ill.', 'Hi!'], accepted: ['Could you send the notes?'],
  nearMisses: [{ answer: 'I was ill.', feedback: 'That is the reason. Put the ask first.' }], feedback: { right: 'Yes.', wrong: 'Start with the ask.' } };
const phrase: NarrowCheck = { kind: 'phrase', accepted: ['6 pm', '6 p.m.'], nearMisses: [{ answer: '6', feedback: 'Add pm.' }], feedback: { right: 'Right.', wrong: 'Write the time.' } };
const order: NarrowCheck = { kind: 'order', parts: ['Plug in.', 'Switch on.', 'Pick input.'], nearMisses: [{ answer: ['Switch on.', 'Plug in.', 'Pick input.'], feedback: 'Power first.' }], feedback: { right: 'Right.', wrong: 'Think it through.' } };

describe('spec 43: normalize', () => {
  it('folds case, runs of space and edge punctuation, and nothing in the middle', () => {
    expect(normalize('  Could   you SEND the notes?  ')).toBe('could you send the notes');
    expect(normalize('"6 p.m."')).toBe('6 p.m');
    expect(normalize('Room 12')).not.toBe(normalize('Room 21'));
    expect(normalize('can’t')).toBe('can’t');
  });
  it('treats a composed and a decomposed letter as the same (NFC first)', () => {
    const composed = 'café', decomposed = 'café';
    expect(composed).not.toBe(decomposed);
    expect(normalize(composed)).toBe(normalize(decomposed));
    expect(checkAnswer({ kind: 'phrase', accepted: [composed], feedback: { right: 'r', wrong: 'w' } }, decomposed).result).toBe('right');
  });
});

describe('spec 43: narrow checks', () => {
  it('a choice: right, a named near miss with its own feedback, or wrong with the general feedback', () => {
    expect(checkAnswer(choice, 'could you send the notes')).toEqual({ result: 'right', feedback: 'Yes.' });
    expect(checkAnswer(choice, 'I was ill.')).toEqual({ result: 'near', feedback: 'That is the reason. Put the ask first.' });
    expect(checkAnswer(choice, 'Hi!')).toEqual({ result: 'wrong', feedback: 'Start with the ask.' });
  });
  it('a phrase accepts its listed variants only, and a misleading near miss is not accepted', () => {
    expect(checkAnswer(phrase, '6 PM').result).toBe('right');
    expect(checkAnswer(phrase, '6 p.m.').result).toBe('right');
    expect(checkAnswer(phrase, '6').result).toBe('near');
    expect(checkAnswer(phrase, '6 am').result).toBe('wrong');
    expect(checkAnswer(phrase, '16 pm').result).toBe('wrong');
  });
  it('an order must match part for part; a known wrong order gets its own feedback', () => {
    expect(checkAnswer(order, ['plug in', 'switch on', 'pick input']).result).toBe('right');
    expect(checkAnswer(order, ['Switch on.', 'Plug in.', 'Pick input.'])).toEqual({ result: 'near', feedback: 'Power first.' });
    expect(checkAnswer(order, ['Pick input.', 'Switch on.', 'Plug in.']).result).toBe('wrong');
    expect(checkAnswer(order, ['Plug in.', 'Switch on.']).result).toBe('wrong');
  });
});

describe('spec 43: the loop', () => {
  const start: LoopState = { stage: 'worked' };
  it('runs worked → change → fresh → feedback → saved, and never skips a stage', () => {
    let state = stepLoop(start, { type: 'fresh', answer: 'x', result: 'right' });
    expect(state.stage).toBe('worked');
    state = stepLoop(state, { type: 'next' });
    expect(state.stage).toBe('change');
    // The change stage needs a checked answer before it moves on.
    expect(stepLoop(state, { type: 'next' }).stage).toBe('change');
    state = stepLoop(state, { type: 'change', answer: 'I was ill.', result: 'near' });
    expect(state.change).toEqual({ answer: 'I was ill.', result: 'near' });
    state = stepLoop(state, { type: 'next' });
    expect(state.stage).toBe('fresh');
    expect(stepLoop(state, { type: 'fresh', answer: '   ', result: 'self' }).stage).toBe('fresh');
    state = stepLoop(state, { type: 'fresh', answer: 'Could I borrow the key?', result: 'right' });
    expect(state.stage).toBe('feedback');
    // Revise goes back to the fresh case with the answer kept; save ends the loop.
    expect(stepLoop(state, { type: 'revise' }).stage).toBe('fresh');
    state = stepLoop(state, { type: 'saved' });
    expect(state.stage).toBe('saved');
    expect(stepLoop(state, { type: 'next' })).toBe(state);
  });
  it('nothing moves on by itself: an unrelated event leaves the stage alone', () => {
    const fresh: LoopState = { stage: 'fresh', change: { answer: 'a', result: 'right' } };
    expect(stepLoop(fresh, { type: 'next' })).toBe(fresh);
    expect(stepLoop(fresh, { type: 'saved' })).toBe(fresh);
  });
});

describe('spec 43: retries on the 04:00 day', () => {
  const at = (iso: string) => new Date(iso).getTime();
  it('a wrong or near fresh answer comes back next day; a right one after 3, then 7, then 14 days, then not again', () => {
    expect(nextRetry(at('2026-11-03T10:00:00'), 'wrong', 2)).toEqual({ due: '2026-11-04', rights: 0 });
    expect(nextRetry(at('2026-11-03T10:00:00'), 'near', 0)).toEqual({ due: '2026-11-04', rights: 0 });
    expect(nextRetry(at('2026-11-03T10:00:00'), 'right', 0)).toEqual({ due: '2026-11-06', rights: 1 });
    expect(nextRetry(at('2026-11-06T10:00:00'), 'right', 1)).toEqual({ due: '2026-11-13', rights: 2 });
    expect(nextRetry(at('2026-11-13T10:00:00'), 'right', 2)).toEqual({ due: '2026-11-27', rights: 3 });
    expect(nextRetry(at('2026-11-27T10:00:00'), 'right', 3)).toEqual({ due: null, rights: 4 });
    expect(nextRetry(at('2026-11-03T10:00:00'), 'self', 0).due).toBe('2026-11-06');
  });
  it('counts from the 04:00 day, so a 2 am finish belongs to the day before', () => {
    expect(nextRetry(at('2026-11-04T02:00:00'), 'wrong', 0).due).toBe('2026-11-04');
  });
  it('adds calendar days across a month end', () => {
    expect(addDays('2026-11-28', 7)).toBe('2026-12-05');
  });
});
