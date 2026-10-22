import { describe, expect, it } from 'vitest';
import { shareWindow } from './shareGate';

const at = (time: string) => new Date(`2026-11-05T${time}:00`).getTime();
const bedtime = (value: string) => [{ key: 'planner.bedtime', value, updatedAt: 1, deleted: 0 as const, deviceId: 'test' }];

describe('spec 19 share window', () => {
  it('stays shut from the 04:00 day roll until 06:00 for someone still awake (Codex review of shares)', () => {
    expect(shareWindow(at('03:59'), bedtime('23:30'), [])).not.toBe('day');
    expect(shareWindow(at('04:00'), bedtime('23:30'), [])).not.toBe('day');
    expect(shareWindow(at('05:59'), bedtime('23:30'), [])).not.toBe('day');
    expect(shareWindow(at('06:00'), bedtime('23:30'), [])).toBe('day');
    expect(shareWindow(at('12:00'), bedtime('23:30'), [])).toBe('day');
    expect(shareWindow(at('23:45'), bedtime('23:30'), [])).not.toBe('day');
  });
});
