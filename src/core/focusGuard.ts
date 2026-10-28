import { DEFAULT_PAUSE_APPS } from './nightPause';

/**
 * Spec 36 focus guard (Jenil's idea, 28 Oct): while a focus runs, these apps in front pause it. The list cannot be made
 * shorter; the apps chosen for App pause in Night settings are added to it.
 */
export const FOCUS_GUARD_APPS = [
  ...DEFAULT_PAUSE_APPS,
  { label: 'Facebook', packageName: 'com.facebook.katana' },
  { label: 'X', packageName: 'com.twitter.android' },
  { label: 'Threads', packageName: 'com.instagram.barcelona' },
] as const;

/** The guarded packages: the fixed list plus the Night picks, each once. */
export function guardedPackages(nightPicks: unknown): string[] {
  const picks = Array.isArray(nightPicks) ? nightPicks.filter((item): item is string => typeof item === 'string' && /^[\w.]+$/.test(item)) : [];
  return [...new Set([...FOCUS_GUARD_APPS.map(app => app.packageName), ...picks])];
}

/** A short name for a guarded app, for "You opened <app>". */
export function guardAppName(packageName: string): string {
  return FOCUS_GUARD_APPS.find(app => app.packageName === packageName)?.label ?? packageName.split('.').at(-1) ?? packageName;
}

export type GuardEvent = { type: 'fg' | 'bg' | 'on' | 'off' | 'boot' | 'down' | 'lock'; at: number; pkg?: string; cls?: string };

/**
 * Spec 36: when a guarded app was in front during a focus, read from Android's own usage log (it keeps recording even
 * if NANDI's watcher is stopped, so a killed watcher can never make unwatched time pay). The focus began in NANDI, so
 * nothing guarded was open at `fromMs`. A guarded app counts while any of its screens is resumed and the screen is lit;
 * a start-up or shutdown closes everything. Returns merged [start, end] spans inside [fromMs, toMs].
 */
export function guardedSpans(events: readonly GuardEvent[], fromMs: number, toMs: number, packages: readonly string[]): [number, number][] {
  const guarded = new Set(packages);
  const open = new Map<string, string>();
  let dark = false, since: number | null = null;
  const spans: [number, number][] = [];
  const inFront = () => !dark && [...open.values()].some(pkg => guarded.has(pkg));
  const sorted = [...events].filter(event => Number.isFinite(event.at) && event.at > fromMs && event.at <= toMs).sort((a, b) => a.at - b.at);
  for (const event of sorted) {
    const before = inFront();
    const key = `${event.pkg ?? ''}/${event.cls ?? ''}`;
    if (event.type === 'fg' && event.pkg) open.set(key, event.pkg);
    else if (event.type === 'bg' && event.pkg) open.delete(key);
    else if (event.type === 'boot' || event.type === 'down') { open.clear(); dark = event.type === 'down'; }
    else if (event.type === 'off' || event.type === 'lock') dark = true;
    else if (event.type === 'on') dark = false;
    const after = inFront();
    if (!before && after) since = event.at;
    else if (before && !after && since != null) { spans.push([since, event.at]); since = null; }
  }
  if (since != null && toMs > since) spans.push([since, toMs]);
  return spans;
}

/** The part of the spans that fell while the focus ran (a paused stretch is not focus time, so it is not taken off). */
export function distractedWithin(spans: readonly (readonly [number, number])[], focus: { startedAt: number; pauses?: { at: number; resumeAt?: number }[]; endedAt?: number }, now: number): number {
  const stop = focus.endedAt ?? now;
  const runs: [number, number][] = [];
  let from: number | undefined = focus.startedAt;
  for (const pause of focus.pauses ?? []) { if (from != null) runs.push([from, Math.min(pause.at, stop)]); from = pause.resumeAt; }
  if (from != null) runs.push([from, stop]);
  return spans.reduce((sum, [a, b]) => sum + runs.reduce((inner, [x, y]) => inner + Math.max(0, Math.min(b, y) - Math.max(a, x)), 0), 0);
}
