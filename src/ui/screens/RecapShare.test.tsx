// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RecapShare } from './RecapShare';
import type { WeeklyRecapData } from '../../core/recap';

// The day window comes from the clock and bedtime; each test sets it directly.
let shareDay = true;
vi.mock('../shareActions', async original => ({ ...await original<typeof import('../shareActions')>(), useShareDay: () => shareDay }));

const recap: WeeklyRecapData = { from: '2026-10-12', to: '2026-10-19', tasks: 6, focusHours: 0, longestFocusMinutes: 0, workouts: 3, sideQuests: 0, concepts: 0, nights: 0 };

afterEach(() => { cleanup(); vi.restoreAllMocks(); shareDay = true; });

it('draws the selected lines into the preview canvas', async () => {
  const fillText = vi.fn();
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:recap', revokeObjectURL: vi.fn() });
  Object.defineProperty(document, 'fonts', { configurable: true, value: { load: vi.fn().mockResolvedValue([]) } });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    createLinearGradient: () => ({ addColorStop: vi.fn() }), fillRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(), roundRect: vi.fn(), fillText,
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(new Blob(['png'], { type: 'image/png' })));
  render(<RecapShare recap={recap} />);
  fireEvent.click(screen.getByRole('button', { name: 'Share my week' }));
  expect(await screen.findByRole('img', { name: /Weekly recap/ })).toBeTruthy();
  expect(fillText).toHaveBeenCalledWith('6 tasks finished', expect.any(Number), expect.any(Number), 850);
  expect(fillText).toHaveBeenCalledWith('3 workouts', expect.any(Number), expect.any(Number), 850);
  expect(fillText).not.toHaveBeenCalledWith('0 ideas learned', expect.any(Number), expect.any(Number), 850);
});

it('hides the week card share after shutdown (spec 19)', () => {
  shareDay = false;
  render(<RecapShare recap={recap} />);
  expect(screen.queryByRole('button', { name: 'Share my week' })).toBeNull();
  cleanup();
  render(<RecapShare recap={recap} link />);
  expect(screen.queryByRole('button', { name: 'Your week is ready to share' })).toBeNull();
});
