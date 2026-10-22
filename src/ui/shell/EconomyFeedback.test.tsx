// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../data/db';
import { dayKey } from '../../core/time';

const mock = vi.hoisted(() => ({ tapHaptic: vi.fn().mockResolvedValue(undefined), playCastSound: vi.fn(), reconcileGamify: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../../platform/haptics', () => ({ tapHaptic: mock.tapHaptic }));
vi.mock('../cast/sound', () => ({ playCastSound: mock.playCastSound }));
// Reconcile (badges, quests, closes) is tested on its own; here it would race the finish under test.
vi.mock('../../data/repos/gamify', () => ({ reconcileGamify: mock.reconcileGamify }));
import { EconomyFeedback } from './EconomyFeedback';

// Economy review 32, F1 and F2: nothing celebrates after bedtime, and the count-up respects reduced motion.
const settle = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 80)); });
/** Every finish toast that appeared, as text and class, so a toast that already closed is still seen. */
async function finishTask(time: string) {
  vi.setSystemTime(new Date(time));
  const seen: { text: string; className: string }[] = [];
  const observer = new MutationObserver(() => document.querySelectorAll('[role=status]').forEach(node => seen.push({ text: node.textContent ?? '', className: node.className })));
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
  render(<EconomyFeedback />);
  // The first load calls reconcile: only after it is a new fact a fresh finish.
  await waitFor(() => expect(mock.reconcileGamify).toHaveBeenCalled());
  await settle();
  const now = Date.now(), day = dayKey(now);
  await act(async () => { await db.ledger.add({ id: `done:${day}`, mode: 'tasks', kind: 'done', refId: day, dayKey: day,
    inputs: { plannedSize: 'M', isFirstDay: true, wasPlanned: true, postpones: 0 }, updatedAt: now, deleted: 0, deviceId: 'test' }); });
  await settle();
  return seen;
}

beforeEach(async () => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) });
  delete document.documentElement.dataset.motion;
  await Promise.all([db.ledger.clear(), db.settings.clear()]);
  try { sessionStorage.clear(); localStorage.clear(); } catch { /* ignore */ }
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('economy feedback', () => {
  it('celebrates a finished task in the day', async () => {
    const seen = await finishTask('2026-11-03T12:00:00');
    // The count-up runs on animation frames (frozen with a fixed clock here), so any count is fine; never below 0.
    await waitFor(() => expect(seen.some(toast => /^\+\d+ XP · /.test(toast.text))).toBe(true));
    expect(mock.tapHaptic).toHaveBeenCalled();
  });

  it('F1: after bedtime a finished task gets no buzz and no +XP overlay', async () => {
    const seen = await finishTask('2026-11-04T02:00:00');
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 300)); });
    expect(seen).toEqual([]);
    expect(mock.tapHaptic).not.toHaveBeenCalled();
    expect(mock.playCastSound).not.toHaveBeenCalled();
  });

  it('F2: with Motion off the XP shows in full at once, with no bloom and no sound', async () => {
    document.documentElement.dataset.motion = 'reduce';
    const seen = await finishTask('2026-11-05T12:00:00');
    await waitFor(() => expect(seen.some(toast => /^\+[1-9]\d* XP · /.test(toast.text))).toBe(true));
    // The full number from the first frame: never a count from 0, and no bloom.
    expect(seen.every(toast => !/^\+0 XP/.test(toast.text) && !toast.className.includes('finish-bloom'))).toBe(true);
    expect(mock.playCastSound).not.toHaveBeenCalled();
  });
});
