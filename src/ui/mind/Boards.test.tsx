// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SunMoonBoard } from './Boards';

afterEach(() => cleanup());

describe('SunMoonBoard', () => {
  it('includes adjacent clues in the aria-label for accessibility', () => {
    const board = {
      type: 'sunmoon' as const,
      R: 6, C: 6,
      hs: [0, 1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // right
      vs: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // below
      given: Array(36).fill(-1),
      id: 'test', kind: 'sunmoon' as const, title: 'Test', diff: 'medium' as const, seed: 123, solution: Array(36).fill(0)
    };
    const state = { grid: Array(36).fill(-1), path: [] };
    const conflicts: number[] = [];

    render(<SunMoonBoard board={board} state={state} conflicts={conflicts} notes={[]} notesMode={false} onGrid={() => {}} onPath={() => {}} onNotesMode={() => {}} done={false} />);

    // Cell at index 1: row 1, column 2. right edge hs[1] = 1 (equal)
    const eqCell = screen.getByLabelText(/Row 1, column 2.*equal to the cell on the right/);
    expect(eqCell).toBeDefined();

    // Cell at index 3: row 1, column 4. right edge hs[3] = 2 (opposite)
    const oppRightCell = screen.getByLabelText(/Row 1, column 4.*opposite to the cell on the right/);
    expect(oppRightCell).toBeDefined();

    // Cell at index 0: row 1, column 1. below edge vs[0] = 2 (opposite)
    const oppBelowCell = screen.getByLabelText(/Row 1, column 1.*opposite to the cell below/);
    expect(oppBelowCell).toBeDefined();
  });
});
