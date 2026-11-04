// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../data/db';
import { dayKey } from '../../core/time';

const mock = vi.hoisted(() => ({ tapHaptic: vi.fn().mockResolvedValue(undefined), playCastSound: vi.fn(), reconcileGamify: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../../platform/haptics', () => ({ tapHaptic: mock.tapHaptic }));
vi.mock('../cast/sound', () => ({ playCastSound: mock.playCastSound }));
// Reconcile (badges, quests, closes) is tested on its own; here it would race the finish under test.
vi.mock('../../data/repos/gamify', () => ({ reconcileGamify: mock.reconcileGamify, recordShown: () => Promise.resolve() }));
import { EconomyFeedback } from './EconomyFeedback';

// Economy review 32, F1 and F2: nothing celebrates after bedtime, and the count-up respects reduced motion.
const settle = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 80)); });
/** Every finish toast that appeared, as text and class, so a toast that already closed is still seen. */
async function finishTask(time: string, withBadge = false) {
  vi.setSystemTime(new Date(time));
  const seen: { text: string; className: string }[] = [];
  const observer = new MutationObserver(() => document.querySelectorAll('[role=status]').forEach(node => seen.push({ text: node.textContent ?? '', className: node.className })));
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
  render(<EconomyFeedback />);
  // The first load calls reconcile: only after it is a new fact a fresh finish.
  await waitFor(() => expect(mock.reconcileGamify).toHaveBeenCalled());
  await settle();
  const now = Date.now(), day = dayKey(now);
  await act(async () => { await db.ledger.bulkAdd([{ id: `done:${day}`, mode: 'tasks', kind: 'done', refId: day, dayKey: day,
    inputs: { plannedSize: 'M', isFirstDay: true, wasPlanned: true, postpones: 0 }, updatedAt: now, deleted: 0, deviceId: 'test' },
    // The badge reconcile writes can land in the same update as the finish that earned it.
    ...(withBadge ? [{ id: `badge-tier:first:${day}`, mode: 'gamify', kind: 'badge-tier', refId: 'first', dayKey: day, inputs: {}, updatedAt: now, deleted: 0 as const, deviceId: 'test' }] : [])]); });
  await settle();
  return seen;
}

