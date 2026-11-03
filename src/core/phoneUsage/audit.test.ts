import { describe, expect, it } from 'vitest';
import type { PhoneUsageRow } from '../../data/types';
import { PHONE_USAGE_CATALOG } from '../rules.config';
import { accessChanges, AUDIT_DAYS, auditCsv, auditDays, auditState, canPass, csvField, deviceFromUserAgent, newAuditPass, type AuditPass } from './audit';
import { setIdFor, trackedPackages } from './baseline';
import { addCalendarDays, calendarBounds } from './calendarDay';
import { MEASURE_VERSION } from './measure';

const IG = 'com.instagram.android';
const SET = setIdFor([IG]);
const TODAY = '2026-12-10';
const MIN = 60_000;

function row(day: string, packageName: string, foregroundMs: number | null, extra: Partial<PhoneUsageRow> = {}): PhoneUsageRow {
  const { fromMs, toMs } = calendarBounds(day);
  return { id: `${day}|${packageName}`, dayKey: day, packageName, group: packageName === IG ? 'picked' : 'substitute', foregroundMs,
    source: 'usage-events', fromMs, toMs, offsetStartMin: 330, offsetEndMin: 330, catalogId: PHONE_USAGE_CATALOG.id, setId: SET,
    installed: packageName === IG, crossCheckMs: null, measuredAt: toMs + MIN, updatedAt: toMs + MIN, deleted: 0, deviceId: 'phone-a', ...extra };
}
/** Every tracked package measured on `day`: Instagram `ig` minutes, YouTube 5, the rest 0. */
const fullDay = (day: string, ig = 10) => trackedPackages([IG]).map(item => row(day, item.packageName,
  item.packageName === IG ? ig * MIN : item.packageName === 'com.google.android.youtube' ? 5 * MIN : 0));
const thirty = () => Array.from({ length: AUDIT_DAYS }, (_, i) => addCalendarDays(TODAY, i - AUDIT_DAYS)).flatMap(day => fullDay(day));

describe('spec 46b audit days', () => {
  it('lists the last 30 finished days, oldest first, with group totals in raw milliseconds', () => {
    const days = auditDays(thirty(), TODAY);
    expect(days).toHaveLength(30);
    expect(days[0]!.day).toBe('2026-11-10');
    expect(days.at(-1)!.day).toBe('2026-12-09');
    expect(days.every(day => day.complete)).toBe(true);
    expect(days[5]!.pickedMs).toBe(10 * MIN);
    expect(days[5]!.substituteMs).toBe(5 * MIN);
    expect(days[5]!.packages[0]!.packageName).toBe(IG);
  });

  it('an unknown app makes its group unknown, never zero, and names the reason', () => {
    const rows = fullDay('2026-12-09').map(item => item.packageName === IG ? { ...item, foregroundMs: null, reason: 'event_gap' as const } : item);
    const day = auditDays(rows, TODAY).at(-1)!;
    expect(day.complete).toBe(false);
    expect(day.pickedMs).toBeNull();
    expect(day.substituteMs).toBe(5 * MIN);
    expect(day.reasons).toEqual(['event_gap']);
  });

  it('a day missing an app, or read under two sets of apps, is not complete and has no totals', () => {
    const missing = auditDays(fullDay('2026-12-09').slice(1), TODAY).at(-1)!;
    expect(missing.complete).toBe(false);
    expect(missing.pickedMs).toBeNull();
    expect(missing.substituteMs).toBeNull();
    const mixed = auditDays(fullDay('2026-12-09').map((item, i) => i ? item : { ...item, setId: setIdFor([IG, 'com.whatsapp']) }), TODAY).at(-1)!;
    expect(mixed.setId).toBeNull();
    expect(mixed.complete).toBe(false);
  });

  it('a day never read is listed as not recorded', () => {
    const days = auditDays(fullDay('2026-12-09'), TODAY);
    expect(days[0]).toMatchObject({ recorded: false, complete: false, pickedMs: null });
  });

  it('notes the days Usage access went away and came back', () => {
    const off = (day: string) => fullDay(day).map(item => ({ ...item, foregroundMs: null, reason: 'no_access' as const }));
    const rows = [...fullDay('2026-12-05'), ...off('2026-12-06'), ...off('2026-12-07'), ...fullDay('2026-12-08')];
    expect(accessChanges(auditDays(rows, TODAY))).toEqual([{ day: '2026-12-06', access: 'lost' }, { day: '2026-12-08', access: 'back' }]);
  });
});

