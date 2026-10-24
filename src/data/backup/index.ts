import { exportDB, importInto } from 'dexie-export-import';
import * as v from 'valibot';
import { dayKey } from '../../core/time';
import { trackWrite } from '../../core/pendingWrites';
import type { NandiDb } from '../db';
import { getOrCreateDeviceId } from '../device';
import type { SettingRow } from '../types';
import { isLegacyExport } from '../legacy-import';
import { addEconomyDays, CLOSE_PREFIX, closeKey, closesFor, deriveEconomy, fillHeldBonus, keptCandidates, mergeCloseMaps, refundReplaced, replayBonus, restoredPurchase, PEAK_KEY, readPeak, readSeenUpTo, SEEN_KEY } from '../../core/economy/deriveEconomy';
import { duringRestore } from '../restoreLock';

/** Classify parsed file-picker JSON before invoking the corresponding validator. */
export function detectRestoreKind(json: unknown): 'backup' | 'legacy' | 'unknown' {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) return 'unknown';
  const value = json as Record<string, unknown>;
  if (value.app === 'nandi') return 'backup';
  if (isLegacyExport(json)) return 'legacy';
  return 'unknown';
}

export const PP_FORMAT_VERSION = 2;
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.0';

const dexieSchema = v.object({
  formatName: v.literal('dexie'),
  formatVersion: v.literal(1),
  data: v.object({
    databaseName: v.string(),
    databaseVersion: v.pipe(v.number(), v.integer(), v.minValue(1)),
    tables: v.array(v.object({
      name: v.string(), schema: v.string(),
      rowCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
    })),
    data: v.array(v.object({
      tableName: v.string(), inbound: v.boolean(),
      rows: v.array(v.record(v.string(), v.unknown())),
    })),
  }),
});

export const backupEnvelopeSchema = v.object({
  app: v.literal('nandi'),
  ppFormatVersion: v.literal(PP_FORMAT_VERSION),
  appVersion: v.string(),
  exportedAt: v.pipe(v.number(), v.integer(), v.minValue(0)),
  deviceId: v.string(),
  dexie: dexieSchema,
});

