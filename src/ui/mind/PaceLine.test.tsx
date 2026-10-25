// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PaceLine, ParLine } from './PaceLine';

afterEach(cleanup);
const marks = [10_000, 20_000, 30_000, 40_000, 50_000, 60_000, 70_000, 80_000, 90_000, 100_000];

it('draws two dots, and a still line of text under reduced motion', () => {
  const { container } = render(<PaceLine mine={0.4} marks={marks} elapsed={25_000} who="Your best" caption="Your best Mini Sudoku easy pace" totalMs={100_000} motion />);
  expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Your best Mini Sudoku easy pace. You 40% filled · Your best 25% at this time');
  expect(container.querySelectorAll('.mind-pace-dot')).toHaveLength(2);
  // A visible key, so a touch user can tell which dot is theirs (Codex A item 78).
  expect(container.querySelector('.mind-pace-key')?.textContent).toBe('youbest');
  cleanup();
  const still = render(<PaceLine mine={0.4} marks={marks} elapsed={25_000} who="Your best" caption="x" totalMs={100_000} motion={false} />);
  expect(still.container.querySelector('.mind-pace-dot')).toBeNull();
  expect(still.container.textContent).toBe('Your best: 1:40');
});

it('the par line is bold only when the solve beat par', () => {
  const beaten = render(<ParLine par={240_000} solveMs={200_000} />);
  expect(beaten.container.querySelector('.mind-par-beaten strong')?.textContent).toBe('Par 4:00 (your median of the last 10)');
  cleanup();
  for (const solveMs of [240_000, 300_000, undefined]) {
    const plain = render(<ParLine par={240_000} solveMs={solveMs} />);
    expect(plain.container.querySelector('strong')).toBeNull();
    cleanup();
  }
});
