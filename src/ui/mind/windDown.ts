/** Counts only visible time and flushes each departure before the browser suspends. */
export function trackWindDownTime(save: (usedMs: number, at: number) => void, initialMs: number, capMs: number, now = Date.now): () => void {
  let used = initialMs;
  let last = now();
  let visible = document.visibilityState === 'visible';
  const flush = () => {
    const at = now();
    const delta = visible ? Math.max(0, at - last) : 0;
    last = at;
    if (delta > 0 && used < capMs) {
      used = Math.min(capMs, used + delta);
      save(used, at);
    }
  };
  const visibility = () => { flush(); visible = document.visibilityState === 'visible'; last = now(); };
  const pagehide = () => { flush(); visible = false; };
  const pageshow = () => { visible = document.visibilityState === 'visible'; last = now(); };
  const interval = window.setInterval(flush, 5000);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('pagehide', pagehide);
  window.addEventListener('pageshow', pageshow);
  return () => {
    flush();
    window.clearInterval(interval);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('pagehide', pagehide);
    window.removeEventListener('pageshow', pageshow);
  };
}
