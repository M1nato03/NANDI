import { describe, expect, it } from 'vitest';
import { CHIKU_ACTS, CHIKU_PROPS, KUNAL_SCENE, chikuDue, chikuMatches, chikuOrder, chikuProblems, type ChikuScene } from './chiku';
import { deriveEconomy } from '../economy/deriveEconomy';
import type { LedgerRow, SettingRow } from '../../data/types';

const ids = ['habits-m1', 'habits-m2', 'habits-m3', 'habits-m4'];
const cutoffs: SettingRow[] = ['economy.v2From', 'economy.v3From'].map(key => ({ key, value: '2026-10-01', updatedAt: 1, deleted: 0, deviceId: 'test' }));

describe('spec 30 Chiku scenes', () => {
  it('the Kunal fixture passes the content lint; each card has its own guess and the right one matches what happened', () => {
    expect(chikuProblems(KUNAL_SCENE, ids)).toEqual([]);
    expect(KUNAL_SCENE.cards.map((_, card) => chikuMatches(KUNAL_SCENE, card))).toEqual([true, false, false]);
    expect(new Set(KUNAL_SCENE.guesses.map(guess => guess.why)).size).toBe(3);
  });
  it('rejects a scene with a missing field, a prop or act off the lists, a made-up misconception or two right cards', () => {
    const broken = (change: (scene: ChikuScene) => void) => { const scene = structuredClone(KUNAL_SCENE); change(scene); return chikuProblems(scene, ids); };
    expect(broken(scene => { scene.newDay.prop = 'rocket' as never; })).toContain('prop "rocket" is not in the library');
    expect(broken(scene => { scene.truth.act = 'dance' as never; })).toContain('act "dance" is not in the set');
    expect(broken(scene => { scene.cards[1]!.misconceptionId = 'made-up'; })).toContain('card "Wanting to revise" must name one of the idea\'s misconceptions');
    expect(broken(scene => { scene.cards[2]!.correct = true; })).toContain('needs exactly one right card');
    expect(broken(scene => { scene.cards.pop(); })).toContain('needs exactly 3 cards');
    expect(broken(scene => { scene.truth.caption = ' '; })).toContain('truth needs a caption');
    expect(broken(scene => { scene.guesses[0]!.answer = 'yes'; })).toContain("the right card's guess must match what happened");
    expect(CHIKU_PROPS).toHaveLength(24);
    expect(CHIKU_ACTS).toHaveLength(10);
  });
  it('comes once per idea, after its last step only, never after bedtime, and not again once played', () => {
    const concept = { id: 'habits', chiku: KUNAL_SCENE, steps: [{ id: 'habits-s1' }, { id: 'habits-s2' }, { id: 'habits-s3' }] };
    expect(chikuDue(concept, 'habits-s3', false, [])).toBe(true);
    expect(chikuDue(concept, 'habits-s2', false, [])).toBe(false);
    expect(chikuDue(concept, 'habits-s3', true, [])).toBe(false);
    expect(chikuDue(concept, 'habits-s3', false, [{ id: 'chiku:habits' }])).toBe(false);
    expect(chikuDue({ ...concept, chiku: undefined }, 'habits-s3', false, [])).toBe(false);
  });
  it("the right card's place rotates with the idea and day", () => {
    const places = new Set(Array.from({ length: 30 }, (_, day) => chikuOrder(`habits:2026-11-${String(day + 1).padStart(2, '0')}`).indexOf(0)));
    expect(places).toEqual(new Set([0, 1, 2]));
    for (let day = 0; day < 30; day++) expect([...chikuOrder(`x:${day}`)].sort()).toEqual([0, 1, 2]);
    expect(chikuOrder('habits:2026-11-05')).toEqual(chikuOrder('habits:2026-11-05'));
  });
  it('pays 5 XP once per idea from 26 Oct, the same whichever card came first, and nothing after bedtime', () => {
    const fact = (dayKey: string, conceptId: string, inputs: Record<string, unknown> = {}): LedgerRow => ({ id: `chiku:${conceptId}`, dayKey, mode: 'mind', kind: 'chiku', refId: conceptId, inputs: { afterBedtime: false, ...inputs }, updatedAt: 1, deleted: 0, deviceId: 't' });
    const mind = (facts: LedgerRow[], day: string) => deriveEconomy(facts, undefined, cutoffs, day).days.find(row => row.dayKey === day)?.mind ?? 0;
    expect(mind([fact('2026-10-25', 'habits')], '2026-10-25')).toBe(0);
    expect(mind([fact('2026-11-03', 'habits', { firstCard: 0, matched: true })], '2026-11-03')).toBe(5);
    expect(mind([fact('2026-11-03', 'habits', { firstCard: 2, matched: false })], '2026-11-03')).toBe(5);
    expect(mind([fact('2026-11-03', 'habits'), fact('2026-11-03', 'anchoring')], '2026-11-03')).toBe(10);
    expect(mind([fact('2026-11-03', 'habits', { afterBedtime: true })], '2026-11-03')).toBe(0);
  });
});
