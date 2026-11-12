import { describe, expect, it } from 'vitest';
import pack from '../../../content/quests660/board.json';
import type { NextMove } from '../nextMove';
import type { BoardPack } from './quests';
import { cardRow, moveIsDue, questMeta, questRowLine } from './row';

const NOW = new Date('2026-11-13T12:00:00').getTime();
const board = (pack as BoardPack).quests.slice(0, 3);

describe('spec 660 §2.1: the collapsed row (b2 ruling a)', () => {
  it('due now: an open focus (running or paused), a task within 30 min or overdue, a due book check, night', () => {
    expect(moveIsDue({ kind: 'focus', title: 'x', running: true, route: 'plan' }, NOW)).toBe(true);
    expect(moveIsDue({ kind: 'focus', title: 'x', running: false, route: 'plan' }, NOW)).toBe(true);
    expect(moveIsDue({ kind: 'task', title: 'x', at: NOW + 29 * 60_000, route: 'plan' }, NOW)).toBe(true);
    expect(moveIsDue({ kind: 'task', title: 'x', at: NOW - 60_000, route: 'plan' }, NOW)).toBe(true);
    expect(moveIsDue({ kind: 'task', title: 'x', at: NOW + 31 * 60_000, route: 'plan' }, NOW)).toBe(false);
    expect(moveIsDue({ kind: 'task', title: 'x', route: 'plan' }, NOW)).toBe(false);
    expect(moveIsDue({ kind: 'book-check', route: 'read/check/b/c' }, NOW)).toBe(true);
    expect(moveIsDue({ kind: 'night', route: 'night' }, NOW)).toBe(true);
    expect(moveIsDue({ kind: 'read', route: 'read' }, NOW)).toBe(false);
    expect(moveIsDue({ kind: 'train', route: 'yatra/train' }, NOW)).toBe(false);
  });
  it('rest at night; a due move wins; else the first quest not done; all done → the next move, never empty', () => {
    const read: NextMove = { kind: 'read', route: 'read' };
    expect(cardRow({ resting: true, move: read, now: NOW, board, doneToday: new Set() })).toEqual({ kind: 'rest' });
    expect(cardRow({ resting: false, move: { kind: 'book-check', route: 'x' }, now: NOW, board, doneToday: new Set() })).toEqual({ kind: 'move' });
    expect(cardRow({ resting: false, move: read, now: NOW, board, doneToday: new Set() })).toEqual({ kind: 'quest', quest: board[0] });
    expect(cardRow({ resting: false, move: read, now: NOW, board, doneToday: new Set([board[0]!.id]) })).toEqual({ kind: 'quest', quest: board[1] });
    expect(cardRow({ resting: false, move: read, now: NOW, board, doneToday: new Set(board.map(q => q.id)) })).toEqual({ kind: 'move' });
    expect(cardRow({ resting: false, move: read, now: NOW, board: [], doneToday: new Set() })).toEqual({ kind: 'move' });
  });
  it('the row and meta words', () => {
    expect(questRowLine({ friend: 'Chiku', minutes: 5 })).toEqual({ line: 'Chiku has a quest', meta: '5\u00a0min' });
    expect(questMeta({ minutes: 15, where: ['home', 'travel', 'outside'] })).toBe('15\u00a0min · home, on the way or outside');
    expect(questMeta({ minutes: 30, where: ['outside'] })).toBe('30\u00a0min · outside');
  });
});
