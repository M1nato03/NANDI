import { describe, expect, it } from 'vitest';
import type { LedgerRow } from '../../data/types';
import { areaOf, courtyardLine, deriveCourtyard, phaseAt, poseFor, stageFor } from './courtyard';
import { buildStorybook, recentWeeks, storyWeekStart } from './storybook';

let serial = 0;
const fact = (dayKey: string, mode: string, kind: string, inputs: Record<string, unknown> = {}): LedgerRow =>
  ({ id: `${kind}:${++serial}`, dayKey, mode, kind, refId: String(serial), inputs, updatedAt: serial, deleted: 0, deviceId: 'test' });
const days = (from: string, count: number) => Array.from({ length: count }, (_, i) => new Date(Date.parse(`${from}T12:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10));

describe('courtyard areas', () => {
  it('maps each ledger fact to the friend who looks after it', () => {
    expect(areaOf(fact('2026-10-20', 'train', 'session'))).toBe('train');
    expect(areaOf(fact('2026-10-20', 'tasks', 'done'))).toBe('plan');
    expect(areaOf(fact('2026-10-20', 'mind', 'learn-answer', { dropId: 'drop:daily:2026-10-20' }))).toBe('learn');
    expect(areaOf(fact('2026-10-20', 'mind', 'learn-answer', { dropId: 'drop:night:2026-10-20' }))).toBe('remember');
    expect(areaOf(fact('2026-10-20', 'mind', 'learn-retention'))).toBe('remember');
    expect(areaOf(fact('2026-10-20', 'mind', 'board'))).toBe('mind');
    expect(areaOf(fact('2026-10-20', 'bonuses', 'lightsout', { metTarget: true }))).toBe('sleep');
    expect(areaOf(fact('2026-10-20', 'bonuses', 'lightsout', { metTarget: false }))).toBeNull();
  });
  it('from the batch 5 day on, a puzzle or lesson after bedtime grows nothing; earlier days keep what they grew', () => {
    const late = (day: string, kind: string, inputs: Record<string, unknown> = {}) => fact(day, 'mind', kind, { afterBedtime: true, ...inputs });
    expect(areaOf(late('2026-10-20', 'board'))).toBe('mind');
    expect(areaOf(late('2026-10-20', 'board'), '2026-10-25')).toBe('mind');
    expect(areaOf(late('2026-10-25', 'board'), '2026-10-25')).toBeNull();
    expect(areaOf(late('2026-10-25', 'learn-answer', { dropId: 'drop:daily:2026-10-25' }), '2026-10-25')).toBeNull();
    // The night deck is the calm thing offered after bedtime: its reviews still count for Moti.
    expect(areaOf(late('2026-10-25', 'learn-answer', { dropId: 'drop:night:2026-10-25' }), '2026-10-25')).toBe('remember');
    const state = deriveCourtyard([late('2026-10-24', 'board'), late('2026-10-25', 'board')], '2026-10-25', undefined, '2026-10-25');
    expect(state.areas.find(area => area.id === 'mind')!.days).toBe(1);
    expect(areaOf(fact('2026-10-20', 'quests', 'quest'))).toBeNull();
    expect(areaOf({ ...fact('2026-10-20', 'tasks', 'done'), deleted: 1 })).toBeNull();
  });

  it('grows by practice days, not by how much was done in one day', () => {
    const many = Array.from({ length: 40 }, () => fact('2026-10-20', 'tasks', 'done'));
    const state = deriveCourtyard(many, '2026-10-20');
    expect(state.areas.find(a => a.id === 'plan')).toMatchObject({ days: 1, stage: 0, today: true, nextAt: 3, nextObject: 'a marigold pot' });
    expect([0, 2, 3, 6, 7, 14, 29, 30, 59, 60, 400].map(stageFor)).toEqual([0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5]);
  });

  it('never shrinks after missed days and counts the tree from any area', () => {
    const train = days('2026-09-01', 7).map(d => fact(d, 'train', 'session'));
    const sleep = days('2026-09-08', 7).map(d => fact(d, 'bonuses', 'lightsout', { metTarget: true }));
    const state = deriveCourtyard([...train, ...sleep], '2026-10-20');
    expect(state.areas.find(a => a.id === 'train')).toMatchObject({ days: 7, stage: 2, today: false });
    expect(state.activeDays).toBe(14);
    expect(state.treeStage).toBe(3);
    expect(state.areas.find(a => a.id === 'remember')).toMatchObject({ days: 0, stage: 0, nextAt: 3 });
  });

  it('ignores facts after today', () => {
    expect(deriveCourtyard([fact('2026-10-21', 'tasks', 'done')], '2026-10-20').activeDays).toBe(0);
  });
});

describe('courtyard time and poses', () => {
  const at = (clock: string, day = '2026-10-20') => new Date(`${day}T${clock}:00`).getTime();
  it('follows the person\'s own shutdown and bedtime, across midnight', () => {
    expect(phaseAt(at('06:30'), '23:15', '01:30')).toBe('morning');
    expect(phaseAt(at('12:00'), '23:15', '01:30')).toBe('day');
    expect(phaseAt(at('23:30'), '23:15', '01:30')).toBe('evening');
    expect(phaseAt(at('00:45', '2026-10-21'), '23:15', '01:30')).toBe('evening');
    expect(phaseAt(at('02:00', '2026-10-21'), '23:15', '01:30')).toBe('night');
    expect(phaseAt(at('03:59', '2026-10-21'), '23:15', '01:30')).toBe('night');
    expect(phaseAt(at('04:00', '2026-10-21'), '23:15', '01:30')).toBe('morning');
    expect(phaseAt(at('22:30'), '21:00', '22:00')).toBe('night');
  });
  it('shows a friend cheering only for real work, and never sad', () => {
    expect(poseFor(true, 'day')).toBe('cheer');
    expect(poseFor(false, 'day')).toBe('idle');
    expect(poseFor(false, 'evening')).toBe('rest');
    expect(poseFor(true, 'night')).toBe('rest');
  });
  it('words the day kindly', () => {
    const quiet = deriveCourtyard([], '2026-10-20');
    expect(courtyardLine(quiet, 'day')).toBe('The courtyard is quiet. Any small step wakes a friend.');
    const one = deriveCourtyard([fact('2026-10-20', 'train', 'session')], '2026-10-20');
    expect(courtyardLine(one, 'day')).toBe('Nandi trained with you today.');
    expect(courtyardLine(one, 'night')).toMatch(/asleep/);
  });
});

describe('storybook', () => {
  it('tells the week from real counts, busiest area first', () => {
    const week = days('2026-10-12', 7);
    const facts = [...week.slice(0, 5).map(d => fact(d, 'train', 'session')), fact(week[2]!, 'tasks', 'done'), fact('2026-10-05', 'mind', 'board')];
    const book = buildStorybook(facts, '2026-10-12');
    expect(book.weekEnd).toBe('2026-10-18');
    expect(book.pages.map(p => p.kind)).toEqual(['cover', 'area', 'area', 'close']);
    expect(book.pages[1]).toMatchObject({ friend: 'Nandi', days: 5, stage: 1 });
    expect(book.pages[1]!.text).toContain('5');
    expect(book.pages[2]).toMatchObject({ friend: 'Mor', days: 1 });
    expect(book.pages.some(p => p.area === 'mind')).toBe(false);
    for (const page of book.pages) expect(page.text).not.toContain('{n}');
  });
  it('gives a quiet week one gentle page', () => {
    const book = buildStorybook([], '2026-10-12');
    expect(book.pages.map(p => p.kind)).toEqual(['cover', 'quiet']);
    expect(book.pages[1]!.text).not.toMatch(/miss|lost|fail|broke/i);
  });
  it('finds Mondays', () => {
    expect(storyWeekStart('2026-10-18')).toBe('2026-10-12');
    expect(storyWeekStart('2026-10-19')).toBe('2026-10-19');
    expect(recentWeeks('2026-10-21', 3)).toEqual(['2026-10-19', '2026-10-12', '2026-10-05']);
  });
});

describe('soft days in the courtyard', () => {
  it('a soft-only day lights a lantern and counts as an active day for the tree', () => {
    const facts = days('2026-11-02', 3).map(day => fact(day, 'soft', 'soft', { choice: 'breathe', state: 'tired' }));
    const state = deriveCourtyard(facts, '2026-11-04');
    expect(state.lanterns).toBe(3);
    expect(state.activeDays).toBe(3);
  });
});
