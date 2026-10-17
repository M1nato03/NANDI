// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Capacitor } from '@capacitor/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readAutoBackupState, runAutoBackup, setAutoBackupEnabled } from '../../data/autoBackup';
import { listAutoBackups } from '../../platform/files';
import { Backup } from './Backup';

vi.mock('../../data/autoBackup', () => ({ readAutoBackupState: vi.fn(), runAutoBackup: vi.fn(), setAutoBackupEnabled: vi.fn() }));
vi.mock('../../platform/files', () => ({ listAutoBackups: vi.fn(), pickFile: vi.fn(), shareOrDownload: vi.fn() }));

const state = { enabled: true, lastSavedAt: new Date(2026, 9, 17, 9, 12).getTime(), lastSavedDay: '2026-10-17', kept: 7, failureDay: null, failureStreak: 0 };

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
  vi.mocked(readAutoBackupState).mockResolvedValue(state);
  vi.mocked(listAutoBackups).mockResolvedValue(Array.from({ length: 7 }, (_, i) => `nandi-auto-2026-10-${i + 10}.json`));
  vi.mocked(runAutoBackup).mockResolvedValue(state);
  vi.mocked(setAutoBackupEnabled).mockResolvedValue();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('APK backup settings', () => {
  it('shows status, switch and manual automatic backup action', async () => {
    render(<Backup onRestored={async () => {}} />);
    expect(await screen.findByText(/7 kept in Documents\/NANDI\/auto/)).toBeTruthy();
    expect(screen.getByRole('switch', { name: 'Automatic backup' })).toHaveProperty('checked', true);
    fireEvent.click(screen.getByRole('switch', { name: 'Automatic backup' }));
    await waitFor(() => expect(setAutoBackupEnabled).toHaveBeenCalledWith(false));
    fireEvent.click(screen.getByRole('button', { name: 'Back up now' }));
    await waitFor(() => expect(runAutoBackup).toHaveBeenCalledWith(true));
  });
});
