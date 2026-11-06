import { describe, expect, it } from 'vitest';
import { finishLines } from './finish';
import { closeToast, emptyToastQueue, enqueueToast, finishToastText, nextToast, toastWords, welcomeToastLine, type Notice } from './toastQueue';
import { jarActs, jarFinishLine, type JarEntry } from '../../core/yatra/jar';
import type { LedgerRow } from '../../data/types';

const finish: Notice = { text: 'One thing settled.', macro: false };
const jar: Notice = { text: 'A good place to pause.', jar: '+5 min into the jar · chapter done', macro: false };
const level: Notice = { text: 'Level 2 · 100 XP', macro: true, level: 2 };
const badge: Notice = { text: 'A new badge tier', macro: false, kind: 'badge' };

describe('one notice at a time', () => {
  it('picks the jar before XP, finish, quest and level notices, without changing its input', () => {
    const pending = [finish, { text: '+5 XP today', macro: false }, { text: 'Today’s task is done.', macro: false }, level, badge, jar];
    expect(nextToast(pending)).toBe(jar);
    expect(pending).toHaveLength(6);
    expect(nextToast([badge])).toBeNull();
  });

  it('keeps the current notice until close, then drains jar first and the rest in order', () => {
    let queue = enqueueToast(emptyToastQueue, finish);
    queue = enqueueToast(queue, level);
    queue = enqueueToast(queue, jar);
    expect(queue.current).toBe(finish);
    expect(queue.pending).toEqual([level, jar]);
    queue = closeToast(queue);
    expect(queue.current).toBe(jar);
    queue = closeToast(queue);
    expect(queue.current).toBe(level);
    expect(closeToast(queue)).toEqual(emptyToastQueue);
  });

  it('drops only badge pops, leaving other waiting notices intact', () => {
    const queue = enqueueToast(emptyToastQueue, finish);
    expect(enqueueToast(queue, badge)).toBe(queue);
    expect(enqueueToast(emptyToastQueue, badge)).toBe(emptyToastQueue);
  });

  it('shows the jar earned with a level before opening its page', () => {
    const queue = enqueueToast(emptyToastQueue, { ...level, jar: jar.jar });
    expect(queue.current?.macro).toBe(false);
    expect(queue.current?.jar).toBe(jar.jar);
    expect(closeToast(queue).current).toEqual(level);
  });
});

describe('every generated finish toast is at most eight words', () => {
  // Walk the real jar generator for every supported fact kind, plus ended focus.
  const now = new Date('2026-11-05T12:00:00').getTime();
  const facts = [
    ['train', 'session', { xp: 10 }], ['mind', 'board', {}], ['mind', 'mystery', {}],
    ['calm', 'session', {}], ['read', 'chapter', {}], ['read', 'idea', {}],
    ['mind', 'lesson', {}], ['bonuses', 'lightsout', { metTarget: true }],
  ].map(([mode, kind, inputs], index) => ({ id: String(index), mode, kind, inputs, dayKey: '2026-11-05', updatedAt: now, deleted: 0 })) as LedgerRow[];
  const acts = jarActs(facts, [{ id: 'focus', taskId: 'task', startedAt: now - 30 * 60_000, endedAt: now, updatedAt: now, deleted: 0, deviceId: 'test' }]);
  const jars = acts.flatMap(act => [0, 1, 5, 10, 60].flatMap(counted => [false, true].map(capped => jarFinishLine({ ...act, counted } as JarEntry, capped))));

  it('covers all jar paths, including focus and the daily cap', () => {
    expect(acts).toHaveLength(9);
    expect(jars).toContain('Trail done for today.');
  });

  it('walks every finish line, welcome gift, XP count and jar variant', () => {
    for (const line of [...Object.values(finishLines).flat(), welcomeToastLine]) {
      for (const gain of [0, 1, 100_000]) {
        for (const shown of [0, 1, 100_000]) {
          for (const jarLine of [undefined, ...jars.filter((value): value is string => value !== null)]) {
            const text = finishToastText(line, gain, shown, jarLine);
            expect(toastWords(text), text).toBeLessThanOrEqual(8);
            // The jar line wins, whole when it fits; otherwise the warm line is never dropped for a bare count.
            if (jarLine) expect(text).toBe(toastWords(jarLine) <= 8 ? jarLine : jarLine.split(' · ')[0]);
            else expect(text.endsWith(line), text).toBe(true);
          }
        }
      }
    }
  });
});
