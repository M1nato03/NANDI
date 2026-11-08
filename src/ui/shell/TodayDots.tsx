import { dayKey } from '../../core/time/dayKey';
import type { DailyLogRow, LearnDropRow, LedgerRow, PuzzleRunRow, TaskRow } from '../../data/types';
import { featuredDailyDone } from '../../core/puzzles/shelf';

type DotData = { tasks: TaskRow[]; ledger: LedgerRow[]; drop?: LearnDropRow; nightDrop?: LearnDropRow; runs: PuzzleRunRow[]; log?: DailyLogRow };
const finished = (row?: LearnDropRow) => !!row && row.drop.items.length > 0 && row.drop.cursor >= row.drop.items.length;
/**
 * Spec 33's day status (Plan, Read, Night done today). The header shows rings now (spec 571 §0.20, src/ui/rings); the
 * economy feedback still reads this status for its finish line.
 */
export function todayDotStatus(now: number, data: DotData): Record<'plan' | 'read' | 'night', boolean> {
  const today = dayKey(now);
  return {
    plan: !!data.log?.planDone || data.tasks.some(row => !row.deleted && !!row.doneAt && dayKey(row.doneAt) === today),
    // A chapter or today's drop read, or Kapi's daily board (Games live in Read; spec 29's featured daily counts).
    read: finished(data.drop) || data.ledger.some(row => !row.deleted && row.kind === 'chapter' && row.dayKey === today) || featuredDailyDone(data.runs, today),
    night: finished(data.nightDrop) || data.ledger.some(row => !row.deleted && row.kind === 'lightsout' && row.dayKey === today && row.inputs.metTarget === true),
  };
}
