/**
 * Keeps a backup restore and reconcileGamify apart. While a restore runs, reconcile returns at once; a restore
 * first waits for any reconcile already running, so the two never interleave (second opinions 25, 26).
 */
let active = 0;
const running = new Set<Promise<unknown>>();
export const restoreActive = () => active > 0;
export async function duringRestore<T>(run: () => Promise<T>): Promise<T> {
  active++;
  try {
    await Promise.allSettled([...running]);
    return await run();
  } finally { active--; }
}
/** Marks a reconcile as running, so a restore that starts meanwhile waits for it to finish. */
export function asReconcile<T>(work: Promise<T>): Promise<T> {
  running.add(work);
  void work.finally(() => running.delete(work)).catch(() => undefined);
  return work;
}
