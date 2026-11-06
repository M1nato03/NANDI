import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { picks, PICKS_KEY, readPicks, type Goal } from '../../core/welcome';
import { STAGES, type Area } from '../areas';
import { Cast } from '../cast/Cast';
import { go } from '../shell/router';
import './grow.css';

/** Spec 571 §4.3 (R8): Grow is five doors, never one long scroll. Each opens the screens its friend already has. */
export type Door = { id: 'read' | 'remember' | 'play' | 'train' | 'sleep'; title: string; line: string; area: Area; goal: Goal; route: string };
export const DOORS: readonly Door[] = [
  { id: 'read', title: 'Read', line: 'Books in short sittings', area: 'learn', goal: 'learn', route: 'grow/read' },
  { id: 'remember', title: 'Remember', line: 'Bring ideas back', area: 'review', goal: 'learn', route: 'grow/remember' },
  { id: 'play', title: 'Play', line: 'Puzzles and a mystery', area: 'mind', goal: 'mind', route: 'grow/play' },
  { id: 'train', title: 'Train', line: 'Your workout plan', area: 'train', goal: 'train', route: 'grow/train' },
  { id: 'sleep', title: 'Calm & Sleep', line: 'Breathe, kolam, bedtime', area: 'night', goal: 'sleep', route: 'grow/sleep' },
];

/** Picks (52) set the order and size: picked doors are big and first; the rest are smaller below. None is hidden. */
export function doorOrder(state: ReturnType<typeof readPicks>): { big: Door[]; small: Door[] } {
  const big = DOORS.filter(door => picks(state, door.goal));
  return { big, small: DOORS.filter(door => !big.includes(door)) };
}

function DoorButton({ door, big }: { door: Door; big: boolean }) {
  const friend = STAGES[door.area].friend;
  return <button type="button" className={`grow-door${big ? ' big' : ''}`} data-area={door.area} data-testid={`door-${door.id}`} aria-label={`${door.title}, with ${friend}`} onClick={() => go(door.route)}>
    <span className="grow-door-friend" aria-hidden="true"><Cast name={friend} pose="idle" size={big ? 56 : 40} /></span>
    <span className="grow-door-text"><strong>{door.title}</strong>{big && <span>{door.line}</span>}</span>
    <span className="grow-door-arrow" aria-hidden="true">›</span>
  </button>;
}

export function Grow() {
  const state = useLiveQuery(async () => readPicks(await db.settings.where('key').anyOf(PICKS_KEY.goals, PICKS_KEY.size).toArray()), []);
  if (!state) return <section className="screen grow-screen"><h1>Grow</h1></section>;
  const { big, small } = doorOrder(state);
  return <section className="screen grow-screen">
    <h1>Grow</h1>
    <nav className="grow-doors" aria-label="Doors">{big.map(door => <DoorButton key={door.id} door={door} big />)}</nav>
    {small.length > 0 && <><p className="grow-more">Everything else is always there.</p>
      <nav className="grow-doors small" aria-label="More doors">{small.map(door => <DoorButton key={door.id} door={door} big={false} />)}</nav></>}
  </section>;
}
