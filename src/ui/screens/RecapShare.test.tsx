// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RecapShare } from './RecapShare';
import type { WeeklyRecapData } from '../../core/recap';

const recap: WeeklyRecapData = { from: '2026-10-12', to: '2026-10-19', tasks: 6, focusHours: 0, longestFocusMinutes: 0, workouts: 3, sideQuests: 0, concepts: 0, nights: 0 };

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

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
