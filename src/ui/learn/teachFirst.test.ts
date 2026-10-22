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
  it('opens a new learner on the first step and ends there: nothing else is taught or ready yet', () => {
    const drop = makeDrop(base);
    expect(drop.items).toEqual([expect.objectContaining({ itemId: 'lesson:habits-s1', lesson: 'habits-s1', mode: 'new' })]);
  });

  it('serves a step’s own questions from the next day, never straight after its lesson (spec 16 §5)', () => {
    const today = makeDrop({ ...base, taughtSteps: ['habits-s1'], taughtOn: { 'habits-s1': '2026-10-22' }, lessonToday: true });
    expect(today.items).toEqual([]);
    const drop = makeDrop({ ...base, taughtSteps: ['habits-s1'], taughtOn: { 'habits-s1': '2026-10-21' }, concepts: [started('habits')] });
    expect(drop.items[0]!.lesson).toBe('habits-s2');
    const steps = drop.items.slice(1).map(item => habits.items.find(candidate => candidate.id === item.itemId)?.step);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every(step => step === 'habits-s1')).toBe(true);
  });

  it('over a simulated week, teaches one step a day and serves only steps taught on earlier days', () => {
    const taughtOn: Record<string, string> = {};
    for (let day = 0; day < 7; day++) {
      const at = new Date(2026, 9, 22 + day, 12).getTime();
      const key = new Date(at).toISOString().slice(0, 10);
      const drop = makeDrop({ ...base, now: at, taughtSteps: Object.keys(taughtOn), taughtOn });
      const lesson = drop.items[0]!.lesson!;
      expect(lesson, `day ${day + 1}`).toBeTruthy();
      expect(drop.items.filter(item => item.lesson)).toHaveLength(1);
      const tail = drop.items.slice(1);
      if (day > 0) expect(tail.length, `day ${day + 1}`).toBeGreaterThan(0);
      for (const item of tail) {
        const step = catalogFor(['psychology']).flatMap(concept => concept.items).find(candidate => candidate.id === item.itemId)?.step;
        expect(step && taughtOn[step] && taughtOn[step]! < key, `day ${day + 1}: ${item.itemId}`).toBeTruthy();
      }
      taughtOn[lesson] = key;
    }
  });

  it('never puts two questions on one idea in a row when another idea is waiting', async () => {
    const { interleave } = await import('../../core/learn/steps');
    const order = interleave(['a', 'a', 'a', 'b', 'c', 'b'].map((conceptId, index) => ({ conceptId, index })));
    expect(order.map(item => item.conceptId)).toEqual(['a', 'b', 'a', 'c', 'a', 'b']);
    expect(interleave([{ conceptId: 'a' }, { conceptId: 'a' }]).length).toBe(2);
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
  it('counts guided first tries and the first answer to each item of a taught step as your turn', async () => {
    const { lessonMetrics } = await import('../../core/learn/steps');
    const row = (kind: string, refId: string, inputs: Record<string, unknown>) => ({ kind, refId, inputs, deleted: 0 });
    const ledger = [
      row('learn-lesson', 'habits-s1', { dropId: 'd1', guidedFirstTry: [true, false] }),
      row('learn-answer', 'a', { dropId: 'd1', itemId: 'habits-9', correct: true }),
      row('learn-answer', 'b', { dropId: 'd1', itemId: 'habits-12', correct: false }),
      row('learn-answer', 'c', { dropId: 'd2', itemId: 'habits-10', correct: false }),
      row('learn-answer', 'd', { dropId: 'd3', itemId: 'habits-9', correct: false }),
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
    // Spec 16 §5: one hook and one guided try per step (30 steps).
    expect(questions.length).toBeGreaterThanOrEqual(60);
    expect(firstRight / questions.length).toBeLessThan(0.5);
  });
});
