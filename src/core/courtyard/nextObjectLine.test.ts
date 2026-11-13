import { describe, expect, it } from 'vitest';
import { AREAS, nextObjectLine, type AreaState } from './courtyard';

const at = (id: AreaState['id'], left: number) => {
  const area = AREAS.find(row => row.id === id)!;
  return { id, practice: area.practice, days: 10 - left, nextAt: 10, nextObject: area.objects[1]! };
};

describe('nextObjectLine (P1, a9 w03 #1)', () => {
  it('Sleep counts on-time nights', () => {
    expect(nextObjectLine(at('sleep', 1))).toBe('1 more on-time night adds a pillow.');
    expect(nextObjectLine(at('sleep', 3))).toBe('3 more on-time nights add a pillow.');
  });
  it('Plan counts days with a task done', () => {
    expect(nextObjectLine(at('plan', 1))).toBe('1 more day with a task done adds a second pot.');
    expect(nextObjectLine(at('plan', 3))).toBe('3 more days with a task done add a second pot.');
  });
  it('the other areas keep "days of <practice>"', () => {
    expect(nextObjectLine(at('train', 1))).toBe('1 more day of training adds wooden clubs.');
    expect(nextObjectLine(at('learn', 3))).toBe('3 more days of learning add a book stack.');
    expect(nextObjectLine(at('remember', 3))).toBe('3 more days of idea checks add a photo frame.');
    expect(nextObjectLine(at('mind', 1))).toBe('1 more day of puzzles adds a chess stool.');
  });
  it('a complete corner says so', () => {
    expect(nextObjectLine({ id: 'sleep', practice: 'on-time nights', days: 40, nextAt: null, nextObject: null })).toBe('Every object is here. This corner is complete.');
  });
});
