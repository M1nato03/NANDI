import { describe, expect, it } from 'vitest';
import { catalogFor, makeDrop } from './flow';
import { nextStep, taughtCatalog } from '../../core/learn/steps';
import type { LearnConceptRow } from '../../data/types';

const now = new Date('2026-10-22T12:00:00').getTime();
const base = { ids: ['psychology'], concepts: [] as LearnConceptRow[], items: [], now, daily: true, answeredToday: 0, newToday: 0, spentMinutes: 0, facts: [] };
const habits = catalogFor(['psychology']).find(concept => concept.id === 'habits')!;
const started = (id: string): LearnConceptRow => ({ id, mastery: 0.6, attempts: 3, activeMisconceptions: [], updatedAt: now - 2 * 86_400_000, deleted: 0, deviceId: 'test',
  memory: { stability: 2, difficulty: 5, interval: 1, lastReview: now - 2 * 86_400_000, dueAt: now - 1 } });

describe('teach first (spec 14)', () => {
  it('opens a new learner on the first step: lesson, then that step’s own your-turn items, nothing untaught', () => {
    const drop = makeDrop(base);
    expect(drop.items[0]).toMatchObject({ itemId: 'lesson:habits-s1', lesson: 'habits-s1', mode: 'new' });
    const rest = drop.items.slice(1);
    expect(rest.length).toBeGreaterThan(0);
    expect(rest.every(item => habits.items.find(candidate => candidate.id === item.itemId)?.step === 'habits-s1')).toBe(true);
  });

  it('teaches the next step on a later day, own items first and only taught reviews after', () => {
    const drop = makeDrop({ ...base, taughtSteps: ['habits-s1'], concepts: [started('habits')] });
    expect(drop.items[0]!.lesson).toBe('habits-s2');
    const steps = drop.items.slice(1).map(item => habits.items.find(candidate => candidate.id === item.itemId)?.step);
    const firstReview = drop.items.findIndex((item, index) => index > 0 && item.mode === 'review');
    const lastOwn = steps.lastIndexOf('habits-s2') + 1;
    expect(lastOwn).toBeGreaterThan(0);
    if (firstReview >= 0) expect(firstReview).toBeGreaterThan(lastOwn);
    expect(steps.every(step => step === 'habits-s1' || step === 'habits-s2')).toBe(true);
  });

  it('teaches at most one new step a day, then reviews only what was taught', () => {
    const drop = makeDrop({ ...base, taughtSteps: ['habits-s1'], lessonToday: true, concepts: [started('habits')] });
    expect(drop.items.some(item => item.lesson)).toBe(false);
    for (const item of drop.items) {
      const step = habits.items.find(candidate => candidate.id === item.itemId)?.step;
      if (step) expect(step).toBe('habits-s1');
    }
  });

  it('keeps untaught steps out of the review pool and leaves topics without steps alone', () => {
    const psychology = catalogFor(['psychology']);
    const pool = taughtCatalog(psychology, new Set(['habits-s1']));
    const taughtHabits = pool.find(concept => concept.id === 'habits')!;
    expect(taughtHabits.items.every(item => item.step === 'habits-s1')).toBe(true);
    // A concept without steps (an older pack) stays whole and never offers a lesson.
    const quizOnly = catalogFor(['money-markets']).map(concept => ({ ...concept, steps: undefined }));
    expect(taughtCatalog(quizOnly, new Set())).toEqual(quizOnly);
    expect(nextStep(quizOnly, new Set())).toBeUndefined();
  });

  it('never starts a lesson after bedtime or in the night drop', () => {
    const late = new Date('2026-10-22T02:00:00').getTime();
    expect(makeDrop({ ...base, now: late, bedtime: '01:30' }).items.some(item => item.lesson)).toBe(false);
    expect(makeDrop({ ...base, night: true }).items.some(item => item.lesson)).toBe(false);
  });

  it('practising an idea with an untaught step teaches that step first', () => {
    const drop = makeDrop({ ...base, daily: false, preferredConceptId: 'habits', taughtSteps: ['habits-s1'] });
    expect(drop.items[0]!.lesson).toBe('habits-s2');
  });
});

describe('teach-first kill-test numbers', () => {
  it('counts guided first tries and only the lesson step’s own answers as your turn', async () => {
    const { lessonMetrics } = await import('../../core/learn/steps');
    const row = (kind: string, refId: string, inputs: Record<string, unknown>) => ({ kind, refId, inputs, deleted: 0 });
    const ledger = [
      row('learn-lesson', 'habits-s1', { dropId: 'd1', guidedFirstTry: [true, false] }),
      row('learn-answer', 'a', { dropId: 'd1', itemId: 'habits-1', correct: true }),
      row('learn-answer', 'b', { dropId: 'd1', itemId: 'habits-4', correct: false }),
      row('learn-answer', 'c', { dropId: 'd1', itemId: 'habits-2', correct: true }),
    ];
    const stepOf = (id: string) => habits.items.find(item => item.id === id)?.step;
    expect(lessonMetrics(ledger, stepOf)).toEqual({ lessons: 1, guidedFirstTry: 50, guidedCount: 2, yourTurn: 50, yourTurnCount: 2 });
  });
});

describe('lesson option order', () => {
  it('does not always put the right option first', async () => {
    const { shuffled } = await import('./StepLesson');
    const steps = catalogFor(['psychology']).flatMap(concept => concept.steps ?? []);
    const questions = steps.flatMap(step => [{ seed: `${step.id}:hook`, options: step.hook.options }, ...step.guided.map((guided, index) => ({ seed: `${step.id}:${index}`, options: guided.options }))]);
    const firstRight = questions.filter(question => shuffled(question.options, question.seed)[0]!.correct).length;
    expect(questions.length).toBeGreaterThan(60);
    expect(firstRight / questions.length).toBeLessThan(0.5);
  });
});