describe('spec 46b audit pass is fail-closed', () => {
  const rows = thirty();
  const days = auditDays(rows, TODAY);
  const pass: AuditPass = newAuditPass(days, SET, 'phone-a', 1);
  const now = { setId: SET, deviceId: 'phone-a' };

  it('holds for the same apps, catalog, measuring rules and phone', () => {
    expect(pass).toMatchObject({ firstDay: '2026-11-10', lastDay: '2026-12-09', measureVersion: MEASURE_VERSION, catalogId: PHONE_USAGE_CATALOG.id });
    expect(auditState(pass, now, rows).state).toBe('valid');
    expect(auditState(null, now, rows)).toEqual({ state: 'none' });
  });

  it('is void after any change it was not given on', () => {
    expect(auditState({ ...pass, catalogId: 'scroll-old' }, now, rows)).toMatchObject({ state: 'void', why: 'catalog' });
    expect(auditState(pass, { ...now, setId: setIdFor([IG, 'com.whatsapp']) }, rows)).toMatchObject({ state: 'void', why: 'apps' });
    expect(auditState(pass, { ...now, setId: null }, rows)).toMatchObject({ state: 'void', why: 'apps' });
    expect(auditState({ ...pass, measureVersion: 'older' }, now, rows)).toMatchObject({ state: 'void', why: 'measure' });
    expect(auditState(pass, { ...now, deviceId: 'phone-b' }, rows)).toMatchObject({ state: 'void', why: 'device' });
  });

  it('is void once a later day shows Android counting more than the record (a possible undercount)', () => {
    const later = [...rows, row('2026-12-10', IG, null, { reason: 'mismatch' })];
    expect(auditState(pass, now, later)).toMatchObject({ state: 'void', why: 'mismatch' });
    // An earlier mismatch was part of what the owner checked; other later unknowns are never counted as zero.
    expect(auditState(pass, now, [...rows, row('2026-11-01', IG, null, { reason: 'mismatch' }), row('2026-12-10', IG, null, { reason: 'event_gap' })]).state).toBe('valid');
  });

  it('can be given only on 30 recorded days in a row under today’s apps', () => {
    expect(canPass(days, SET)).toBe(true);
    expect(canPass(days, null)).toBe(false);
    expect(canPass(days, setIdFor([IG, 'com.whatsapp']))).toBe(false);
    expect(canPass(auditDays(rows.filter(item => item.dayKey !== '2026-11-20'), TODAY), SET)).toBe(false);
  });
});

describe('spec 46b audit export', () => {
  it('quotes commas, quotes and line breaks, and defuses spreadsheet formulas', () => {
    expect(csvField('plain')).toBe('plain');
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField('two\nlines')).toBe('"two\nlines"');
    expect(csvField('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvField('-5')).toBe("'-5");
    // A time zone west of UTC has a negative offset; a number is never defused.
    expect(csvField(-300)).toBe('-300');
    expect(csvField(null)).toBe('');
    expect(csvField(0)).toBe('0');
  });

  it('carries the phone, build, catalog, measuring rules and access changes, then one line per app per day', () => {
    const rows = thirty().filter(item => item.dayKey !== '2026-11-12');
    const csv = auditCsv(auditDays(rows, TODAY), { model: 'Pixel 7', androidVersion: '14', appVersion: '0.1.0', exportedAt: '2026-12-10T12:00:00.000Z', audit: 'not passed' });
    const lines = csv.trimEnd().split('\n');
    expect(lines.slice(0, 8)).toEqual(['field,value', 'model,Pixel 7', 'android,14', 'app,0.1.0', `catalog,${PHONE_USAGE_CATALOG.id}`, `measure,${MEASURE_VERSION}`, 'exported,2026-12-10T12:00:00.000Z', 'audit,not passed']);
    expect(lines).toContain('2026-11-12,,,,,not_recorded');
    const igLine = lines.find(line => line.startsWith(`2026-12-09,${IG},`))!;
    expect(igLine.split(',').slice(0, 7)).toEqual(['2026-12-09', IG, 'picked', '10', String(10 * MIN), '', 'true']);
    expect(lines.filter(line => line.startsWith('2026-12-09,'))).toHaveLength(trackedPackages([IG]).length);
  });

  it('holds only the stored rows: no raw usage events, no event types', () => {
    const csv = auditCsv(auditDays(thirty(), TODAY), { model: '', androidVersion: '', appVersion: '0.1.0', exportedAt: 'x', audit: 'x' });
    expect(csv).not.toMatch(/\b(fg|bg|MOVE_TO|ACTIVITY_RESUMED|SCREEN_|events?)\b/);
  });

  it('reads the model and Android version from the WebView user agent', () => {
    expect(deviceFromUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UQ1A; wv) AppleWebKit/537.36')).toEqual({ model: 'Pixel 7', androidVersion: '14' });
    expect(deviceFromUserAgent('Mozilla/5.0 (Linux; Android 13; RMX3085) AppleWebKit')).toEqual({ model: 'RMX3085', androidVersion: '13' });
    expect(deviceFromUserAgent('Mozilla/5.0 (Windows NT 10.0)')).toEqual({ model: '', androidVersion: '' });
  });
});
