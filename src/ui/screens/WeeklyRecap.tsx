import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { buildRecap, type RecapSources, type WeeklyRecapData } from '../../core/recap';
import { db } from '../../data/db';

const lines = (recap: WeeklyRecapData) => [
  `${recap.tasks} tasks finished`, `${recap.focusHours} focus hours`, `${recap.workouts} workouts`,
  `${recap.sideQuests} side quests completed`, `${recap.concepts} concepts learned`, `${recap.nights} nights back on plan`,
];

export async function shareRecap(recap: WeeklyRecapData): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1350;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image canvas unavailable');
  const css = getComputedStyle(document.documentElement);
  const background = css.getPropertyValue('--surface').trim() || '#151515';
  const ink = css.getPropertyValue('--ink').trim() || '#f5f1e9';
  const accent = css.getPropertyValue('--accent').trim() || '#ffb25b';
  context.fillStyle = background; context.fillRect(0, 0, 1080, 1350);
  context.fillStyle = accent; context.font = 'bold 54px sans-serif'; context.fillText('● NANDI', 88, 125);
  context.fillStyle = ink; context.font = 'bold 70px sans-serif'; context.fillText('What your time became', 88, 280);
  context.font = '32px sans-serif'; context.fillText(`${recap.from} to ${recap.to}`, 88, 345);
  lines(recap).forEach((line, index) => {
    context.fillStyle = accent; context.fillRect(88, 420 + index * 135, 14, 74);
    context.fillStyle = ink; context.font = 'bold 42px sans-serif'; context.fillText(line, 125, 473 + index * 135);
  });
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not make recap image')), 'image/png'));
  const file = new File([blob], `nandi-recap-${recap.from}.png`, { type: 'image/png' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'What your time became' }); return 'shared'; }
    catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'; }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = file.name;
  document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

export function WeeklyRecap({ now }: { now?: number }) {
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const sources = useLiveQuery(async (): Promise<RecapSources> => {
    const [tasks, focus, sessions, quests, concepts, logs] = await Promise.all([
      db.tasks.toArray(), db.focus.toArray(), db.sessions.toArray(), db.quests.toArray(), db.learnConcepts.toArray(), db.dailyLog.toArray(),
    ]);
    return { tasks, focus, sessions, quests, concepts, logs };
  }, []);
  const [message, setMessage] = useState('');
  const recap = sources ? buildRecap(now ?? clock, sources) : null;
  return <div className="weekly-recap" role="region" aria-label="What your time became recap">
    <span className="pill">Last week, in real life</span><h2>What your time became</h2>
    {recap ? <><p>{recap.from} to {recap.to}</p><ul>{lines(recap).map(line => <li key={line}>{line}</li>)}</ul>
      <button type="button" onClick={() => void shareRecap(recap).then(result => setMessage(result === 'downloaded' ? 'Recap image downloaded.' : result === 'shared' ? 'Recap shared.' : '')).catch(() => setMessage('Could not make the recap image.'))}>Share</button>
    </> : <p>Getting your week together…</p>}
    {message && <p role="status">{message}</p>}
  </div>;
}
