// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../data/db';
import { NUDGE_MORNING_ON, NUDGE_MORNING_TIME, NUDGE_NIGHT_ON } from '../../core/nudges';

const mock = vi.hoisted(() => ({ checkPermission: vi.fn().mockResolvedValue('granted'), requestPermission: vi.fn().mockResolvedValue('granted') }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('../../platform/notifier', () => ({ notifier: mock }));
vi.mock('../../platform/nightPause', () => ({ nightPauseAvailable: () => false }));
vi.mock('./NightPlanSetting', () => ({ NightPlanSetting: () => null }));
vi.mock('./ReminderSettings', () => ({ ReminderSettings: () => null }));
vi.mock('./ErrorRing', () => ({ ErrorRing: () => null }));
import { Ground } from './Ground';

beforeEach(async () => {
  vi.clearAllMocks();
  vi.stubGlobal('__APP_VERSION__', 'test');
  vi.stubGlobal('__BUILD_COMMIT__', 'test');
  vi.stubGlobal('__BUILD_DATE__', 'test');
  await db.settings.clear();
});
afterEach(() => cleanup());

describe('Day and night nudge controls', () => {
  it('defaults on, saves the time, and turns each nudge off', async () => {
    render(<Ground theme="system" motion="system" setTheme={async () => {}} setMotion={async () => {}} />);
    const night = screen.getByRole('checkbox', { name: 'Night deck nudge' }) as HTMLInputElement;
    const morning = screen.getByRole('checkbox', { name: 'Morning first step nudge' }) as HTMLInputElement;
    expect(night.checked).toBe(true);
    expect(morning.checked).toBe(true);
    expect((screen.getByLabelText('Morning nudge time') as HTMLInputElement).value).toBe('08:30');
    fireEvent.change(screen.getByLabelText('Morning nudge time'), { target: { value: '07:10' } });
    fireEvent.click(night);
    fireEvent.click(morning);
    await waitFor(async () => {
      expect((await db.settings.get(NUDGE_MORNING_TIME))?.value).toBe('07:10');
      expect((await db.settings.get(NUDGE_NIGHT_ON))?.value).toBe(false);
      expect((await db.settings.get(NUDGE_MORNING_ON))?.value).toBe(false);
    });
  });
  it('explains missing permission and asks once', async () => {
    mock.checkPermission.mockResolvedValueOnce('denied');
    mock.requestPermission.mockResolvedValueOnce('denied');
    render(<Ground theme="system" motion="system" setTheme={async () => {}} setMotion={async () => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Allow notifications' }));
    await waitFor(() => expect(mock.requestPermission).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Allow NANDI notifications in Android app settings/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Allow notifications' })).toBeNull();
  });
});
