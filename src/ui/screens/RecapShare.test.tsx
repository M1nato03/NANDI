// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { RecapShare } from './RecapShare';
import { buildRecap, type RecapSources, type WeeklyRecapData } from '../../core/recap';

// The day window comes from the clock and bedtime; each test sets it directly. Share and save are recorded, not run.
let shareDay = true;
const sent = vi.hoisted(() => ({ share: vi.fn(), save: vi.fn() }));
vi.mock('../shareActions', async original => ({ ...await original<typeof import('../shareActions')>(), useShareDay: () => shareDay, shareFileNow: sent.share, saveFileNow: sent.save }));

const recap: WeeklyRecapData = { from: '2026-11-02', to: '2026-11-09', tasks: 6, focusMinutes: 0, longestFocusMinutes: 0, workouts: 3, sideQuests: 0, quests: 0, concepts: 0, nights: 0, chapters: 0, realMs: 0 };

let drawn: string[] = [];
beforeEach(() => {
  drawn = [];
  sent.share.mockResolvedValue('shared');
  sent.save.mockResolvedValue('saved');
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:recap', revokeObjectURL: vi.fn() });
  Object.defineProperty(document, 'fonts', { configurable: true, value: { load: vi.fn().mockResolvedValue([]) } });
  const context = new Proxy({ font: '', fillStyle: '', strokeStyle: '', lineWidth: 1, textAlign: 'left' } as Record<string, unknown>, {
    get: (target, key: string) => key in target ? target[key]
      : key === 'fillText' ? (text: string) => { drawn.push(text); }
        : key === 'measureText' ? (text: string) => ({ width: text.length * 22 })
          : key === 'createLinearGradient' ? () => ({ addColorStop: vi.fn() })
            : () => undefined,
    set: (target, key: string, value) => { target[key] = value; return true; },
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(new Blob(['png'], { type: 'image/png' })));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); shareDay = true; });

async function openSheet(data: WeeklyRecapData) {
  render(<RecapShare recap={data} />);
  fireEvent.click(screen.getByRole('button', { name: 'Share my week' }));
  expect(await screen.findByRole('img', { name: /Receipt, week of/ }, { timeout: 4000 })).toBeTruthy();
}

it('draws the receipt: its title, the nonzero lines with their values, and no zero line', async () => {
  await openSheet(recap);
  expect(screen.getByRole('dialog', { name: "Your week’s receipt" })).toBeTruthy();
  expect(drawn).toEqual(expect.arrayContaining(['NANDI · RECEIPT', 'Workouts', '3', 'Tasks done', '6', 'Paid in real life.']));
  // This week is still open on the test's clock, or closed: the subline says which.
  expect(drawn.some(line => line === 'week of 2–8 Nov' || line === 'week of 2–8 Nov · so far')).toBe(true);
  expect(drawn).not.toContain('Ideas learned');
  // Under 30 min of measured time there is no total line.
  expect(drawn).not.toContain('REAL THINGS');
});

it('spec 53 privacy: no task, book or topic title reaches the image or the share text', async () => {
  const meta = { updatedAt: 1, deleted: 0 as const, deviceId: 'test' };
  const done = new Date('2026-11-04T12:00:00').getTime();
  const sources: RecapSources = {
    tasks: [{ ...meta, id: 'a', title: 'Call Dr Zephyrine about the X-ray', status: 'done', dayKey: '2026-11-04', doneAt: done }, { ...meta, id: 'b', title: 'Quokka tax filing', status: 'done', dayKey: '2026-11-04', doneAt: done }],
    focus: [{ ...meta, id: 'f', taskId: 'a', startedAt: done - 3_600_000, endedAt: done }],
    sessions: [], quests: [{ ...meta, id: 'q', sourceId: 'q', week: '2026-W45', title: 'Walk to Marigold Lake', kind: 'once', target: 1, unit: 'walk', step: 1, progress: 1, tapIds: [], status: 'done', custom: true, updatedAt: done }],
    concepts: [{ ...meta, id: 'psychology-habit-loop', mastery: 1, attempts: 1, firstLearnedAt: done, activeMisconceptions: [] }],
    logs: [],
    ledger: [{ ...meta, id: 'chapter:psychology:psychology-ch1', mode: 'read', kind: 'chapter', refId: 'psychology:psychology-ch1', dayKey: '2026-11-04', inputs: {} }],
  };
  await openSheet(buildRecap(new Date('2026-11-10T12:00:00').getTime(), sources));
  fireEvent.click(screen.getByRole('button', { name: 'Share' }));
  await waitFor(() => expect(sent.share).toHaveBeenCalled());
  const text = String(sent.share.mock.calls[0]![1]);
  expect(text).toContain('Chapters read 1');
  for (const secret of ['Zephyrine', 'X-ray', 'Quokka', 'Marigold', 'psychology', 'habit', 'Why We Do']) {
    expect(drawn.some(line => line.includes(secret)), secret).toBe(false);
    expect(text.includes(secret), secret).toBe(false);
  }
});

it('Save image keeps the receipt and says where: Documents/NANDI on the phone', async () => {
  await openSheet(recap);
  fireEvent.click(screen.getByRole('button', { name: 'Save image' }));
  expect(await screen.findByRole('status')).toHaveProperty('textContent', 'Saved in Documents/NANDI');
  expect((sent.save.mock.calls[0]![0] as File).name).toBe('nandi-receipt-2026-11-02.png');
});

it('hides the week card share after shutdown (spec 19)', () => {
  shareDay = false;
  render(<RecapShare recap={recap} />);
  expect(screen.queryByRole('button', { name: 'Share my week' })).toBeNull();
  cleanup();
  render(<RecapShare recap={recap} link />);
  expect(screen.queryByRole('button', { name: "Your week’s receipt is ready" })).toBeNull();
});
