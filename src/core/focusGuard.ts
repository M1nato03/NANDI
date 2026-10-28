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
