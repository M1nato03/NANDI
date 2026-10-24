// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../data/db';
import { openUsageSettings } from '../../platform/nightPause';
import { NightSettings, USAGE_DISCLOSURE_KEY } from './NightSettings';

vi.mock('../../platform/nightPause', () => ({
  nightPauseAvailable: () => true,
  nightPauseStatus: vi.fn(async () => ({ usageAllowed: false, overlayAllowed: true })),
  openNightPauseAppInfo: vi.fn(), openOverlaySettings: vi.fn(), openUsageSettings: vi.fn(async () => {}),
  readInstalledApps: vi.fn(async () => null), testNightPause: vi.fn(),
}));

beforeEach(async () => { await db.settings.clear(); vi.mocked(openUsageSettings).mockClear(); });
afterEach(() => cleanup());

// Play's prominent disclosure (idea engine item 71): said once, before Usage access is first asked for.
describe('Usage access disclosure', () => {
  it('says what is read and that it stays on the phone before Android settings open, once per phone', async () => {
    render(<NightSettings />);
    fireEvent.click(await screen.findByRole('button', { name: 'Open Usage access settings' }));
    const dialog = screen.getByRole('dialog', { name: 'Before you turn on Usage access' });
    expect(dialog.textContent).toContain('which app is on screen and when');
    expect(dialog.textContent).toContain('What it reads stays on this phone.');
    expect(openUsageSettings).not.toHaveBeenCalled();
    // "Not now" opens nothing and is not counted as seen.
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open Usage access settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Usage access' }));
    await waitFor(() => expect(openUsageSettings).toHaveBeenCalledTimes(1));
    expect(await db.settings.get(USAGE_DISCLOSURE_KEY)).toBeTruthy();
    // Once seen, the button goes straight to Android settings.
    await waitFor(() => { fireEvent.click(screen.getByRole('button', { name: 'Open Usage access settings' })); expect(openUsageSettings).toHaveBeenCalledTimes(2); });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
