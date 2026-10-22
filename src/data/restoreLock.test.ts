import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

/** An exclusive Web Lock shared by every "tab" (each tab is a fresh copy of the module). */
function fakeLocks() {
  const names: string[] = [];
  let tail = Promise.resolve();
  return {
    names,
    request<T>(name: string, run: () => Promise<T>): Promise<T> {
      names.push(name);
      const result = tail.then(run);
      tail = result.then(() => undefined, () => undefined);
      return result;
    },
  };
}
const tab = async () => { vi.resetModules(); return import('./restoreLock'); };
const tick = () => new Promise(resolve => setTimeout(resolve, 20));

it('a restore in one tab waits for a reconcile running in another tab (second opinion 28)', async () => {
  const locks = fakeLocks();
  vi.stubGlobal('navigator', { locks });
  const first = await tab(), second = await tab();
  let release!: () => void;
  const reconcile = first.asReconcile(() => new Promise<void>(resolve => { release = resolve; }));
  let restored = false;
  const restore = second.duringRestore(async () => { restored = true; });
  await tick();
  expect(restored).toBe(false);
  release();
  await Promise.all([reconcile, restore]);
  expect(restored).toBe(true);
  expect(locks.names).toEqual(['nandi-economy', 'nandi-economy']);
});

it('a failed restore lets the next reconcile run', async () => {
  vi.stubGlobal('navigator', { locks: fakeLocks() });
  const lock = await tab();
  await expect(lock.duringRestore(async () => { throw new Error('bad file'); })).rejects.toThrow('bad file');
  expect(lock.restoreActive()).toBe(false);
  await expect(lock.asReconcile(async () => 'ran')).resolves.toBe('ran');
});

it('without Web Locks the in-tab guard still works', async () => {
  vi.stubGlobal('navigator', {});
  const lock = await tab();
  await expect(lock.asReconcile(async () => 'ran')).resolves.toBe('ran');
  await expect(lock.duringRestore(async () => 'restored')).resolves.toBe('restored');
});
