/**
 * Set while a backup restore runs. Background writers that derive from the whole database (reconcileGamify)
 * wait for the next tick instead of reading half-cleared tables; the app remounts them after the restore.
 */
let active = 0;
export const restoreActive = () => active > 0;
export async function duringRestore<T>(run: () => Promise<T>): Promise<T> {
  active++;
  try { return await run(); } finally { active--; }
}
