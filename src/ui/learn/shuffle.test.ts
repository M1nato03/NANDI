import { describe, expect, it } from 'vitest';
import { catalogFor } from './flow';
import { orderOptions, seededShuffle } from '../../core/learn/engine';
import { shuffled } from './StepLesson';

// Idea engine item 71, B1: the right option must not show first more often than chance, and order items must not
// arrive already solved more often than 1 in n!.
const all = catalogFor(['body-training', 'health-nutrition', 'history-civilisations', 'how-things-work', 'money-markets', 'psychology']);
const SEEDS = 200;
const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));

describe('option shuffle (item 71, B1)', () => {
  it('puts each of 3 options first about a third of the time and gives all 6 orders about evenly', () => {
    const firsts: Record<string, number> = {};
    const orders: Record<string, number> = {};
    const runs = 6000;
    for (let i = 0; i < runs; i++) {
      const order = seededShuffle(['a', 'b', 'c'], `item-${i % 50}:${i}`);
      firsts[order[0]!] = (firsts[order[0]!] ?? 0) + 1;
      orders[order.join('')] = (orders[order.join('')] ?? 0) + 1;
    }
    for (const id of ['a', 'b', 'c']) expect(Math.abs(firsts[id]! / runs - 1 / 3)).toBeLessThan(0.03);
    expect(Object.keys(orders)).toHaveLength(6);
    for (const count of Object.values(orders)) expect(Math.abs(count / runs - 1 / 6)).toBeLessThan(0.025);
  });

  it('is stable: the same key always gives the same order', () => {
    expect(seededShuffle(['a', 'b', 'c', 'd'], 'habits-3:4210')).toEqual(seededShuffle(['a', 'b', 'c', 'd'], 'habits-3:4210'));
  });

  it('shows the right option first at chance on real practice items, also with whole-minute seeds', () => {
    const choice = all.flatMap(concept => concept.items).filter(item => item.options.length > 1 && item.options.filter(option => option.correct).length === 1);
    expect(choice.length).toBeGreaterThan(100);
    for (const seeds of [Array.from({ length: SEEDS }, (_, i) => i * 7919), Array.from({ length: SEEDS }, (_, i) => (i * 60_000) % 1_000_000)]) {
      let first = 0; let expected = 0;
      for (const item of choice) for (const seed of seeds) {
        const top = orderOptions(item, seed)[0];
        if (item.options.find(option => option.id === top)?.correct) first++;
        expected += 1 / item.options.length;
      }
      expect(Math.abs(first / expected - 1)).toBeLessThan(0.05);
    }
  });

  it('rarely shows an order item already solved: about 1 in n!', () => {
    const order = all.flatMap(concept => concept.items).filter(item => item.type === 'order');
    expect(order.length).toBeGreaterThan(0);
    let solved = 0; let expected = 0;
    for (const item of order) for (let seed = 0; seed < SEEDS; seed++) {
      if (orderOptions(item, (seed * 60_000) % 1_000_000).join() === (item.type === 'order' ? item.answer : []).join()) solved++;
      expected += 1 / factorial(item.options.length);
    }
    expect(solved).toBeLessThan(expected * 1.6 + 5);
  });

  it('shows the right hook and guided-try option first at chance across all steps', () => {
    const steps = all.flatMap(concept => concept.steps ?? []);
    expect(steps.length).toBeGreaterThan(100);
    let first = 0; let expected = 0;
    for (const step of steps) for (const [options, seed] of [[step.hook.options, `${step.id}:hook`], ...step.guided.map((try_, i) => [try_.options, `${step.id}:${i}`] as const)] as const) {
      if (shuffled(options, seed)[0]!.correct) first++;
      expected += 1 / options.length;
    }
    // One fixed order per step, so this is one sample per question: allow a wider band than above.
    expect(Math.abs(first / expected - 1)).toBeLessThan(0.2);
  });
});
