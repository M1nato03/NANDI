import { DEFAULT_PAUSE_APPS, readDayLimit, readDayMode } from './nightPause';
import { RULES } from './rules.config';
import type { LedgerRow, SettingRow } from '../data/types';

/**
 * Spec 39, the Pause card: an upgrade of the night pause's day mode, not a second system. When a picked app comes to
 * the front inside the window, NANDI shows the person's own plan ("If I open Instagram, I'll do 10 squats first.") with
 * a 2-minute act, "Not now" and "Open Instagram anyway", all one tap. The same service, package list and snooze (now the
 * grace period) run it; the setup lives at Plan → Pause card.
 */
export const PAUSE_KEYS = { on: 'pause.card.on', act: 'pause.act', window: 'pause.window', grace: 'pause.grace', offDay: 'pause.offDay' } as const;

/** The apps the setup offers first (nothing ticked): the usual scroll apps and Indian short-video apps. */
export const PAUSE_APP_CHOICES: readonly { label: string; packageName: string }[] = [
  ...DEFAULT_PAUSE_APPS,
  { label: 'Facebook', packageName: 'com.facebook.katana' },
  { label: 'X', packageName: 'com.twitter.android' },
  { label: 'Threads', packageName: 'com.instagram.barcelona' },
  { label: 'Moj', packageName: 'in.mohalla.video' },
  { label: 'Josh', packageName: 'com.eterno.shortvideos' },
  { label: 'ShareChat', packageName: 'in.mohalla.sharechat' },
];

/** Quick picks for the act. They lean offline and social: exercise, people and nature carried the gains. */
export const PAUSE_ACTS: readonly string[] = [
  'do 10 squats',
  'step outside for 2 minutes',
  'text or call someone',
  'read one page of a paper book',
  'drink a glass of water',
  'take a 2-minute breath with Kachhua',
  'write one line in my journal',
];

export const GRACE_CHOICES = [5, 10, 20] as const;
export const GRACE_DEFAULT = 10;

export type PauseWindow = { from: string; to: string } | null;
export interface PauseCard {
  /** On, either from the setup or kept from the old day mode (night pause on with a day mode). */
  on: boolean;
  /** Kept from the old day mode and not yet set up again here. */
  legacy: boolean;
  /** The person's act ("do 10 squats"), or null until they write one. */
  act: string | null;
  /** null: all day until bedtime (the night window takes over there). */
  window: PauseWindow;
  grace: number;
  mode: 'open' | 'limit';
  limitMin: number;
  packages: string[];
  offToday: boolean;
}

const value = (settings: readonly SettingRow[], key: string) => settings.find(row => row.key === key && !row.deleted)?.value;
const clock = (text: unknown): text is string => typeof text === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(text);

export function readPauseWindow(raw: unknown): PauseWindow {
  if (!raw || typeof raw !== 'object') return null;
  const { from, to } = raw as { from?: unknown; to?: unknown };
  return clock(from) && clock(to) && from !== to ? { from, to } : null;
}

export function readGrace(raw: unknown): number {
  return typeof raw === 'number' && (GRACE_CHOICES as readonly number[]).includes(raw) ? raw : GRACE_DEFAULT;
}

/** The act as it reads after "I'll": trimmed, without a closing full stop or a leading "I'll". */
export function cleanAct(text: string): string {
  return text.trim().replace(/^i('|’)?ll\s+/i, '').replace(/[.!\s]+$/, '').slice(0, 80);
}

export function readPauseCard(settings: readonly SettingRow[], today: string): PauseCard {
  const stored = value(settings, PAUSE_KEYS.on);
  const nightOn = value(settings, 'night.pause.enabled') === true;
  const dayMode = readDayMode(value(settings, 'night.pause.dayMode'));
  // Spec 39 migration (jenil-87): the night pause with a day mode already paused apps by day; it stays on.
  const legacy = stored === undefined && nightOn && dayMode !== 'off';
  const act = value(settings, PAUSE_KEYS.act);
  const apps = value(settings, 'night.pause.apps');
  return {
    on: stored === true || legacy,
    legacy,
    act: typeof act === 'string' && cleanAct(act) ? cleanAct(act) : null,
    window: readPauseWindow(value(settings, PAUSE_KEYS.window)),
    grace: readGrace(value(settings, PAUSE_KEYS.grace)),
    // New setups default to every open; the old day pause defaulted to a daily limit, so a kept one stays that way.
    mode: dayMode === 'limit' && (value(settings, 'night.pause.dayMode') !== undefined || legacy) ? 'limit' : 'open',
    limitMin: readDayLimit(value(settings, 'night.pause.dayLimitMin')),
    packages: Array.isArray(apps) ? apps.filter((item): item is string => typeof item === 'string') : DEFAULT_PAUSE_APPS.map(app => app.packageName),
    offToday: value(settings, PAUSE_KEYS.offDay) === today,
  };
}

/** The app's name for a package, or "the app". */
export function pauseAppLabel(packageName: string, extra: readonly { label: string; packageName: string }[] = []): string {
  return [...PAUSE_APP_CHOICES, ...extra].find(app => app.packageName === packageName)?.label ?? 'the app';
}

/** "If I open Instagram, I'll do 10 squats first." Until an act is written: "Take 2 minutes first." */
export function pauseLine(label: string, act: string | null): string {
  return act ? `If I open ${label}, I'll ${act} first.` : 'Take 2 minutes first.';
}

/** "From 09:00 to 21:00" or "All day until bedtime". */
export function windowText(window: PauseWindow): string {
  return window ? `From ${window.from} to ${window.to}` : 'All day until bedtime';
}

/** Today's finished acts, and whether the next one still pays (2 XP each, 10 a day). */
export function actsToday(facts: readonly LedgerRow[], today: string): { done: number; nextPays: boolean } {
  const done = facts.filter(row => !row.deleted && row.mode === 'pause' && row.kind === 'attempt' && row.dayKey === today && row.inputs.outcome === 'act_done').length;
  return { done, nextPays: (done + 1) * RULES.pause.actXp <= RULES.pause.dailyCap };
}
