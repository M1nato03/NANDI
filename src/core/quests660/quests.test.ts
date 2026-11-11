import { describe, expect, it } from 'vitest';
import pack from '../../../content/quests660/board.json';
import type { LedgerRow } from '../../data/types';
import { deriveJar, jarActs } from '../yatra/jar';
import {
  allowed, boardErrors, boardFor, NO_SAFETY, QUEST_FRIENDS, QUEST_KIND, QUEST_MODE, questDoneId, questStones, readSafety, realityCheck, realityLine,
  type BoardPack, type BoardQuest, type QuestSafety,
} from './quests';

const board = pack as BoardPack;
const quests = board.quests;
const fact = (over: Partial<LedgerRow> & { inputs?: Record<string, unknown> }): LedgerRow => ({
  id: 'f', kind: QUEST_KIND.done, refId: 'q', mode: QUEST_MODE, dayKey: '2026-11-13', inputs: {}, updatedAt: 1, deleted: 0, deviceId: 'd', ...over,
});
const done = (questId: string, day: string, inputs: Record<string, unknown> = {}, at = 1) => fact({ id: questDoneId(questId, day), refId: questId, dayKey: day, inputs: { minutes: 5, ...inputs }, updatedAt: at });
const days = (from: string, count: number) => Array.from({ length: count }, (_, i) => new Date(Date.parse(`${from}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10));

describe('spec 660 pack: all 66 of jenil-a9\'s quests (Jenil: "no keep all the quests")', () => {
  it('passes its own rules', () => expect(boardErrors(board)).toEqual([]));
  it('66 quests: 48 friend quests (8 each), Courage 1-10, Speak 1-8; per friend 13/14/10/11/9/9; 42 gentle', () => {
    expect(quests).toHaveLength(66);
    expect(quests.filter(q => !q.track)).toHaveLength(48);
    for (const friend of QUEST_FRIENDS) expect(quests.filter(q => !q.track && q.friend === friend), friend).toHaveLength(8);
    expect(quests.filter(q => q.track === 'courage').map(q => q.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(quests.filter(q => q.track === 'speak').map(q => q.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    const per = Object.fromEntries(QUEST_FRIENDS.map(friend => [friend, quests.filter(q => q.friend === friend).length]));
    expect(per).toEqual({ Mor: 13, Moti: 14, Chiku: 10, Kapi: 11, Nandi: 9, Kachhua: 9 });
    expect(quests.filter(q => q.gentle)).toHaveLength(42);
  });
  it('safety tags: 3 strangers (email-admired, ask-near-you, ask-directions), 1 transit (stop-early), none after dark', () => {
    expect(quests.filter(q => q.safety.strangers).map(q => q.id).sort()).toEqual(['courage-ask-directions', 'courage-ask-near-you', 'courage-email-admired']);
    expect(quests.filter(q => q.safety.transit).map(q => q.id)).toEqual(['nandi-stop-early']);
    expect(quests.filter(q => q.safety.afterDark)).toEqual([]);
  });
  it('predicts on every Courage/Speak step and on no friend quest; every quest has Hinglish; the Read door is Chiku\'s new spot', () => {
    expect(quests.every(q => q.predicts === !!q.track)).toBe(true);
    expect(quests.every(q => q.text.hinglish.trim().length > 0)).toBe(true);
    expect(quests.filter(q => q.door).map(q => q.id)).toEqual(['chiku-new-spot']);
  });
  it('the validator catches a gap in a track, a friend under 6, a note left in, predicts on a friend quest', () => {
    const base = quests.slice();
    const broken: BoardPack = { ...board, quests: [
      ...base.filter(q => q.id !== 'courage-tell-them' && q.friend !== 'Nandi'),
      { ...base.find(q => q.id === 'mor-bag-reset')!, id: 'mor-note', text: { en: 'Empty your bag. (595 bag)', hinglish: 'x' } },
      { ...base.find(q => q.id === 'mor-done-list')!, id: 'mor-predicts', predicts: true },
    ] };
    const errors = boardErrors(broken).join('\n');
    expect(errors).toContain('courage steps must run');
    expect(errors).toContain('Nandi needs at least 6');
    expect(errors).toContain("editor's note");
    expect(errors).toContain('predicts must be set on track steps only');
  });
});

describe('safety: asked once, all off by default (Jenil 8 Nov)', () => {
  it('no setting = all three off; only true turns one on; there is no gender or hostel field', () => {
    expect(readSafety([])).toEqual(NO_SAFETY);
    expect(readSafety([{ key: 'quests.safety', value: { strangers: 'yes', transit: true }, updatedAt: 1, deleted: 0, deviceId: 'd' }])).toEqual({ strangers: false, transit: true, afterDark: false });
    expect(Object.keys(readSafety([])).sort()).toEqual(['afterDark', 'strangers', 'transit']);
  });
  it('all off: the 4 tagged quests never show (62 left); each switch lets in only its own kind', () => {
    expect(quests.filter(q => allowed(q, NO_SAFETY))).toHaveLength(62);
    const only = (s: Partial<QuestSafety>) => quests.filter(q => allowed(q, { ...NO_SAFETY, ...s }) && !allowed(q, NO_SAFETY)).map(q => q.id).sort();
    expect(only({ strangers: true })).toEqual(['courage-ask-directions', 'courage-ask-near-you', 'courage-email-admired']);
    expect(only({ transit: true })).toEqual(['nandi-stop-early']);
    expect(only({ afterDark: true })).toEqual([]);
    const seen = new Set(days('2026-11-13', 120).flatMap(day => boardFor({ day, quests, safety: NO_SAFETY }).map(q => q.id)));
    for (const id of ['courage-ask-directions', 'courage-ask-near-you', 'courage-email-admired', 'nandi-stop-early']) expect(seen.has(id), id).toBe(false);
  });
});

describe('the board: today\'s 3', () => {
  const at = (day: string, extra: Partial<Parameters<typeof boardFor>[0]> = {}) => boardFor({ day, quests, safety: NO_SAFETY, ...extra });
  it('3 quests from 3 different friends, the same for the same day', () => {
    for (const day of days('2026-11-13', 60)) {
      const picks = at(day);
      expect(picks, day).toHaveLength(3);
      expect(new Set(picks.map(q => q.friend)).size, day).toBe(3);
      expect(at(day).map(q => q.id)).toEqual(picks.map(q => q.id));
    }
  });
  it('no quest repeats within 3 days', () => {
    const list = days('2026-11-13', 90).map(day => at(day).map(q => q.id));
    for (let i = 0; i < list.length; i++) for (let back = 1; back <= 3 && back <= i; back++) for (const id of list[i]!) expect(list[i - back], `day ${i} ${id}`).not.toContain(id);
  });
  it('the board moves through the whole pack: every allowed quest shows within 120 days', () => {
    const seen = new Set(days('2026-11-13', 120).flatMap(day => at(day).map(q => q.id)));
    expect(seen.size).toBe(62);
  });
  it('a swapped quest never comes back the same day, and the board stays at 3 friends', () => {
    const day = '2026-11-20';
    const first = at(day);
    const after = at(day, { swapped: [first[0]!.id] });
    expect(after.map(q => q.id)).not.toContain(first[0]!.id);
    expect(after).toHaveLength(3);
    expect(new Set(after.map(q => q.friend)).size).toBe(3);
  });
  it('a soft day shows gentle quests only', () => {
    for (const day of days('2026-11-13', 30)) expect(at(day, { soft: true }).every(q => q.gentle), day).toBe(true);
  });
  it('the time filter: 5 min at home shows only 5-minute home quests', () => {
    for (const day of days('2026-11-13', 20)) {
      const picks = at(day, { filter: { minutes: 5, where: 'home' } });
      expect(picks.length).toBeGreaterThan(0);
      expect(picks.every(q => q.minutes === 5 && q.where.includes('home'))).toBe(true);
    }
  });
});

describe('pay: jar minutes from economy.v12From only', () => {
  const chapter = (day: string, at: number): LedgerRow => ({ id: `chapter:book:c1:${day}`, kind: 'chapter', refId: 'book:c1', mode: 'read', dayKey: day, inputs: {}, updatedAt: at, deleted: 0, deviceId: 'd' });
  it('+5 for 5-15 min, +10 for 30+, under the 60-a-day cap', () => {
    const facts = [done('a', '2026-11-13', { minutes: 5 }, 1), done('b', '2026-11-13', { minutes: 15 }, 2), done('c', '2026-11-13', { minutes: 30 }, 3), done('d', '2026-11-13', { minutes: 60 }, 4)];
    expect(jarActs(facts, [], undefined, '2026-11-13').map(act => act.minutes)).toEqual([5, 5, 10, 10]);
    const many = Array.from({ length: 8 }, (_, i) => done(`q${i}`, '2026-11-13', { minutes: 60 }, i));
    const counted = deriveJar(jarActs(many, [], undefined, '2026-11-13'), '2026-11-01', '2026-11-13').reduce((sum, entry) => sum + entry.counted, 0);
    expect(counted).toBe(60);
  });
  it('before the cutoff, or with no cutoff, the jar is identical (G4)', () => {
    const facts = [chapter('2026-11-12', 1), done('chiku-new-spot', '2026-11-12', { minutes: 15, wraps: 'chapter:book:c1:2026-11-12' }, 2)];
    const without = jarActs([chapter('2026-11-12', 1)], []);
    expect(jarActs(facts, [])).toEqual(without);
    expect(jarActs(facts, [], undefined, '2026-11-13')).toEqual(without);
  });
  it('a night quest pays nothing; a done quest is one act however often it is read', () => {
    expect(jarActs([done('kachhua-five-good', '2026-11-13', { night: true })], [], undefined, '2026-11-13')).toEqual([]);
    const once = done('a', '2026-11-13');
    expect(jarActs([once], [], undefined, '2026-11-13')).toHaveLength(1);
  });
  it('double pay: "read 10 pages" + its chapter fact fill the jar once, with the quest\'s minutes', () => {
    const facts = [chapter('2026-11-13', 1), done('chiku-new-spot', '2026-11-13', { minutes: 15, wraps: 'chapter:book:c1:2026-11-13' }, 2)];
    const acts = jarActs(facts, [], undefined, '2026-11-13');
    expect(acts.map(act => [act.kind, act.minutes])).toEqual([['quest', 5]]);
  });
});

describe('stones and Reality Check', () => {
  it('one stone per finished quest-day, by fact id (a restore can neither duplicate nor drop one); "didn\'t do it" earns none', () => {
    const rows = [done('a', '2026-11-13'), done('a', '2026-11-13'), done('b', '2026-11-14'), done('c', '2026-11-14', { outcome: 'not-done' })];
    expect(questStones(rows).map(stone => stone.questId)).toEqual(['a', 'b']);
  });
  it('appears after 3 predicted quests and keeps the honest misses', () => {
    const rows = [
      done('courage-ask-at-home', '2026-11-13', { prediction: 'ignore', outcome: 'fine', fear: 4, felt: 2 }),
      done('courage-tell-them', '2026-11-14', { prediction: 'ignore', outcome: 'happened', fear: 4, felt: 3 }),
    ];
    expect(realityCheck(rows)).toBeNull();
    rows.push(done('courage-class-question', '2026-11-15', { prediction: 'freeze', outcome: 'better', fear: 5, felt: 1 }));
    const check = realityCheck(rows)!;
    expect(check.quests).toBe(3);
    expect(check.predictions.find(p => p.id === 'ignore')).toMatchObject({ made: 2, happened: 1 });
    expect(check.fearBefore).toBe(4.3);
    expect(check.feltAfter).toBe(2);
    expect(realityLine(check)).toBe('You predicted “they’ll ignore me” twice. It happened once.');
  });
  it('a quest not done this time is left out of the Reality Check', () => {
    const rows = ['a', 'b', 'c'].map((id, i) => done(id, `2026-11-1${i + 3}`, { prediction: 'awkward', outcome: i === 2 ? 'not-done' : 'fine' }));
    expect(realityCheck(rows)).toBeNull();
  });
});

describe('the board never touches Plan\'s side quests', () => {
  it('its own fact mode and quest- kinds (deriveEconomy reads kind "done" as a Plan task)', () => {
    expect(QUEST_MODE).not.toBe('quests');
    expect(Object.values(QUEST_KIND).every(kind => kind.startsWith('quest-'))).toBe(true);
  });
  it('a BoardQuest is a plain record (no profile field)', () => {
    const keys = new Set(quests.flatMap(q => Object.keys(q as BoardQuest)));
    expect([...keys].some(key => /gender|hostel/i.test(key))).toBe(false);
  });
});
