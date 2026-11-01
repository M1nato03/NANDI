import type { GuardEvent } from '../focusGuard';

/** Read from this long before a day starts, so an app already in front at midnight is known. */
export const LEAD_MS = 12 * 60 * 60 * 1000;
/** An app in front with no event at all for this long (no screen change, no other screen): the log may have lost events. */
export const GAP_MS = 4 * 60 * 60 * 1000;

export interface DayMeasure {
  /** Foreground milliseconds per package inside [fromMs, toMs], summed raw (never rounded per stretch). */
  ms: Record<string, number>;
  /** The log shows a screen-off, lock, start-up or shutdown before the day began, so what was open at midnight is known. */
  boundaryKnown: boolean;
  /** Apps in front when the phone started up without shutting down first (it died): when they stopped is unknown. */
  rebootAmbiguous: string[];
  /** Apps in front across a stretch of GAP_MS with no event at all inside the day. */
  gaps: string[];
}

/**
 * Spec 46a: each package's time in front on one day, from Android's usage log read from `readFrom` (LEAD_MS before
 * the day) to `toMs`. The same rule as the focus check (core/focusGuard): an app is in front while any of its screens
 * is resumed and the screen is on; a lock or screen-off pauses it, a start-up or shutdown closes everything. Several
 * apps can be in front at once (split screen), and each counts its own time.
 */
export function measureDay(events: readonly GuardEvent[], readFrom: number, fromMs: number, toMs: number, packages: readonly string[]): DayMeasure {
  const tracked = new Set(packages);
  const open = new Map<string, string>();
  let dark = false, downSinceBoot = false, boundaryKnown = false;
  let lastAt: number | null = null;
  const since = new Map<string, number>();
  const ms: Record<string, number> = Object.fromEntries(packages.map(pkg => [pkg, 0]));
  const ambiguous = new Set<string>(), gaps = new Set<string>();
  const inFront = () => new Set(dark ? [] : [...open.values()].filter(pkg => tracked.has(pkg)));
  const add = (pkg: string, start: number, end: number) => { ms[pkg] = (ms[pkg] ?? 0) + Math.max(0, Math.min(end, toMs) - Math.max(start, fromMs)); };
  const gapCheck = (end: number) => {
    if (lastAt === null || end - lastAt <= GAP_MS || Math.min(end, toMs) - Math.max(lastAt, fromMs) <= 0) return;
    for (const pkg of inFront()) gaps.add(pkg);
  };
  const sorted = events.filter(event => Number.isFinite(event.at) && event.at > readFrom && event.at <= toMs).sort((a, b) => a.at - b.at);
  for (const event of sorted) {
    gapCheck(event.at);
    const before = inFront();
    const key = `${event.pkg ?? ''}/${event.cls ?? ''}`;
    if (event.type === 'fg' && event.pkg) open.set(key, event.pkg);
    else if (event.type === 'bg' && event.pkg) open.delete(key);
    else if (event.type === 'boot') {
      if (!downSinceBoot && event.at > fromMs) for (const pkg of before) ambiguous.add(pkg);
      open.clear(); dark = false; downSinceBoot = false;
    } else if (event.type === 'down') { open.clear(); dark = true; downSinceBoot = true; }
    else if (event.type === 'off' || event.type === 'lock') dark = true;
    else if (event.type === 'on') dark = false;
    if (event.at <= fromMs && (event.type === 'off' || event.type === 'lock' || event.type === 'boot' || event.type === 'down')) boundaryKnown = true;
    const after = inFront();
    for (const pkg of before) if (!after.has(pkg)) { add(pkg, since.get(pkg)!, event.at); since.delete(pkg); }
    for (const pkg of after) if (!before.has(pkg)) since.set(pkg, event.at);
    lastAt = event.at;
  }
  gapCheck(toMs);
  for (const [pkg, start] of since) add(pkg, start, toMs);
  return { ms, boundaryKnown, rebootAmbiguous: [...ambiguous], gaps: [...gaps] };
}
