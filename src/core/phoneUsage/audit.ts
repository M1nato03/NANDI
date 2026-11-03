import type { PhoneUsageRow, SettingRow } from '../../data/types';
import { PHONE_USAGE_CATALOG } from '../rules.config';
import { addCalendarDays } from './calendarDay';
import type { UnknownReason } from './coverage';
import { PHONE_USAGE_KEYS, trackedPackages } from './baseline';
import { MEASURE_VERSION } from './measure';

/**
 * Spec 46b: the owner's audit of the daily minutes record. The owner lays the last 30 finished days beside Digital
 * Wellbeing's per-app totals and, only after checking them, marks the audit passed. The pass is fail-closed: it holds
 * only for the same apps, catalog, measuring rules and phone it was given on, and a later day where Android showed more
 * than the record (a possible undercount) ends it. Nothing here reads or exports raw usage events, only the stored rows.
 */
export const AUDIT_DAYS = 30;

export interface AuditPackage {
  packageName: string;
  group: 'picked' | 'substitute';
  foregroundMs: number | null;
  reason?: UnknownReason;
  installed: boolean | null;
  crossCheckMs: number | null;
}
export interface AuditDay {
  day: string;
  /** The day has rows (it was read at least once). */
  recorded: boolean;
  /** Every app the day was measured with has a measured row, all under one set of apps. */
  complete: boolean;
  /** Sums in raw milliseconds; null when any app in the group is unknown or missing. */
  pickedMs: number | null;
  substituteMs: number | null;
  reasons: UnknownReason[];
  setId: string | null;
  packages: AuditPackage[];
  rows: PhoneUsageRow[];
}

/** The apps a set id was made from (`<catalog>|<picked,...>`), or null for a set id this build cannot read. */
function pickedOf(setId: string): string[] | null {
  const [catalogId, picked] = setId.split('|');
  return catalogId === PHONE_USAGE_CATALOG.id && picked ? picked.split(',') : null;
}

const total = (items: readonly AuditPackage[]) => items.some(item => item.foregroundMs === null) ? null : items.reduce((sum, item) => sum + item.foregroundMs!, 0);

/** The last AUDIT_DAYS finished days before `today`, oldest first, one entry per day whether recorded or not. */
export function auditDays(rows: readonly PhoneUsageRow[], today: string): AuditDay[] {
  const byDay = new Map<string, PhoneUsageRow[]>();
  for (const row of rows) if (!row.deleted) byDay.set(row.dayKey, [...byDay.get(row.dayKey) ?? [], row]);
  return Array.from({ length: AUDIT_DAYS }, (_, i) => addCalendarDays(today, i - AUDIT_DAYS)).map(day => {
    const found = byDay.get(day) ?? [];
    const sets = [...new Set(found.map(row => row.setId))];
    const setId = sets.length === 1 ? sets[0]! : null;
    const picked = setId ? pickedOf(setId) : null;
    const expected = picked ? trackedPackages(picked).map(item => item.packageName) : null;
    const packages = found.map(row => ({ packageName: row.packageName, group: row.group, foregroundMs: row.foregroundMs, ...(row.reason ? { reason: row.reason } : {}), installed: row.installed, crossCheckMs: row.crossCheckMs }))
      .sort((a, b) => a.group === b.group ? a.packageName.localeCompare(b.packageName) : a.group === 'picked' ? -1 : 1);
    const covered = !!expected && expected.length === found.length && expected.every(pkg => found.some(row => row.packageName === pkg));
    const pickedRows = packages.filter(item => item.group === 'picked');
    const substituteRows = packages.filter(item => item.group === 'substitute');
    return {
      day, recorded: found.length > 0, setId, packages, rows: found,
      complete: covered && found.every(row => row.foregroundMs !== null),
      pickedMs: covered && pickedRows.length ? total(pickedRows) : null,
      substituteMs: covered ? total(substituteRows) : null,
      reasons: [...new Set(found.flatMap(row => row.reason ? [row.reason] : []))],
    };
  });
}

/** Days on which Usage access went away or came back, judged from each recorded day's rows. */
export function accessChanges(days: readonly AuditDay[]): { day: string; access: 'lost' | 'back' }[] {
  const changes: { day: string; access: 'lost' | 'back' }[] = [];
  let had: boolean | null = null;
  for (const day of days) {
    if (!day.recorded) continue;
    const has = !day.reasons.includes('no_access');
    if (had !== null && has !== had) changes.push({ day: day.day, access: has ? 'back' : 'lost' });
    had = has;
  }
  return changes;
}

