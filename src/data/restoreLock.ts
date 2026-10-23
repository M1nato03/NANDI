/**
 * Keeps a backup restore and reconcileGamify apart. While a restore runs, reconcile returns at once; a restore
 * first waits for any reconcile already running, so the two never interleave (second opinions 25, 26). On the
 * web each tab has its own copy of this module, so where the browser has Web Locks both also take one shared
 * lock, and a restore in one tab and a reconcile in another run one after the other (second opinion 28).
 */
type Locks = { request<T>(name: string, run: () => Promise<T>): Promise<T> };
const LOCK = 'nandi-economy';
let active = 0;
const running = new Set<Promise<unknown>>();
function shared<T>(run: () => Promise<T>): Promise<T> {
  const locks = (globalThis.navigator as { locks?: Locks } | undefined)?.locks;
  return locks?.request ? locks.request(LOCK, () => run()) : run();
}
export const restoreActive = () => active > 0;
export async function duringRestore<T>(run: () => Promise<T>): Promise<T> {
  active++;
  try {
    await Promise.allSettled([...running]);
    return await shared(run);
  } finally { active--; }
}
/** Runs a reconcile and marks it as running, so a restore that starts meanwhile waits for it to finish. */
export function asReconcile<T>(work: () => Promise<T>): Promise<T> {
  const done = shared(work);
  running.add(done);
  void done.finally(() => running.delete(done)).catch(() => undefined);
  return done;
}
/**
 * A shop purchase takes the same lock and counts as running, so it never commits between a restore's first reads
 * and its clear (Codex review of cj3, item 44: it would return ok and then vanish).
 */
export const asEconomyWrite = asReconcile;
