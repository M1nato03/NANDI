import { useLiveQuery } from 'dexie-react-hooks';
import { dayKey } from '../../core/time/dayKey';
import { featuredSpec } from '../../core/puzzles/daily';
import { db } from '../../data/db';
import type { DailyLogRow, LearnDropRow, LedgerRow, PuzzleRunRow, SessionRow, TaskRow } from '../../data/types';
import { dailyDropId } from '../learn/flow';
import { go } from './router';

export function todayDotStatus(now: number, data: { tasks: TaskRow[]; sessions: SessionRow[]; ledger: LedgerRow[]; drop?: LearnDropRow; runs: PuzzleRunRow[]; log?: DailyLogRow }): Record<'plan' | 'train' | 'learn' | 'mind', boolean> {
  const today = dayKey(now);
  const featured = featuredSpec(today);
  return {
    plan: !!data.log?.planDone || data.tasks.some(row => !row.deleted && !!row.doneAt && dayKey(row.doneAt) === today),
    train: data.sessions.some(row => !row.deleted && row.dayKey === today && ['completed', 'minimum', 'partial', 'safety'].includes(row.status)) || data.ledger.some(row => !row.deleted && row.id === `train-rest:${today}`),
    learn: !!data.drop && data.drop.drop.cursor >= data.drop.drop.items.length,
    mind: data.runs.some(row => !row.deleted && row.id === `daily:${today}:${featured.type}:${featured.diff}` && row.result === 'solved'),
  };
}

export function TodayDots({ now }: { now: number }) {
  const data = useLiveQuery(async () => ({
    tasks: await db.tasks.toArray(),
    sessions: await db.sessions.toArray(),
    ledger: await db.ledger.toArray(),
    drop: await db.learnDrops.get(dailyDropId(now)),
    runs: await db.puzzleRuns.toArray(),
    log: await db.dailyLog.get(dayKey(now)),
  }), [dayKey(now)]);
  const status = data && todayDotStatus(now, data);
  return <nav className="today-dots" aria-label="Today status">{(['plan', 'train', 'learn', 'mind'] as const).map(area => <button key={area} type="button" className={`today-dot deck-area-${{ plan: 'do', train: 'move', learn: 'learn', mind: 'think' }[area]}`} aria-label={`${area[0]!.toUpperCase()}${area.slice(1)}: ${status?.[area] ? 'done' : 'not done'}`} onClick={() => go(area)}><span data-done={status?.[area] ? 'true' : 'false'} /></button>)}</nav>;
}
