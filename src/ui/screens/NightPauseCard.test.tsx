// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../data/db';

const mock = vi.hoisted(() => ({ clearNightPause: vi.fn().mockResolvedValue(undefined), openPausedApp: vi.fn().mockResolvedValue(undefined), go: vi.fn() }));
vi.mock('../../platform/nightPause', () => ({ clearNightPause: mock.clearNightPause, openPausedApp: mock.openPausedApp }));
vi.mock('../shell/router', () => ({ go: mock.go }));
import { NightPauseCard } from './NightPauseCard';

beforeEach(async () => {
  vi.clearAllMocks();
  await db.settings.clear();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
/** The breath counts down with setInterval; fake only that, then hand timers back so waitFor can poll. */
async function breathe() {
  await act(async () => { vi.advanceTimersByTime(6000); });
  vi.useRealTimers();
}

describe('App pause card', () => {
  it('offers "go anyway" at once and the swaps after the breath', async () => {
    const close = vi.fn();
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    render(<NightPauseCard packageName="com.instagram.android" reason="limit" minutes={34} close={close} />);
    expect(screen.getByText('34 minutes in your chosen apps today. Is the next scroll worth it?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Go to Instagram anyway' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'A 2-minute puzzle' })).toBeNull();
    await breathe();
    fireEvent.click(screen.getByRole('button', { name: 'A 2-minute puzzle' }));
    await waitFor(() => expect(mock.go).toHaveBeenCalledWith('mind/board/daily'), { timeout: 5000 });
    expect(close).toHaveBeenCalled();
    expect((await db.settings.get('night.pause.openings'))?.value).toBe(1);
  });

  it('puts the phone down at night without opening another screen', async () => {
    const close = vi.fn();
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    render(<NightPauseCard packageName="com.instagram.android" reason="night" close={close} />);
    await breathe();
    fireEvent.click(screen.getByRole('button', { name: 'Put the phone down' }));
    await waitFor(() => expect(close).toHaveBeenCalled(), { timeout: 5000 });
    expect(mock.go).not.toHaveBeenCalled();
  });

  it('goes to the app anyway in one tap and counts it', async () => {
    const close = vi.fn();
    render(<NightPauseCard packageName="com.instagram.android" reason="open" close={close} />);
    fireEvent.click(screen.getByRole('button', { name: 'Go to Instagram anyway' }));
    await waitFor(() => expect(mock.openPausedApp).toHaveBeenCalledWith('com.instagram.android', 600000), { timeout: 5000 });
    expect((await db.settings.get('night.pause.dismissals'))?.value).toBe(1);
  });
});
