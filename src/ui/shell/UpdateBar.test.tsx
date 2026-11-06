// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sw = vi.hoisted(() => ({
  state: { offlineReady: false, needRefresh: false }, listeners: new Set<() => void>(),
  dismiss: vi.fn(), apply: vi.fn(),
}));
vi.mock('../../platform/sw-register', () => ({
  getServiceWorkerState: () => sw.state,
  subscribeToServiceWorker: (listener: () => void) => { sw.listeners.add(listener); return () => sw.listeners.delete(listener); },
  dismissOfflineReady: () => { sw.dismiss(); sw.state = { ...sw.state, offlineReady: false }; sw.listeners.forEach(listener => listener()); },
  applyServiceWorkerUpdate: sw.apply,
}));
vi.mock('dexie-react-hooks', () => ({ useLiveQuery: () => false }));
vi.mock('../../data/canReloadNow', () => ({ canReloadNow: () => Promise.resolve(true) }));
import { OfflineReady } from './UpdateBar';

const ready = () => act(() => { sw.state = { ...sw.state, offlineReady: true }; sw.listeners.forEach(listener => listener()); });
const mutate = async (change: () => void) => { await act(async () => { change(); await Promise.resolve(); }); };
const toast = () => screen.queryByRole('status', { name: 'Offline ready' });

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  sw.state = { offlineReady: false, needRefresh: false };
});
afterEach(() => { cleanup(); document.body.replaceChildren(); vi.useRealTimers(); });

describe('offline-ready notice', () => {
  it('shows once for four seconds when no sheet is open', () => {
    render(<OfflineReady />);
    ready();
    expect(toast()?.textContent).toBe('Ready to work offline');
    act(() => vi.advanceTimersByTime(3999));
    expect(toast()).not.toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(toast()).toBeNull();
    expect(sw.dismiss).toHaveBeenCalledTimes(1);
  });

  for (const kind of ['dialog', 'backdrop']) {
    it(`waits for an open ${kind}, then gives the notice its full four seconds`, async () => {
      const sheet = document.createElement('div');
      if (kind === 'dialog') sheet.setAttribute('aria-modal', 'true');
      else sheet.className = 'sheet-backdrop';
      document.body.append(sheet);
      render(<OfflineReady />);
      ready();
      act(() => vi.advanceTimersByTime(10_000));
      expect(toast()).toBeNull();
      expect(sw.dismiss).not.toHaveBeenCalled();
      await mutate(() => sheet.remove());
      expect(toast()).not.toBeNull();
      act(() => vi.advanceTimersByTime(4000));
      expect(toast()).toBeNull();
      expect(sw.dismiss).toHaveBeenCalledTimes(1);
    });
  }

  it('drops a notice that waited a minute, even after the sheet closes', async () => {
    const sheet = document.createElement('div');
    sheet.className = 'sheet-backdrop';
    document.body.append(sheet);
    render(<OfflineReady />);
    ready();
    act(() => vi.advanceTimersByTime(60_001));
    await mutate(() => sheet.remove());
    expect(toast()).toBeNull();
    expect(sw.dismiss).toHaveBeenCalledTimes(1);
  });

  it('waits for every sheet, including one closed through an attribute change', async () => {
    const first = document.createElement('div'), second = document.createElement('div');
    first.className = 'sheet-backdrop';
    second.setAttribute('aria-modal', 'true');
    document.body.append(first, second);
    render(<OfflineReady />);
    ready();
    await mutate(() => first.classList.remove('sheet-backdrop'));
    expect(toast()).toBeNull();
    await mutate(() => second.setAttribute('aria-modal', 'false'));
    expect(toast()).not.toBeNull();
  });

  it('ends a visible notice when a sheet opens, without replaying it', async () => {
    render(<OfflineReady />);
    ready();
    expect(toast()).not.toBeNull();
    const sheet = document.createElement('div');
    sheet.className = 'sheet-backdrop';
    await mutate(() => document.body.append(sheet));
    expect(toast()).toBeNull();
    await mutate(() => sheet.remove());
    expect(toast()).toBeNull();
    act(() => vi.advanceTimersByTime(60_000));
    expect(sw.dismiss).toHaveBeenCalledTimes(1);
  });

  it('waits while the top bar is hidden (the Night route), however long, then shows once with its full four seconds', async () => {
    const shell = document.createElement('div');
    const bar = document.createElement('header');
    bar.className = 'topbar';
    bar.style.display = 'none';
    shell.append(bar);
    document.body.append(shell);
    render(<OfflineReady />, { container: bar });
    ready();
    expect(toast()).toBeNull();
    act(() => vi.advanceTimersByTime(5 * 60_000));
    expect(sw.dismiss).not.toHaveBeenCalled();
    expect(toast()).toBeNull();
    // Leaving Night shows the top bar again (the shell's class changes with it).
    await mutate(() => { bar.style.display = ''; shell.className = 'app-shell'; });
    expect(toast()).not.toBeNull();
    act(() => vi.advanceTimersByTime(3_999));
    expect(sw.dismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(sw.dismiss).toHaveBeenCalledTimes(1);
  });
});
