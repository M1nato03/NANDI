import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { hexagon, HEX_SHOW_AFTER_DAYS, HEX_WINDOW_DAYS, type HexStat } from '../../core/hexagon';
import { dayKey } from '../../core/time/dayKey';

const SIZE = 260, CENTRE = SIZE / 2, RADIUS = 84;
const corner = (index: number, scale: number) => {
  const angle = -Math.PI / 2 + index * Math.PI / 3;
  return [CENTRE + Math.cos(angle) * RADIUS * scale, CENTRE + Math.sin(angle) * RADIUS * scale] as const;
};
const ring = (scale: number) => Array.from({ length: 6 }, (_, index) => corner(index, scale).join(',')).join(' ');

/** Spec 05 §8: the six-stat hexagon, last 28 days. Shown once there is a week to read. */
export function HexagonCard({ now }: { now: number }) {
  const today = dayKey(now);
  const result = useLiveQuery(async () => {
    const [ledger, tasks, events, puzzleRuns, plans, programs, drops, settings] = await Promise.all([
      db.ledger.toArray(), db.tasks.toArray(), db.taskEvents.toArray(), db.puzzleRuns.toArray(), db.plans.toArray(), db.programs.toArray(), db.learnDrops.toArray(), db.settings.toArray(),
    ]);
    return hexagon(today, { ledger, tasks, events, puzzleRuns, plans, programs, drops, settings });
  }, [today]);
  if (!result || result.days < HEX_SHOW_AFTER_DAYS) return null;
  return <section className="card you-hexagon" aria-label="Your six stats">
    <span className="eyebrow">Last {Math.min(result.days, HEX_WINDOW_DAYS)} days</span><h2>Your six stats</h2>
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="hex-chart" aria-hidden="true">
      {[1, 2 / 3, 1 / 3].map(scale => <polygon key={scale} points={ring(scale)} className="hex-ring" />)}
      {result.stats.map((_, index) => <line key={index} x1={CENTRE} y1={CENTRE} x2={corner(index, 1)[0]} y2={corner(index, 1)[1]} className="hex-spoke" />)}
      <polygon points={result.stats.map((stat, index) => corner(index, (stat.value ?? 0) / 100).join(',')).join(' ')} className="hex-shape" />
      {result.stats.map((stat, index) => {
        const [x, y] = corner(index, 1.32);
        return <text key={stat.key} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="hex-label"><tspan x={x} dy="-0.5em">{stat.label}</tspan><tspan x={x} dy="1.2em" className="hex-value">{stat.value ?? '–'}</tspan></text>;
      })}
    </svg>
    <ul className="hex-list">{result.stats.map((stat: HexStat) => <li key={stat.key}><strong>{stat.label} · {stat.value ?? 'not yet'}</strong><span>{stat.about}</span></li>)}</ul>
  </section>;
}
