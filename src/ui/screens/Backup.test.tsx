// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../data/db';
import { shareOrDownload } from '../../platform/files';
import { recordError } from '../errorRing';
import { Backup } from './Backup';

vi.mock('../../platform/files', () => ({ shareOrDownload: vi.fn(), pickFile: vi.fn() }));
vi.mock('../errorRing', () => ({ recordError: vi.fn() }));

beforeEach(async () => {
  vi.resetAllMocks();
  await Promise.all(db.tables.map(table => table.clear()));
});

afterEach(() => cleanup());

async function startExport(): Promise<void> {
  render(<Backup onRestored={async () => {}} />);
  await screen.findByText(/Current rows:/);
  fireEvent.click(screen.getByRole('button', { name: 'Export backup' }));
}

describe('Backup export status', () => {
  it('shows the download filename and records a successful backup', async () => {
    vi.mocked(shareOrDownload).mockResolvedValue('downloaded');
    await startExport();

    const status = await screen.findByRole('status');
    const file = vi.mocked(shareOrDownload).mock.calls[0]?.[0];
    expect(file).toBeDefined();
    expect(status.textContent).toBe(`Saved to Downloads as ${file!.name}.`);
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

    expect((await screen.findByRole('status')).textContent).toBe('Export cancelled.');
    expect(await db.settings.get('lastBackupAt')).toBeUndefined();
  });

  it('shows export errors and records them in the error ring', async () => {
    const error = new Error('Download failed');
    vi.mocked(shareOrDownload).mockRejectedValue(error);
    await startExport();

    expect((await screen.findByRole('status')).textContent).toBe('Download failed');
    expect(recordError).toHaveBeenCalledWith('promise', error);
    expect(await db.settings.get('lastBackupAt')).toBeUndefined();
  });
});
