import { useLiveQuery } from 'dexie-react-hooks';
import { dayKey } from '../../core/time/dayKey';
import { db } from '../../data/db';
import type { DailyLogRow, LearnDropRow, LedgerRow, PuzzleRunRow, TaskRow } from '../../data/types';
import { dailyDropId, nightDropId } from '../learn/flow';
import { go } from './router';
import { featuredDailyDone } from '../../core/puzzles/shelf';
import { picks, PICKS_KEY, readPicks, type Picks } from '../../core/welcome';

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
// Spec 571 stage 1: the reading dot is named for its tab, Grow, and opens it.
const DOT_NAME = { plan: 'Plan', read: 'Grow', night: 'Night' } as const;
const DOT_ROUTE = { plan: 'plan', read: 'grow', night: 'night' } as const;
/**
 * Spec 52: only the dots for picked areas (learn and mind share Read, where Games live; Train has no dot). At size 'all'
 * all three show, as before; a person who picked only Train sees no dots row.
 */
export function todayDots(state: Picks): ('plan' | 'read' | 'night')[] {
  return (['plan', 'read', 'night'] as const).filter(dot => dot === 'plan' ? picks(state, 'plan') : dot === 'read' ? picks(state, 'learn') || picks(state, 'mind') : picks(state, 'sleep'));
}
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
      picks: readPicks(await db.settings.where('key').anyOf(PICKS_KEY.goals, PICKS_KEY.size).toArray()),
    };
  }, [dayKey(now)]);
  const status = data && todayDotStatus(now, data);
  const dots = data ? todayDots(data.picks) : (['plan', 'read', 'night'] as const);
  if (!dots.length) return null;
  return <nav className="today-dots" aria-label="Today status">{dots.map(area => <button key={area} type="button" className={`today-dot deck-area-${DOT_AREA[area]}`} aria-label={`${DOT_NAME[area]}: ${status?.[area] ? 'done' : 'not done'}`} onClick={() => go(DOT_ROUTE[area])}><span data-done={status?.[area] ? 'true' : 'false'} /><small className="today-dot-label" aria-hidden="true">{DOT_NAME[area]}</small></button>)}</nav>;
}
