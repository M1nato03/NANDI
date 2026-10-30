// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from './Dashboard';
import { dayKey } from '../../core/time';
import type { ProgramRow, SessionRow, LedgerRow } from '../../data/types';

afterEach(() => cleanup());

describe('Dashboard', () => {
  it('adds accessible labels and non-colour marks to heatmap days', () => {
    const now = Date.now();
    const today = dayKey(now);
    
    // Create completed sessions and rest ledger
    const sessions: SessionRow[] = [{
      id: 's1', dayKey: today, status: 'completed', workingSets: 6, startedAt: now, endedAt: now + 1000, templateKey: 'gym-foundations-a', deleted: 0, updatedAt: now, deviceId: 'test'
    }];
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = dayKey(yesterday.getTime());
    const ledger: LedgerRow[] = [{
      id: `train-rest:${yKey}`, kind: 'train-rest' as const, refId: '', inputs: {}, mode: 'auto' as const, dayKey: yKey, deleted: 0, updatedAt: yesterday.getTime(), deviceId: 'test'
    }];

    const program: ProgramRow = {
      id: 'p1', track: 'gym', weeklyTarget: 3, days: [1, 3, 5], restDay: 0, heatModeEnabled: false,
      sessionsStarted: 1, startedAt: now - 86400000 * 2, lastRetestWeek: 0, equipment: { gymAccess: true, dumbbells: false, barbell: null, smallestPlate: null, resistanceBand: false, sturdyAnchor: false, pullUpBar: false }, placement: {}, deleted: 0, updatedAt: now, deviceId: 'test'
    };

    const data = { program, sessions, sets: [], prs: [], state: [], ledger };
    
    render(<Dashboard data={data} page="today" setPage={() => {}} busy={false} message="" act={vi.fn()} />);
    
    // a11y C13: one label for the whole map, and each day's state as a visible mark with a key, not colour alone.
    const map = screen.getByRole('img', { name: 'Last 28 days: 1 trained, 1 rest day' });
    expect(map.querySelector(`[title="${today}"]`)?.textContent).toBe('✓');
    expect(map.querySelector(`[title="${yKey}"]`)?.textContent).toBe('–');
    expect(screen.getByText('✓ trained · – rest · blank: nothing logged')).toBeDefined();
  });
});

describe('Nordic ready card (spec 17)', () => {
  // Noon, as in the e2e spec: the bedtime check below needs a fixed clock.
  const now = new Date(2026, 9, 23, 12).getTime();
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(now); });
  afterEach(() => { vi.useRealTimers(); });
  const today = dayKey(now);
  const program: ProgramRow = {
    id: 'train-program', track: 'bodyweight', weeklyTarget: 3, days: [1, 3, 5], restDay: 0, heatModeEnabled: false, sessionsStarted: 2, startedAt: now - 86400000 * 2, lastRetestWeek: 0,
    equipment: { gymAccess: false, dumbbells: false, barbell: null, smallestPlate: null, resistanceBand: true, sturdyAnchor: true, pullUpBar: false }, placement: { hinge: 2 },
    nordic: { slow: true, slowMetDay: today }, deleted: 0, updatedAt: now, deviceId: 'test',
  };
  const show = (overrides: Partial<ProgramRow> = {}, extra: { softFacts?: LedgerRow[]; bedtime?: string } = {}) => render(<Dashboard data={{ program: { ...program, ...overrides }, sessions: [], sets: [], prs: [], state: [], ledger: [], bedtime: '23:59', ...extra }} page="today" setPage={() => {}} busy={false} message="" act={vi.fn()} />);

  it('keeps the ready button off until all three boxes are ticked', () => {
    show();
    const ready = screen.getByRole('button', { name: "I'm ready" });
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes).toHaveLength(3);
    for (const box of boxes.slice(0, 2)) fireEvent.click(box);
    expect((ready as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(boxes[2]!);
    expect((ready as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByRole('button', { name: 'Not now' })).toBeDefined();
  });

  it('stays hidden on a soft day, after bedtime and in hot-day mode', () => {
    const soft: LedgerRow = { id: `soft-start:${today}:1`, mode: 'soft', kind: 'soft-start', refId: today, dayKey: today, inputs: { state: 'tired' }, deleted: 0, updatedAt: now, deviceId: 'test' };
    for (const view of [show({}, { softFacts: [soft] }), show({ heatModeEnabled: true }), show({}, { bedtime: '11:00' })]) {
      expect(view.queryByRole('heading', { name: 'Ready for a harder hamstring move?' })).toBeNull();
      view.unmount();
    }
  });
});
