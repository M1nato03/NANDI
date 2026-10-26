import { useLiveQuery } from 'dexie-react-hooks';
import { dayKey } from '../../core/time/dayKey';
import { db } from '../../data/db';
import type { DailyLogRow, LearnDropRow, LedgerRow, PuzzleRunRow, SessionRow, TaskRow } from '../../data/types';
import { dailyDropId } from '../learn/flow';
import { go } from './router';
import { featuredDailyDone } from '../../core/puzzles/shelf';

export function todayDotStatus(now: number, data: { tasks: TaskRow[]; sessions: SessionRow[]; ledger: LedgerRow[]; drop?: LearnDropRow; runs: PuzzleRunRow[]; log?: DailyLogRow }): Record<'plan' | 'train' | 'learn' | 'mind', boolean> {
  const today = dayKey(now);
  return {
    plan: !!data.log?.planDone || data.tasks.some(row => !row.deleted && !!row.doneAt && dayKey(row.doneAt) === today),
    train: data.sessions.some(row => !row.deleted && row.dayKey === today && ['completed', 'minimum', 'partial', 'safety'].includes(row.status)) || data.ledger.some(row => !row.deleted && row.id === `train-rest:${today}`),
    learn: !!data.drop && data.drop.drop.cursor >= data.drop.drop.items.length,
    // Spec 29: the featured type's daily may be its easy shelf board while the ramp applies.
    mind: featuredDailyDone(data.runs, today),
  };
}

export function TodayDots({ now }: { now: number }) {
  // Only what today's four dots need, read through the indexes (cj2 heavy data #6: this read 5 whole tables per write).
  const data = useLiveQuery(async () => {
    const today = dayKey(now);
    const rest = await db.ledger.get(`train-rest:${today}`);
    const runs = await db.puzzleRuns.where('dayKey').equals(today).toArray();
    return {
      tasks: await db.tasks.where('status').equals('done').toArray(),
      sessions: await db.sessions.where('dayKey').equals(today).toArray(),
      ledger: rest ? [rest] : [],
      drop: await db.learnDrops.get(dailyDropId(now)),
      runs,
      log: await db.dailyLog.get(today),
    };
  }, [dayKey(now)]);
  const status = data && todayDotStatus(now, data);
  return <nav className="today-dots" aria-label="Today status">{(['plan', 'train', 'learn', 'mind'] as const).map(area => <button key={area} type="button" className={`today-dot deck-area-${{ plan: 'do', train: 'move', learn: 'learn', mind: 'think' }[area]}`} aria-label={`${area[0]!.toUpperCase()}${area.slice(1)}: ${status?.[area] ? 'done' : 'not done'}`} onClick={() => go(area)}><span data-done={status?.[area] ? 'true' : 'false'} /><small className="today-dot-label" aria-hidden="true">{`${area[0]!.toUpperCase()}${area.slice(1)}`}</small></button>)}</nav>;
}
