// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../data/db';
import { exportBackup } from '../../data/backup';
import { pickFile, shareOrDownload } from '../../platform/files';
import { recordError } from '../errorRing';
import { Backup } from './Backup';

vi.mock('../../platform/files', () => ({ shareOrDownload: vi.fn(), pickFile: vi.fn() }));
vi.mock('../errorRing', () => ({ recordError: vi.fn() }));
// A restore writes the file with importInto, then rolls back with a second importInto; a test can make that second one fail.
const rollback = vi.hoisted(() => ({ fail: false, calls: 0 }));
vi.mock('dexie-export-import', async (importOriginal) => {
  const actual = await importOriginal<typeof import('dexie-export-import')>();
  return { ...actual, importInto: (...args: Parameters<typeof actual.importInto>) => {
    rollback.calls++;
    return rollback.fail && rollback.calls > 1 ? Promise.reject(new Error('rollback failed')) : actual.importInto(...args);
  } };
});

beforeEach(async () => {
  vi.resetAllMocks();
  rollback.fail = false; rollback.calls = 0;
  await Promise.all(db.tables.map(table => table.clear()));
});

afterEach(() => cleanup());

async function startExport(): Promise<void> {
  render(<Backup onRestored={async () => {}} />);
  await screen.findByText(/Current rows:/);
  fireEvent.click(screen.getByRole('button', { name: 'Save a backup' }));
}

describe('Backup export status', () => {
  it('shows the download filename and records a successful backup', async () => {
    vi.mocked(shareOrDownload).mockResolvedValue('downloaded');
    await startExport();

    const status = await screen.findByRole('status');
    const file = vi.mocked(shareOrDownload).mock.calls[0]?.[0];
    expect(file).toBeDefined();
    expect(status.textContent).toBe(`Saved in Downloads as ${file!.name}.`);
    expect((await db.settings.get('lastBackupAt'))?.value).toEqual(expect.any(Number));
  });

  it('shows shared after a successful share', async () => {
    vi.mocked(shareOrDownload).mockResolvedValue('shared');
    await startExport();

    expect((await screen.findByRole('status')).textContent).toBe('Shared.');
    expect((await db.settings.get('lastBackupAt'))?.value).toEqual(expect.any(Number));
  });

  it('leaves the backup date unchanged when sharing is cancelled', async () => {
    vi.mocked(shareOrDownload).mockResolvedValue('cancelled');
    await startExport();

    expect((await screen.findByRole('status')).textContent).toBe('No backup saved.');
    expect(await db.settings.get('lastBackupAt')).toBeUndefined();
  });

  it('shows export errors and records them in the error ring', async () => {
    const error = new Error('Download failed');
    vi.mocked(shareOrDownload).mockRejectedValue(error);
    await startExport();

    expect((await screen.findByRole('status')).textContent).toBe('The backup couldn’t be saved. Try again.');
    expect(recordError).toHaveBeenCalledWith('promise', error);
    expect(await db.settings.get('lastBackupAt')).toBeUndefined();
  });
});

// a9 13 Nov (w14 H6 + the rollback line): what the restore review and a failed restore say.
async function chooseBackup(version?: number): Promise<void> {
  await db.settings.put({ key: 'deviceId', value: 'device-a', updatedAt: 1, deleted: 0, deviceId: 'device-a' });
  const envelope = structuredClone(await exportBackup(db, new Date(2026, 10, 13, 12)));
  if (version !== undefined) {
    envelope.dexie.data.databaseVersion = version;
    envelope.dexie.data.tables = envelope.dexie.data.tables.filter(table => table.name !== 'bookGameStates');
    envelope.dexie.data.data = envelope.dexie.data.data.filter(table => table.tableName !== 'bookGameStates');
  }
  vi.mocked(pickFile).mockResolvedValue(new File([JSON.stringify(envelope)], 'nandi.json', { type: 'application/json' }));
  render(<Backup onRestored={async () => {}} />);
  await screen.findByText(/Current rows:/);
  fireEvent.click(screen.getByRole('button', { name: 'Choose restore file' }));
  await screen.findByRole('button', { name: 'Confirm restore' });
}

describe('Backup restore review', () => {
  it('a backup from before the book game (v6) says the Read game starts fresh', async () => {
    await chooseBackup(6);
    expect(screen.getByText('Your Read game starts fresh.')).toBeTruthy();
  });

  it('a backup from this version (v8 or later) does not', async () => {
    await chooseBackup();
    expect(screen.queryByText('Your Read game starts fresh.')).toBeNull();
  });

  it('a restore that failed and was put back says nothing on this phone changed', async () => {
    await chooseBackup();
    const spy = vi.spyOn(db.settings, 'bulkPut').mockRejectedValueOnce(new Error('disk full'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm restore' }));
    expect((await screen.findByText(/The restore didn’t finish/)).textContent).toBe('The restore didn’t finish. Nothing on this phone was changed. Try again.');
    spy.mockRestore();
    expect(recordError).toHaveBeenCalled();
  });

  it('a restore whose rollback also failed keeps the plain line (it cannot say nothing changed)', async () => {
    await chooseBackup();
    // The restore fails on its write, and putting the safety copy back fails too.
    const spy = vi.spyOn(db.settings, 'bulkPut').mockRejectedValueOnce(new Error('disk full'));
    rollback.fail = true;
    fireEvent.click(screen.getByRole('button', { name: 'Confirm restore' }));
    expect((await screen.findByText(/The restore didn’t finish/)).textContent).toBe('The restore didn’t finish. Try again.');
    expect(rollback.calls).toBe(2);
    spy.mockRestore();
  });
});
