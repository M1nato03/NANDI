import { describe, expect, it } from 'vitest';
import { focusPhase, startFocus } from './focus';

describe('focus cycles', () => {
  const start = new Date('2026-10-11T03:50:00+05:30').getTime();
  it('uses absolute elapsed time across 04:00 and backgrounding', () => {
    const focus = startFocus('task', start).newFocus;
    expect(focusPhase(focus, start + 24 * 60_000).phase).toBe('work');
    expect(focusPhase(focus, start + 25 * 60_000).phase).toBe('break');
    expect(focusPhase(focus, start + 30 * 60_000).phase).toBe('work');
    expect(focusPhase(focus, start + 4 * 30 * 60_000).phase).toBe('longBreak');
  });
  it('holds the phase while paused and supports 50/10', () => {
    const focus = { ...startFocus('task', start).newFocus, cyclePreset: '50/10' as const, pauses: [{ at: start + 20 * 60_000, resumeAt: undefined as number | undefined }] };
    expect(focusPhase(focus, start + 90 * 60_000).remainingMs).toBe(30 * 60_000);
    focus.pauses[0]!.resumeAt = start + 90 * 60_000;
    expect(focusPhase(focus, start + 120 * 60_000).phase).toBe('break');
  });
  it('extends only the selected work block', () => {
    const focus = { ...startFocus('task', start).newFocus, cycleExtensions: { '1': 10 * 60_000 } };
    expect(focusPhase(focus, start + 30 * 60_000).phase).toBe('work');
    expect(focusPhase(focus, start + 35 * 60_000).phase).toBe('break');
    expect(focusPhase(focus, start + 40 * 60_000)).toMatchObject({ phase: 'work', cycle: 2, remainingMs: 25 * 60_000 });
  });
});