beforeEach(async () => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) });
  delete document.documentElement.dataset.motion;
  await Promise.all([db.ledger.clear(), db.settings.clear(), db.learnDrops.clear()]);
  try { sessionStorage.clear(); localStorage.clear(); } catch { /* ignore */ }
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('economy feedback', () => {
  it('celebrates a finished task in the day', async () => {
    const seen = await finishTask('2026-11-03T12:00:00');
    // The count-up runs on animation frames (frozen with a fixed clock here), so any count is fine; never below 0.
    await waitFor(() => expect(seen.some(toast => /^\+\d+ XP today · /.test(toast.text))).toBe(true));
    expect(mock.tapHaptic).toHaveBeenCalled();
  });

  it('spec 52: a badge tier landing in the same update does not swallow the finish; it joins its line', async () => {
    const seen = await finishTask('2026-10-22T12:00:00', true);
    expect(seen.some(row => row.className.includes('finish-moment') && row.text.includes('A new badge tier'))).toBe(true);
  });
  it('spec 52: a first idea landing with its badge tiers, quest and drop fact (6 rows at once) still shows its finish', async () => {
    vi.setSystemTime(new Date('2026-11-04T12:00:00'));
    const now = Date.now(), day = dayKey(now);
    const drop = (cursor: number) => ({ id: `drop:daily:${day}`, drop: { items: [{}, {}], cursor }, updatedAt: Date.now(), deleted: 0 as const, deviceId: 'test' }) as never;
    await db.learnDrops.put(drop(1));
    const seen: string[] = [];
    const observer = new MutationObserver(() => document.querySelectorAll('.finish-moment').forEach(node => seen.push(node.textContent ?? '')));
    observer.observe(document.body, { subtree: true, childList: true });
    render(<EconomyFeedback />);
    await waitFor(() => expect(mock.reconcileGamify).toHaveBeenCalled());
    await settle();
    const fact = (mode: string, kind: string, refId: string) => ({ id: `${kind}:${refId}`, mode, kind, refId, dayKey: day, inputs: {}, updatedAt: now, deleted: 0 as const, deviceId: 'test' });
    // What the gate saw in 2 of 32 runs: the idea's own two facts and reconcile's four, in one live-query update.
    await act(async () => { await db.transaction('rw', db.ledger, db.learnDrops, async () => {
      await db.learnDrops.put(drop(2));
      await db.ledger.bulkAdd([fact('learn', 'learn-lesson', 'l1'), fact('read', 'idea', 'i1'), fact('gamify', 'badge-tier', 'first:1'), fact('gamify', 'badge-tier', 'reader:1'), fact('gamify', 'daily-quest', `${day}:learn`), fact('gamify', 'learn-drop', day)]);
    }); });
    await settle();
    observer.disconnect();
    expect(seen.some(text => text.includes('A new badge tier'))).toBe(true);
  });

  it('spec 52: a restore stays quiet: old facts in bulk, reconcile rows alone, or a few old facts with fresh reconcile rows', async () => {
    vi.setSystemTime(new Date('2026-11-04T12:00:00'));
    const now = Date.now(), day = dayKey(now);
    render(<EconomyFeedback />);
    await waitFor(() => expect(mock.reconcileGamify).toHaveBeenCalled());
    await settle();
    // Restored facts keep their own (older) times; six fresh reconcile rows with no fact of the person's are not a finish.
    await act(async () => { await db.ledger.bulkAdd(Array.from({ length: 8 }, (_, index) => ({ id: `done:${index}`, mode: 'tasks', kind: 'done', refId: String(index), dayKey: day, inputs: { plannedSize: 'M', wasPlanned: true, postpones: 0 }, updatedAt: now - 86_400_000, deleted: 0 as const, deviceId: 'test' }))); });
    await settle();
    await act(async () => { await db.ledger.bulkAdd(Array.from({ length: 6 }, (_, index) => ({ id: `badge-tier:b${index}:1`, mode: 'gamify', kind: 'badge-tier', refId: `b${index}:1`, dayKey: day, inputs: {}, updatedAt: now, deleted: 0 as const, deviceId: 'test' }))); });
    await settle();
    // A small restore: 3 of the person's facts (importInto keeps their own times) and 4 fresh reconcile rows, one update.
    await act(async () => { await db.ledger.bulkAdd([
      ...[1, 2, 3].map(index => ({ id: `done:small${index}`, mode: 'tasks', kind: 'done', refId: `small${index}`, dayKey: '2026-11-01', inputs: { plannedSize: 'M', wasPlanned: true, postpones: 0 }, updatedAt: now - 3 * 86_400_000, deleted: 0 as const, deviceId: 'old-phone' })),
      ...['badge-tier', 'daily-quest', 'learn-drop', 'welcome-back'].map(kind => ({ id: `${kind}:small`, mode: 'gamify', kind, refId: 'small', dayKey: day, inputs: {}, updatedAt: now, deleted: 0 as const, deviceId: 'test' })),
    ]); });
    await settle();
    expect(document.querySelector('.finish-moment')).toBeNull();
    expect(mock.tapHaptic).not.toHaveBeenCalled();
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
    await waitFor(() => expect(seen.some(toast => /^\+[1-9]\d* XP today · /.test(toast.text))).toBe(true));
    // The full number from the first frame: never a count from 0, and no bloom.
    expect(seen.every(toast => !/^\+0 XP/.test(toast.text) && !toast.className.includes('finish-bloom'))).toBe(true);
    expect(mock.playCastSound).not.toHaveBeenCalled();
  });

  // Spec 45c: a real level rise opens the level page in place of the season reveal; it is one dialog with one way on.
  const nearLevelTwo = (day: string) => db.ledger.add({ id: `train-session:${day}`, mode: 'train', kind: 'session', refId: day, dayKey: day,
    inputs: { xp: 95 }, updatedAt: new Date(`${day}T09:00:00`).getTime(), deleted: 0, deviceId: 'test' });
  it('45c: a level rise opens the level page, with the five friends and Continue only', async () => {
    await nearLevelTwo('2026-11-03');
    await finishTask('2026-11-03T12:00:00');
    const page = await waitFor(() => { const node = document.querySelector('[role=dialog]'); expect(node?.getAttribute('aria-label')).toBe('Level 2'); return node!; });
    expect(document.querySelectorAll('[role=dialog]')).toHaveLength(1);
    expect(page.querySelectorAll('.level-friends [data-cast]')).toHaveLength(5);
    expect([...page.querySelectorAll('button')].map(button => button.textContent)).toEqual(['Continue']);
    expect(page.querySelector('.level-sheet')!.className).not.toContain('is-still');
    expect(page.textContent).not.toMatch(/Season progress|Skip reveal/);
  });

  it('45c: with Motion off the level page is a still scene', async () => {
    document.documentElement.dataset.motion = 'reduce';
    await nearLevelTwo('2026-11-05');
    await finishTask('2026-11-05T12:00:00');
    const page = await waitFor(() => { const node = document.querySelector('[role=dialog]'); expect(node?.getAttribute('aria-label')).toBe('Level 2'); return node!; });
    expect(page.querySelector('.level-sheet')!.className).toContain('is-still');
    expect(mock.playCastSound).not.toHaveBeenCalled();
  });
});
