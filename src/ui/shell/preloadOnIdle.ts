export function preloadOnIdle(load: () => Promise<unknown>): () => void {
  const run = () => { void load(); };
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(run);
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(run, 1000);
  return () => window.clearTimeout(id);
}
