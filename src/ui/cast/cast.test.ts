import { describe, expect, it, vi } from 'vitest';
import { dropCast, finishCast } from './placement';
import { completedModuleKey } from './UnitScene';

describe('cast placement', () => {
  it('uses the intended friend for each finish and a memory keeper for review', () => {
    expect(finishCast.task.name).toBe('Nandi');
    expect(finishCast.learn.name).toBe('Chiku');
    expect(finishCast.puzzle.name).toBe('Kapi');
    expect(finishCast.night.name).toBe('Kachhua');
    expect(dropCast(false, undefined)).toEqual({ name: 'Chiku', pose: 'think' });
    expect(dropCast(false, true)).toEqual({ name: 'Chiku', pose: 'cheer' });
    expect(dropCast(true, false)).toEqual({ name: 'Moti', pose: 'think' });
  });
  it('selects a fully learned module only once', () => {
    const modules = [{ id: 'one', concepts: [{ id: 'a' }, { id: 'b' }] }, { id: 'two', concepts: [{ id: 'c' }] }];
    expect(completedModuleKey(modules, new Set(['a']), () => false)).toBeUndefined();
    expect(completedModuleKey(modules, new Set(['a', 'b']), () => false)).toBe('one');
    expect(completedModuleKey(modules, new Set(['a', 'b']), id => id === 'one')).toBeUndefined();
  });
});

describe('opening', () => {
  it('appears once per cold module run and skips night, pause, and reduced motion', async () => {
    vi.resetModules();
    const { shouldOpen } = await import('./OpenMoment');
    expect(shouldOpen({ night: false, pause: false, reduced: false })).toBe(true);
    expect(shouldOpen({ night: false, pause: false, reduced: false })).toBe(false);
    vi.resetModules();
    const next = await import('./OpenMoment');
    expect(next.shouldOpen({ night: true, pause: false, reduced: false })).toBe(false);
    vi.resetModules();
    const paused = await import('./OpenMoment');
    expect(paused.shouldOpen({ night: false, pause: true, reduced: false })).toBe(false);
    vi.resetModules();
    const reduced = await import('./OpenMoment');
    expect(reduced.shouldOpen({ night: false, pause: false, reduced: true })).toBe(false);
  });
});
