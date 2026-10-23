import { describe, expect, it } from 'vitest';
import { PROGRAMS } from './programs';
import { afterHingeSession, hingeSlot, nordicCardDue, nordicState, nordicSwitchShown, slotName } from './nordic';
import type { SessionExercise } from './types';

const hinge = PROGRAMS['hostel-bodyweight']!.exercises.find(ex => ex.isBodyweightLadder === 'hinge')!;
const sets = (...reps: number[]): SessionExercise => ({ exerciseId: 'sl-rdl', sets: reps.map(count => ({ load: 0, reps: count })), painFlag: false, targetRepMin: 5, targetRepMax: 8 });
const clear = { rank: 2, today: '2026-10-23', softDay: false, afterBedtime: false, heatMode: false };

describe('spec 17: slow SL-RDL before any Nordic', () => {
  it('SL-RDL 3x8 with no ready turns on slow SL-RDL, which stays rank 2 with its own name', () => {
    expect(afterHingeSession({}, sets(8, 8, 7), { rank: 2, day: '2026-10-20' })).toEqual({});
    const slow = afterHingeSession({}, sets(8, 8, 8), { rank: 2, day: '2026-10-20' });
    expect(slow).toEqual({ slow: true });
    const slot = hingeSlot({ ...hinge, exerciseId: 'sl-rdl' }, 2, slow);
    expect(slot).toMatchObject({ exerciseId: 'sl-rdl', variant: 'slow', sets: 3, repMin: 5, repMax: 8 });
    expect(slotName(slot)).toBe('Slow single-leg RDL');
    expect(slotName({ exerciseId: 'sl-rdl' })).toBe('Single-leg RDL');
  });

  it('a ready person moves on as before, with no slow step', () => {
    expect(afterHingeSession({ ready: true }, sets(8, 8, 8), { rank: 2, day: '2026-10-20' })).toEqual({ ready: true });
    expect(hingeSlot({ ...hinge, exerciseId: 'sl-rdl' }, 2, { ready: true, slow: true }).variant).toBeUndefined();
  });

  it('the card is due only after slow SL-RDL 3x8', () => {
    expect(nordicCardDue({}, clear)).toBe(false);
    const slow = afterHingeSession({}, sets(8, 8, 8), { rank: 2, day: '2026-10-20' });
    expect(nordicCardDue(slow, clear)).toBe(false);
    const met = afterHingeSession(slow, sets(8, 8, 8), { rank: 2, variant: 'slow', day: '2026-10-22' });
    expect(met.slowMetDay).toBe('2026-10-22');
    expect(nordicCardDue(met, clear)).toBe(true);
    expect(nordicCardDue({ ...met, ready: true }, clear)).toBe(false);
    expect(nordicCardDue({ ...met, ready: false }, clear)).toBe(false);
  });

  it('"Not now" hides it for 14 days, and after that it needs slow 3x8 again', () => {
    const met = { slow: true, slowMetDay: '2026-10-22', notNowDay: '2026-10-23' };
    expect(nordicCardDue(met, { ...clear, today: '2026-10-23' })).toBe(false);
    expect(nordicCardDue(met, { ...clear, today: '2026-11-10' })).toBe(false);
    const early = afterHingeSession(met, sets(8, 8, 8), { rank: 2, variant: 'slow', day: '2026-11-05' });
    expect(nordicCardDue(early, { ...clear, today: '2026-11-05' })).toBe(false);
    const again = afterHingeSession(met, sets(8, 8, 8), { rank: 2, variant: 'slow', day: '2026-11-06' });
    expect(nordicCardDue(again, { ...clear, today: '2026-11-06' })).toBe(true);
  });

  it('a soft day, after bedtime and hot-day mode each hide it', () => {
    const met = { slow: true, slowMetDay: '2026-10-22' };
    expect(nordicCardDue(met, clear)).toBe(true);
    expect(nordicCardDue(met, { ...clear, softDay: true })).toBe(false);
    expect(nordicCardDue(met, { ...clear, afterBedtime: true })).toBe(false);
    expect(nordicCardDue(met, { ...clear, heatMode: true })).toBe(false);
    expect(nordicCardDue(met, { ...clear, rank: 1 })).toBe(false);
  });

  it('ready gives a banded Nordic at 2x3 once, then the usual plan', () => {
    const intro = hingeSlot({ ...hinge, exerciseId: 'banded-nordic' }, 3, { ready: true });
    expect(intro).toMatchObject({ exerciseId: 'banded-nordic', sets: 2, repMin: 3, repMax: 3, variant: 'nordic-intro' });
    const done = afterHingeSession({ ready: true }, { ...sets(3, 3), exerciseId: 'banded-nordic' }, { rank: 3, variant: 'nordic-intro', day: '2026-10-24' });
    expect(done).toEqual({ ready: true, introDone: true });
    expect(hingeSlot({ ...hinge, exerciseId: 'banded-nordic' }, 3, done)).toEqual({ ...hinge, exerciseId: 'banded-nordic' });
  });

  it('someone placed on a Nordic step before the gate reads as ready and past the first session', () => {
    expect(nordicState(undefined, 3)).toEqual({ ready: true, introDone: true });
    expect(nordicState(undefined, 4)).toEqual({ ready: true, introDone: true });
    expect(nordicSwitchShown(nordicState(undefined, 3))).toBe(true);
    expect(hingeSlot({ ...hinge, exerciseId: 'banded-nordic' }, 3, nordicState(undefined, 3)).variant).toBeUndefined();
    expect(nordicState(undefined, 2)).toEqual({});
    expect(nordicSwitchShown({ slow: true })).toBe(false);
    expect(nordicState({ ready: false, slow: true }, 2)).toEqual({ ready: false, slow: true });
  });
});
