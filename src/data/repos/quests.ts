import { ulid } from 'ulidx';
import { applyTap, archivePast, complete, completionFactId, selectWeekly, weekKey, type Quest } from '../../core/quests';
import { dayKey } from '../../core/time/dayKey';
import { trackWrite } from '../../core/pendingWrites';
import { getOrCreateDeviceId } from '../device';
import type { NandiDb } from '../db';
import type { QuestRow } from '../types';
import pack from '../../../content/quests/quests.core.json';

const definitions = pack.body.quests;
function asQuest(row: QuestRow): Quest { return row; }

export function createQuestRepo(db: NandiDb) {
  async function award(row: QuestRow, now: number): Promise<void> {
    const id = completionFactId(row);
    if (await db.ledger.get(id)) return;
    await db.ledger.add({ id, mode: 'quests', kind: 'quest', refId: row.id,
      dayKey: dayKey(now), inputs: { target: row.target, progress: row.target, questKind: row.kind }, updatedAt: now, deleted: 0, deviceId: row.deviceId });
  }
  return {
    async ensureWeek(now: number): Promise<void> {
      const week = weekKey(now);
      await trackWrite(async () => {
        const deviceId = await getOrCreateDeviceId(db, now);
        await db.transaction('rw', db.quests, async () => {
          const all = await db.quests.toArray();
          for (const row of archivePast(all, week)) if (row.status !== all.find(old => old.id === row.id)?.status) await db.quests.put({ ...row, updatedAt: now });
          if (all.some(row => row.week === week)) return;
          const previous = [...new Set(all.map(row => row.week).filter(value => value < week))].sort().at(-1);
          const previousIds = all.filter(row => row.week === previous && !row.custom).map(row => row.sourceId);
          const picked = selectWeekly(definitions.map(q => ({ ...q, sourceId: q.id })), week, previousIds);
          await db.quests.bulkAdd(picked.map(q => ({ id: `${q.id}:${week}`, sourceId: q.id, week, title: q.title,
            kind: q.kind as QuestRow['kind'], target: q.target, unit: q.unit, step: q.step, progress: 0,
            tapIds: [], status: 'active' as const, custom: false, updatedAt: now, deleted: 0 as const, deviceId })));
        });
      });
    },
    async swap(now: number): Promise<void> {
      const week = weekKey(now);
      await trackWrite(async () => db.transaction('rw', db.quests, async () => {
        const all = await db.quests.toArray();
        const current = all.filter(q => q.week === week);
        if (current.some(q => q.status === 'swapped')) throw new Error('One swap per week is already used.');
        const outgoing = current.find(q => !q.custom && q.status === 'active' && q.progress === 0);
        if (!outgoing) throw new Error('No untouched suggestion to swap.');
        const previous = [...new Set(all.map(row => row.week).filter(value => value < week))].sort().at(-1);
        const excluded = new Set(all.filter(q => q.week === week || q.week === previous).map(q => q.sourceId));
        const replacement = selectWeekly(definitions.filter(q => !excluded.has(q.id)).map(q => ({ ...q, sourceId: q.id })), `${week}:swap`, [], 1)[0];
        if (!replacement) throw new Error('No more suggestions available.');
        await db.quests.put({ ...outgoing, status: 'swapped', updatedAt: now });
        await db.quests.add({ id: `${replacement.id}:${week}`, sourceId: replacement.id, week, title: replacement.title,
          kind: replacement.kind as QuestRow['kind'], target: replacement.target, unit: replacement.unit,
          step: replacement.step, progress: 0, tapIds: [], status: 'active', custom: false,
          updatedAt: now, deleted: 0, deviceId: outgoing.deviceId });
      }));
    },
    async addCustom(input: { title: string; kind: QuestRow['kind']; target: number; unit: string; step: number }, now: number): Promise<void> {
      const title = input.title.trim();
      if (!title || title.length > 120 || !Number.isSafeInteger(input.target) || input.target < 1 || input.target > 10000 ||
        !Number.isSafeInteger(input.step) || input.step < 1 || input.step > input.target || input.unit.length > 24 ||
        (input.kind === 'total' && !input.unit.trim())) throw new Error('Check the quest details.');
      const deviceId = await getOrCreateDeviceId(db, now);
      const id = ulid(now);
      await trackWrite(() => db.quests.add({ id, sourceId: id, week: weekKey(now), title,
        kind: input.kind, target: input.kind === 'once' ? 1 : input.target,
        unit: input.kind === 'once' ? '' : input.unit.trim(), step: input.kind === 'once' ? 1 : input.step,
        progress: 0, tapIds: [], status: 'active', custom: true, updatedAt: now, deleted: 0, deviceId }).then(() => undefined));
    },
    async tap(id: string, tapId: string, delta: number, now: number): Promise<void> {
      await trackWrite(async () => db.transaction('rw', db.quests, db.ledger, async () => {
        const row = await db.quests.get(id);
        if (!row || row.week !== weekKey(now)) throw new Error('Quest is not in this week.');
        const next = applyTap(asQuest(row), tapId, delta);
        if (next === row) return;
        await db.quests.put({ ...row, ...next, updatedAt: now });
        if (row.status !== 'done' && next.status === 'done') await award(row, now);
      }));
    },
    async done(id: string, now: number): Promise<void> {
      await trackWrite(async () => db.transaction('rw', db.quests, db.ledger, async () => {
        const row = await db.quests.get(id);
        if (!row || row.week !== weekKey(now)) throw new Error('Quest is not in this week.');
        const next = complete(asQuest(row));
        if (next === row) return;
        await db.quests.put({ ...row, ...next, updatedAt: now });
        await award(row, now);
      }));
    },
  };
}