export type BackupEnvelope = v.InferOutput<typeof backupEnvelopeSchema>;
export type EnvelopeMigrator = (envelope: Record<string, unknown>) => Record<string, unknown>;
export const envelopeMigrators: Readonly<Record<number, EnvelopeMigrator>> = {
  1: envelope => {
    const next = structuredClone(envelope);
    const dexie = next.dexie as { data: { databaseVersion: number; tables: { name: string; schema: string; rowCount: number }[]; data: { tableName: string; inbound: boolean; rows: Record<string, unknown>[] }[] } };
    if (dexie?.data?.databaseVersion === 1 && !dexie.data.tables.some(table => table.name === 'quests')) {
      dexie.data.databaseVersion = 2;
      dexie.data.tables.push({ name: 'quests', schema: 'id, week, status, sourceId, updatedAt', rowCount: 0 });
      dexie.data.data.push({ tableName: 'quests', inbound: true, rows: [] });
    }
    next.ppFormatVersion = 2;
    return next;
  },
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Migrators are keyed by the version they upgrade from and must not mutate input. */
export function migrateEnvelope(
  input: unknown,
  migrators: Readonly<Record<number, EnvelopeMigrator>> = envelopeMigrators,
): Record<string, unknown> {
  if (!record(input)) throw new Error('Backup envelope must be an object');
  let current = input;
  const version = current.ppFormatVersion;
  if (!Number.isInteger(version) || typeof version !== 'number' || version < 0) {
    throw new Error('Missing or invalid ppFormatVersion');
  }
  if (version > PP_FORMAT_VERSION) throw new Error(`Future backup format version ${version}`);
  for (let next = version; next < PP_FORMAT_VERSION; next++) {
    const migrator = migrators[next];
    if (!migrator) throw new Error(`No envelope migrator for version ${next}`);
    const output = migrator(structuredClone(current));
    if (!record(output) || output.ppFormatVersion !== next + 1) {
      throw new Error(`Envelope migrator ${next} must produce version ${next + 1}`);
    }
    current = output;
  }
  // Dexie v3 adds adaptive learning tables. Older complete backups gain empty
  // tables here before the strict table-set check; v3 backups remain untouched.
  const migrated = structuredClone(current);
  const dexie = migrated.dexie as { data?: { databaseVersion: number; tables: { name: string; schema: string; rowCount: number }[]; data: { tableName: string; inbound: boolean; rows: Record<string, unknown>[] }[] } } | undefined;
  if (dexie?.data && dexie.data.databaseVersion < 3) {
    for (const [name, schema] of [['learnConcepts', 'id'], ['learnItems', 'id, lastSeen'], ['learnDrops', 'id']] as const) {
      if (!dexie.data.tables.some(table => table.name === name)) {
        dexie.data.tables.push({ name, schema, rowCount: 0 });
        dexie.data.data.push({ tableName: name, inbound: true, rows: [] });
      }
    }
    dexie.data.databaseVersion = 3;
  }
  return migrated;
}

export interface BackupValidation {
  success: boolean;
  envelope: BackupEnvelope | null;
  errors: string[];
}

export function validateBackup(json: string | unknown): BackupValidation {
  let input: unknown = json;
  if (typeof json === 'string') {
    try { input = JSON.parse(json) as unknown; }
    catch { return { success: false, envelope: null, errors: ['Invalid JSON'] }; }
  }
  try { input = migrateEnvelope(input); }
  catch (error) {
    return { success: false, envelope: null, errors: [error instanceof Error ? error.message : 'Invalid backup envelope'] };
  }
  const parsed = v.safeParse(backupEnvelopeSchema, input);
  if (!parsed.success) {
    return {
      success: false, envelope: null,
      errors: parsed.issues.map(issue => `${v.getDotPath(issue) ?? 'backup'}: ${issue.message}`),
    };
  }
  const envelope = parsed.output;
  const errors: string[] = [];
  const metadata = new Map(envelope.dexie.data.tables.map(table => [table.name, table.rowCount]));
  if (metadata.size !== envelope.dexie.data.tables.length) {
    errors.push('dexie.data.tables: duplicate table name');
  }
  const seen = new Set<string>();
  for (const table of envelope.dexie.data.data) {
    if (seen.has(table.tableName)) errors.push(`dexie.data.data: duplicate table ${table.tableName}`);
    seen.add(table.tableName);
    if (!metadata.has(table.tableName)) errors.push(`dexie.data.data: unknown table ${table.tableName}`);
    else if (metadata.get(table.tableName) !== table.rows.length) {
      errors.push(`dexie.data.data: row count mismatch for ${table.tableName}`);
    }
  }
  for (const name of metadata.keys()) {
    if (!seen.has(name)) errors.push(`dexie.data.data: missing table ${name}`);
  }
  return errors.length
    ? { success: false, envelope: null, errors }
    : { success: true, envelope, errors: [] };
}

export function backupFileName(now: Date | number): string {
  return `nandi-backup-${dayKey(now)}.json`;
}

export async function exportBackup(db: NandiDb, now: Date | number): Promise<BackupEnvelope> {
  const exportedAt = now instanceof Date ? now.getTime() : now;
  if (!Number.isSafeInteger(exportedAt) || exportedAt < 0) throw new RangeError('Invalid export time');
  const deviceId = await getOrCreateDeviceId(db, exportedAt);
  const dexie = withoutDeviceLocal(JSON.parse(await (await exportDB(db)).text()) as unknown);
  const result = validateBackup({ app: 'nandi', ppFormatVersion: PP_FORMAT_VERSION,
    appVersion: APP_VERSION, exportedAt, deviceId, dexie });
  if (!result.success || !result.envelope) throw new Error(result.errors.join('; '));
  return result.envelope;
}

export interface BackupPreview {
  counts: Record<string, number>;
  earliestDayKey: string | null;
  latestDayKey: string | null;
  retired: number;
}

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
export function isPreviewDay(value: unknown): value is string {
  return typeof value === 'string' && dayPattern.test(value) && Number(value.slice(0, 4)) < 9000;
}
export function previewBackup(envelope: BackupEnvelope): BackupPreview {
  const counts: Record<string, number> = {};
  let earliestDayKey: string | null = null;
  let latestDayKey: string | null = null;
  let retired = 0;
  for (const table of envelope.dexie.data.data) {
    counts[table.tableName] = table.rows.length;
    for (const row of table.rows) {
      if (table.tableName === 'deckProg' && row.b === 99) retired++;
      for (const [key, value] of Object.entries(row)) {
        if ((key === 'dayKey' || key.endsWith('DayKey') || key === 'due' || key === 'last')
          && isPreviewDay(value)) {
          if (earliestDayKey === null || value < earliestDayKey) earliestDayKey = value;
          if (latestDayKey === null || value > latestDayKey) latestDayKey = value;
        }
      }
    }
  }
  return { counts, earliestDayKey, latestDayKey, retired };
}

/**
 * One rule for this phone's own settings (Codex A item 61): they never leave it in a backup, and a restore keeps
 * this phone's values. The settings table's row count is kept in step so the file still validates.
 */
function withoutDeviceLocal(dexie: unknown): unknown {
  const data = (dexie as { data?: { data?: { tableName: string; rows: unknown[] }[]; tables?: { name: string; rowCount: number }[] } })?.data;
  const settings = data?.data?.find(table => table.tableName === 'settings');
  if (!data || !settings || !Array.isArray(settings.rows)) return dexie;
  settings.rows = settings.rows.filter(row => !deviceLocalKeys.has((row as SettingRow | null)?.key ?? ''));
  const meta = data.tables?.find(table => table.name === 'settings');
  if (meta) meta.rowCount = settings.rows.length;
  return dexie;
}

const deviceLocalKeys = new Set(['deviceId', 'lastBackupAt', 'retired', 'offlineReadyShown',
  'autoBackup.saved', 'autoBackup.failure',
  // The chhutti lock self-test describes this phone, not the person (item 59).
  'plan.chhutti.lockTest',
  // Play's Usage access disclosure is shown once per phone (item 71), so a restore onto a new phone shows it again.
  'night.usageDisclosureAt']);
/** When each set of economy fixes began on this phone. This phone's value wins; else the backup's is kept. */
const cutoffKeys = ['economy.v2From', 'economy.v3From', 'economy.v4From', 'economy.v5From'];

/** Full restore only. The current device's local settings survive the clear. */
export async function importBackup(db: NandiDb, envelope: BackupEnvelope): Promise<void> {
  const validated = validateBackup(envelope);
  if (!validated.success || !validated.envelope) throw new Error(validated.errors.join('; '));
  const restored = validated.envelope;
  const fileTables = new Set(restored.dexie.data.tables.map(table => table.name));
  const dbTables = new Set(db.tables.map(table => table.name));
  if (fileTables.size !== dbTables.size || [...dbTables].some(name => !fileTables.has(name))) {
    throw new Error('Backup tables do not match this app database');
  }
  await trackWrite(() => duringRestore(async () => {
    const deviceId = await getOrCreateDeviceId(db, Date.now());
    const localSettings = (await db.settings.bulkGet([...deviceLocalKeys]))
      .filter((row): row is SettingRow => row !== undefined);
    const localCutoffs = (await db.settings.bulkGet(cutoffKeys)).filter((row): row is SettingRow => row !== undefined && !row.deleted);
    const localPeak = await db.settings.get(PEAK_KEY);
    // What this phone shows now, before the clear: XP a reconcile has not recorded yet still raises the peak (cj3 C4).
    const before = await db.settings.toArray();
    const now = Date.now();
    const today = dayKey(now);
    const phoneFacts = (await db.ledger.toArray()).filter(row => !row.deleted);
    const showing = deriveEconomy(phoneFacts, undefined, before, today);
    const storedPeak = localPeak && !localPeak.deleted ? readPeak([localPeak]) : { totalXp: 0, level: 1 };
    const minePeak = { totalXp: Math.max(storedPeak.totalXp, showing.totalXp), level: Math.max(storedPeak.level, showing.level) };
    const localSeen = readSeenUpTo(before);
    // Each day's close keeps what that day showed; a restore keeps the higher of this phone's and the backup's.
    const closes = before.filter(row => !row.deleted && row.key.startsWith(CLOSE_PREFIX));
    const asMap = (rows: SettingRow[]) => new Map(rows.map(row => [row.key.slice(CLOSE_PREFIX.length), row.value] as const));
    // Close the books first, as reconcileGamify would: a finished day it has not closed yet (the app was shut before
    // it ran, then the clock moved on) still keeps what it showed after the restore (cj3 fuzz seeds 2003, 2065).
    // Each side's older closes first say which level bonus they held, read from that side's own replay (item 47).
    const lastDay = (map: ReadonlyMap<string, unknown>) => addEconomyDays([today, ...map.keys()].sort().at(-1)!, 1);
    const unfilled = asMap(closes);
    const stored = fillHeldBonus(unfilled, replayBonus(phoneFacts, before, lastDay(unfilled)));
    const pending = keptCandidates(closesFor(phoneFacts, before, today), stored, addEconomyDays(today, -120));
    const phoneMap = new Map<string, unknown>([...stored, ...mergeCloseMaps(new Map([...stored].filter(([day]) => day < today)), pending)]);
    // dexie-export-import expects its own JSON, without the NANDI envelope.
    const dexieBlob = new Blob([JSON.stringify(restored.dexie)], { type: 'application/json' });
    await importInto(db, dexieBlob, { acceptVersionDiff: true, acceptNameDiff: true,
      clearTablesBeforeImport: true,
      // The app keeps running during a restore: a write that lands between the clear and the re-add
      // (say economy.v2From from reconcileGamify) must not abort it, so rows are put, not added.
      overwriteValues: true,
      filter: (table, value) => table !== 'settings' || !deviceLocalKeys.has((value as SettingRow).key),
    });
    // The batch 5 courtyard cutoff takes the LATER of the two: a later day puts fewer days under the new rule,
    // so no courtyard corner shrinks after a restore (Codex review of batch 5, item 53).
    const theirV5 = await db.settings.get('economy.v5From');
    const laterV5 = (row: SettingRow) => row.key !== 'economy.v5From' || !theirV5 || theirV5.deleted || typeof theirV5.value !== 'string' || String(row.value) > theirV5.value;
    await db.settings.bulkPut([...localSettings, ...localCutoffs.filter(laterV5)]);
    // The XP and level peak keeps the higher of this phone's and the backup's (item 38).
    const restoredPeak = await db.settings.get(PEAK_KEY);
    const theirs = restoredPeak && !restoredPeak.deleted ? readPeak([restoredPeak]) : { totalXp: 0, level: 1 };
    if (minePeak.totalXp > theirs.totalXp || minePeak.level > theirs.level) {
      await db.settings.put({ key: PEAK_KEY, value: { totalXp: Math.max(minePeak.totalXp, theirs.totalXp), level: Math.max(minePeak.level, theirs.level) }, updatedAt: now, deleted: 0, deviceId });
    }
    // The highest day either side has shown: the look-ahead keeps running at least that far (cj3 A, C3).
    const theirSeen = readSeenUpTo([...(await db.settings.bulkGet([SEEN_KEY])).filter((row): row is SettingRow => !!row)]);
    if (localSeen && (!theirSeen || localSeen > theirSeen)) {
      await db.settings.put({ key: SEEN_KEY, value: localSeen, updatedAt: now, deleted: 0, deviceId });
    }
    const after = await db.settings.toArray();
    const restoredFacts = (await db.ledger.toArray()).filter(row => !row.deleted);
    const restoredRaw = asMap(after.filter(row => !row.deleted && row.key.startsWith(CLOSE_PREFIX)));
    const restoredCloses = fillHeldBonus(restoredRaw, replayBonus(restoredFacts, after, lastDay(restoredRaw)));
    // One write for all the closes: a put per day woke every live query once per row (batch 3 b: 212 s for a year).
    // A restore replaces today (Jenil, 24 Oct). A purchase dated today or later that the backup does not have was
    // charged to this phone's closes dated ahead (chargeClose); take it off them and refund it, or the merge would
    // rebuild it as owned (Codex review of cj3, item 44). Purchases of finished days stay, as before.
    // A purchase the backup has only when its id, item and price all match: the same id at another price or for
    // another item is not the phone's purchase (Codex review of round 5, item 48).
    const inBackup = restoredPurchase(restoredFacts);
    const replaced = (item: { id: string; itemId: string; price: number; dayKey: string }) => item.dayKey >= today && !inBackup(item);
    // Every phone close from its day on gets the price back and stops owning the item (items 47, 48).
    const phoneCloses = refundReplaced(phoneMap, replaced);
    const merged = mergeCloseMaps(restoredCloses, phoneCloses);
    if (merged.size) await db.settings.bulkPut([...merged].map(([day, value]): SettingRow => ({ key: closeKey(day), value, updatedAt: now, deleted: 0, deviceId })));
  }));
}
