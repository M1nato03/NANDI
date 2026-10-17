import { useLiveQuery } from 'dexie-react-hooks';
import { dayKey } from '../../core/time/dayKey';
import { deckMode } from '../../core/deckMode';
import { effectiveShutdown } from '../../core/tasks/planner';
import { RULES } from '../../core/rules.config';
import { db } from '../../data/db';
import { NightDeck } from '../night/NightDeck';
import { useTaskBoard } from '../tasks/useTaskBoard';
import { DayDeck } from './DayDeck';

export function Now() {
  const board = useTaskBoard();
  const today = dayKey(board.now);
  const settings = useLiveQuery(() => db.settings.toArray(), []) ?? [];
  const log = useLiveQuery(() => db.dailyLog.get(today), [today]);
  const setting = (key: string, fallback: string) => {
    const value = settings.find(row => row.key === key && !row.deleted)?.value;
    return typeof value === 'string' ? value : fallback;
  };
  const bedtime = setting('planner.bedtime', RULES.night.defaultBedtime);
  const shutdown = effectiveShutdown(setting('planner.shutdown', RULES.night.defaultShutdown), bedtime);
  const mode = deckMode(board.now, shutdown, bedtime, log?.windDownAt);
  return mode === 'day' ? <DayDeck board={board} /> : <NightDeck now={board.now} bedtime={bedtime} board={board} />;
}