export interface AuditPass {
  at: number;
  firstDay: string;
  lastDay: string;
  catalogId: string;
  setId: string;
  measureVersion: string;
  deviceId: string;
}
export type AuditState =
  | { state: 'none' }
  | { state: 'valid'; pass: AuditPass }
  | { state: 'void'; pass: AuditPass; why: 'catalog' | 'apps' | 'measure' | 'device' | 'mismatch' };

export function readAuditPass(settings: readonly SettingRow[]): AuditPass | null {
  const raw = settings.find(row => row.key === PHONE_USAGE_KEYS.audit && !row.deleted)?.value as Partial<AuditPass> | undefined;
  return raw && typeof raw.at === 'number' && typeof raw.firstDay === 'string' && typeof raw.lastDay === 'string' && typeof raw.catalogId === 'string'
    && typeof raw.setId === 'string' && typeof raw.measureVersion === 'string' && typeof raw.deviceId === 'string' ? raw as AuditPass : null;
}

/** Fail-closed: any difference from what the pass was given on, or a later day Android saw more of, voids it. */
export function auditState(pass: AuditPass | null, now: { setId: string | null; deviceId: string | null }, rows: readonly PhoneUsageRow[]): AuditState {
  if (!pass) return { state: 'none' };
  const why = pass.catalogId !== PHONE_USAGE_CATALOG.id ? 'catalog'
    : pass.setId !== now.setId ? 'apps'
      : pass.measureVersion !== MEASURE_VERSION ? 'measure'
        : pass.deviceId !== now.deviceId ? 'device'
          : rows.some(row => !row.deleted && row.dayKey > pass.lastDay && row.reason === 'mismatch') ? 'mismatch' : null;
  return why ? { state: 'void', pass, why } : { state: 'valid', pass };
}

/** The pass can be given only on 30 recorded days in a row, all measured with today's set of apps. */
export function canPass(days: readonly AuditDay[], setId: string | null): boolean {
  return !!setId && days.length === AUDIT_DAYS && days.every(day => day.recorded && day.setId === setId);
}

export function newAuditPass(days: readonly AuditDay[], setId: string, deviceId: string, at: number): AuditPass {
  return { at, firstDay: days[0]!.day, lastDay: days.at(-1)!.day, catalogId: PHONE_USAGE_CATALOG.id, setId, measureVersion: MEASURE_VERSION, deviceId };
}

/** One CSV field: quoted when needed; text led by = + - @ is defused so a spreadsheet never runs it (numbers stay numbers). */
export function csvField(value: string | number | boolean | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  const safe = typeof value === 'string' && /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export interface AuditMeta {
  model: string;
  androidVersion: string;
  appVersion: string;
  exportedAt: string;
  audit: string;
}

/** The owner's export: a few lines about the phone and build, then one line per app per day. No raw events. */
export function auditCsv(days: readonly AuditDay[], meta: AuditMeta): string {
  const line = (fields: (string | number | boolean | null | undefined)[]) => fields.map(csvField).join(',');
  const lines = [
    line(['field', 'value']),
    line(['model', meta.model]), line(['android', meta.androidVersion]), line(['app', meta.appVersion]),
    line(['catalog', PHONE_USAGE_CATALOG.id]), line(['measure', MEASURE_VERSION]), line(['exported', meta.exportedAt]), line(['audit', meta.audit]),
    ...accessChanges(days).map(change => line([`usage access ${change.access}`, change.day])),
    '',
    line(['day', 'package', 'group', 'minutes', 'foreground_ms', 'unknown_reason', 'installed', 'android_daily_ms', 'day_from', 'day_to', 'offset_start_min', 'offset_end_min', 'set', 'measured_at']),
  ];
  for (const day of days) {
    if (!day.recorded) { lines.push(line([day.day, '', '', '', '', 'not_recorded'])); continue; }
    for (const row of [...day.rows].sort((a, b) => a.packageName.localeCompare(b.packageName))) {
      lines.push(line([day.day, row.packageName, row.group, row.foregroundMs === null ? '' : Math.round(row.foregroundMs / 60_000 * 10) / 10, row.foregroundMs, row.reason, row.installed,
        row.crossCheckMs, new Date(row.fromMs).toISOString(), new Date(row.toMs).toISOString(), row.offsetStartMin, row.offsetEndMin, row.setId, new Date(row.measuredAt).toISOString()]));
    }
  }
  return `${lines.join('\n')}\n`;
}

/** Model and Android version from the WebView's user agent ("Android 14; Pixel 7"); blank where it does not say. */
export function deviceFromUserAgent(agent: string): { model: string; androidVersion: string } {
  const match = /Android ([\d.]+);\s*([^;)]*)/.exec(agent);
  return { androidVersion: match?.[1] ?? '', model: (match?.[2] ?? '').replace(/\s*Build\/.*$/, '').trim() };
}
