import { exportDB, importInto } from 'dexie-export-import';
import * as v from 'valibot';
import { dayKey } from '../../core/time';
import type { NandiDb } from '../db';
import { getOrCreateDeviceId } from '../device';
import type { SettingRow } from '../types';
import { isLegacyExport } from '../legacy-import';

/** Classify parsed file-picker JSON before invoking the corresponding validator. */
export function detectRestoreKind(json: unknown): 'backup' | 'legacy' | 'unknown' {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) return 'unknown';
  const value = json as Record<string, unknown>;
  if (value.app === 'nandi') return 'backup';
  if (isLegacyExport(json)) return 'legacy';
  return 'unknown';
}

export const PP_FORMAT_VERSION = 1;
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
export const envelopeMigrators: Readonly<Record<number, EnvelopeMigrator>> = {};

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
  return current;
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
  const dexie = JSON.parse(await (await exportDB(db)).text()) as unknown;
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

const deviceLocalKeys = new Set(['deviceId', 'lastBackupAt', 'retired']);

/** Full restore only. The current device's three local settings survive the clear. */
export async function importBackup(db: NandiDb, envelope: BackupEnvelope): Promise<void> {
  const validated = validateBackup(envelope);
  if (!validated.success || !validated.envelope) throw new Error(validated.errors.join('; '));
  const fileTables = new Set(validated.envelope.dexie.data.tables.map(table => table.name));
  const dbTables = new Set(db.tables.map(table => table.name));
  if (fileTables.size !== dbTables.size || [...dbTables].some(name => !fileTables.has(name))) {
    throw new Error('Backup tables do not match this app database');
  }
  await getOrCreateDeviceId(db, Date.now());
  const localSettings = (await db.settings.bulkGet([...deviceLocalKeys]))
    .filter((row): row is SettingRow => row !== undefined);
  // dexie-export-import expects its own JSON, without the NANDI envelope.
  const dexieBlob = new Blob([JSON.stringify(validated.envelope.dexie)], { type: 'application/json' });
  await importInto(db, dexieBlob, { acceptVersionDiff: true, acceptNameDiff: true,
    clearTablesBeforeImport: true,
    filter: (table, value) => table !== 'settings' || !deviceLocalKeys.has((value as SettingRow).key),
  });
  await db.settings.bulkPut(localSettings);
}
