import { useLiveQuery } from 'dexie-react-hooks';
import { dayKey } from '../../core/time/dayKey';
import { db } from '../../data/db';
import type { DailyLogRow, LearnDropRow, LedgerRow, PuzzleRunRow, TaskRow } from '../../data/types';
import { dailyDropId, nightDropId } from '../learn/flow';
import { go } from './router';
import { featuredDailyDone } from '../../core/puzzles/shelf';

type DotData = { tasks: TaskRow[]; ledger: LedgerRow[]; drop?: LearnDropRow; nightDrop?: LearnDropRow; runs: PuzzleRunRow[]; log?: DailyLogRow };
const finished = (row?: LearnDropRow) => !!row && row.drop.items.length > 0 && row.drop.cursor >= row.drop.items.length;
/** Spec 33: the top dots are Plan, Read and Night (Train and Mind left the tab bar). */
export function todayDotStatus(now: number, data: DotData): Record<'plan' | 'read' | 'night', boolean> {
  const today = dayKey(now);
  return {
    plan: !!data.log?.planDone || data.tasks.some(row => !row.deleted && !!row.doneAt && dayKey(row.doneAt) === today),
    // A chapter or today's drop read, or Kapi's daily board (Games live in Read; spec 29's featured daily counts).
    read: finished(data.drop) || data.ledger.some(row => !row.deleted && row.kind === 'chapter' && row.dayKey === today) || featuredDailyDone(data.runs, today),
    night: finished(data.nightDrop) || data.ledger.some(row => !row.deleted && row.kind === 'lightsout' && row.dayKey === today && row.inputs.metTarget === true),
  };
}

const DOT_AREA = { plan: 'do', read: 'learn', night: 'night' } as const;
export function TodayDots({ now }: { now: number }) {
  // Only what today's dots need, read through the indexes (cj2 heavy data #6: this read 5 whole tables per write).
  const data = useLiveQuery(async () => {
    const today = dayKey(now);
    return {
      tasks: await db.tasks.where('status').equals('done').toArray(),
      ledger: await db.ledger.where('dayKey').equals(today).filter(row => row.kind === 'chapter' || row.kind === 'lightsout').toArray(),
      drop: await db.learnDrops.get(dailyDropId(now)),
      nightDrop: await db.learnDrops.get(nightDropId(now)),
      runs: await db.puzzleRuns.where('dayKey').equals(today).toArray(),
      log: await db.dailyLog.get(today),
    };
  }, [dayKey(now)]);
  const status = data && todayDotStatus(now, data);
  return <nav className="today-dots" aria-label="Today status">{(['plan', 'read', 'night'] as const).map(area => <button key={area} type="button" className={`today-dot deck-area-${DOT_AREA[area]}`} aria-label={`${area[0]!.toUpperCase()}${area.slice(1)}: ${status?.[area] ? 'done' : 'not done'}`} onClick={() => go(area)}><span data-done={status?.[area] ? 'true' : 'false'} /><small className="today-dot-label" aria-hidden="true">{`${area[0]!.toUpperCase()}${area.slice(1)}`}</small></button>)}</nav>;
}
