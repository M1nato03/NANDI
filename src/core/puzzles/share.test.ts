import { describe, expect, it } from 'vitest';
import type { PuzzleRunRow } from '../../data/types';
import { caseResultText, isPersonalBest, resultText, typeMarks, weekShareText } from './share';

const link = 'https://nandi.nandi11.workers.dev/#mind/challenge/20261103/crowns/medium/797416356';
const solved = (id: string, solveMs: number, extra: Partial<PuzzleRunRow> = {}) => ({ id, type: 'crowns', diff: 'medium', solveMs, result: 'solved', ...extra }) as PuzzleRunRow;

describe('one result text (spec 19 C)', () => {
  it('a daily board: mark, number, difficulty, time, hints, and the link', () => {
    expect(resultText({ type: 'crowns', name: 'Crowns', diff: 'medium', solveMs: 252_000, hintsUsed: 0, number: 12, link }))
      .toBe(`NANDI 👑 Crowns #12 · Medium\n4:12 · no hints ✨\nSame board, your turn: ${link}`);
  });
  it('a practice board: no number and no link', () => {
    expect(resultText({ type: 'sudoku', name: 'Mini Sudoku', diff: 'easy', solveMs: 65_000, hintsUsed: 0 })).toBe('NANDI 🔢 Mini Sudoku · Easy\n1:05 · no hints ✨');
  });
  it('shows hints as bulbs, one each, never more than five', () => {
    const line = (hintsUsed: number) => resultText({ type: 'calc', name: 'Calcudoku', diff: 'hard', solveMs: 600_000, hintsUsed }).split('\n')[1];
    expect(line(0)).toBe('10:00 · no hints ✨');
    expect(line(1)).toBe('10:00 · 💡');
    expect(line(5)).toBe('10:00 · 💡💡💡💡💡');
    expect(line(7)).toBe('10:00 · 💡💡💡💡💡');
    expect(line(7)).not.toMatch(/×|7/);
  });
  it('adds "my best" only for the best time, and never a negative', () => {
    expect(resultText({ type: 'path', name: 'Number Path', diff: 'medium', solveMs: 90_000, hintsUsed: 1, best: true }).split('\n')[1]).toBe('1:30 · 💡 · my best');
    const slower = resultText({ type: 'path', name: 'Number Path', diff: 'medium', solveMs: 90_000, hintsUsed: 1, best: false });
    expect(slower).not.toMatch(/best|slower|usual|fail|streak/i);
  });
  it('a friend replying says "My time on your board"', () => {
    expect(resultText({ type: 'sunmoon', name: 'Sun & Moon', diff: 'easy', solveMs: 30_000, number: 3, link, reply: true }).split('\n')[2]).toBe(`My time on your board: ${link}`);
  });
  it('a board number below 1 (before the epoch) is left out', () => {
    expect(resultText({ type: 'crowns', name: 'Crowns', diff: 'medium', solveMs: 1000, number: 0 }).split('\n')[0]).toBe('NANDI 👑 Crowns · Medium');
  });
  it('has one mark per type', () => {
    expect(typeMarks).toEqual({ sudoku: '🔢', crowns: '👑', sunmoon: '🌗', path: '〰️', calc: '➗', mystery: '🔎' });
  });
  it('carries no tracking in the link line', () => {
    expect(resultText({ type: 'crowns', name: 'Crowns', diff: 'medium', solveMs: 1000, number: 1, link })).not.toMatch(/utm_|ref=|\?/);
  });
});

describe('my best', () => {
  it('is never shown on a first solve, and only when no earlier solve was faster', () => {
    const run = solved('b', 50_000);
    expect(isPersonalBest(run, [run])).toBe(false);
    expect(isPersonalBest(run, [run, solved('a', 60_000)])).toBe(true);
    expect(isPersonalBest(run, [run, solved('a', 40_000)])).toBe(false);
    expect(isPersonalBest(run, [run, solved('a', 40_000, { diff: 'hard' })])).toBe(false);
    expect(isPersonalBest(run, [run, solved('a', 40_000, { deleted: 1 }), solved('c', 70_000)])).toBe(true);
  });
});

describe('case and week text', () => {
  it('numbers only the weekday shared case, with no link', () => {
    // Tue 3 Nov 2026: the shared case is easy.
    const run = solved('mystery:2026-11-03', 125_000, { type: 'mystery', diff: 'easy', hintsUsed: 2 });
    expect(caseResultText(run, '2026-11-03', 'easy', [run])).toBe('NANDI 🔎 Case #12 · Easy\n2:05 · 💡💡');
    // Thu 5 Nov: the shared case is medium, so an onboarding easy case is not "Case #14".
    expect(caseResultText(run, '2026-11-05', 'easy', [run])).toBe('NANDI 🔎 Case · Easy\n2:05 · 💡💡');
  });
  it('the week card passes one line and the link', () => {
    expect(weekShareText(['6 tasks finished', '3 workouts'])).toBe('My week on NANDI: 6 tasks finished, 3 workouts.\nhttps://nandi.nandi11.workers.dev');
  });
});
