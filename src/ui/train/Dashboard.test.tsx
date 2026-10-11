// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
      id: 's1', dayKey: today, status: 'completed', startedAt: now, endedAt: now + 1000, templateKey: 'gym-foundations-a', deleted: 0, updatedAt: now, deviceId: 'test'
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
    
    const trainedSpan = screen.getByLabelText(`${today}: trained`);
    expect(trainedSpan).toBeDefined();
    expect(trainedSpan.textContent).toBe('·');

    const restSpan = screen.getByLabelText(`${yKey}: rest`);
    expect(restSpan).toBeDefined();
    expect(restSpan.textContent).toBe('');
  });
});
