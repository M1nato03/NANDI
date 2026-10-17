import { useLiveQuery } from 'dexie-react-hooks';
import { RULES } from '../../core/rules.config';
import { db } from '../../data/db';
import { NightDeck } from '../night/NightDeck';
import { useTaskBoard } from '../tasks/useTaskBoard';

export function Now() {
  const board = useTaskBoard();
  const settings = useLiveQuery(() => db.settings.toArray(), []) ?? [];
  const setting = (key: string, fallback: string) => {
    const value = settings.find(row => row.key === key && !row.deleted)?.value;
    return typeof value === 'string' ? value : fallback;
  };
  const bedtime = setting('planner.bedtime', RULES.night.defaultBedtime);
  return <NightDeck now={board.now} bedtime={bedtime} board={board} />;
}
