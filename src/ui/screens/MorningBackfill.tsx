import { useState } from 'react';
import { db } from '../../data/db';
import { addEconomyDays } from '../../core/economy/deriveEconomy';
import { recordMorningBackfill } from '../../data/repos/economy';
import type { DailyLogRow } from '../../data/types';

export function MorningBackfill({ today, now, logs, hadYesterday }: { today: string; now: number; logs: DailyLogRow[]; hadYesterday: boolean }) {
  const [message, setMessage] = useState('');
  const [time, setTime] = useState('');
  const [bucket, setBucket] = useState('');
  const yesterday = addEconomyDays(today, -1);
  const prior = logs.find(row => row.dayKey === yesterday && !row.deleted);
  if (new Date(now).getHours() >= 12 || !hadYesterday || (prior?.lightsOutAt != null && prior.reelsBucket)) return null;
  const slots = Array.from({ length: 28 }, (_, i) => {
    const minute = (21 * 60 + i * 15) % (24 * 60);
    return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
  });
  const save = async () => {
    try { await recordMorningBackfill(db, yesterday, prior?.lightsOutAt != null ? undefined : time, prior?.reelsBucket ?? bucket, now); setMessage('Last night noted.'); }
    catch { setMessage('Choose the missing details and try again.'); }
  };
  return <section className="card morning-backfill" aria-label="Last night"><span className="eyebrow">A quick note</span><h2>How did last night go?</h2><p>This check-in is for your record. It earns 0 XP.</p>
    {prior?.lightsOutAt == null ? <label>Phone-down time <select value={time} onChange={event => setTime(event.target.value)}><option value="">Choose a time</option>{slots.map(value => <option key={value} value={value}>{value}</option>)}</select></label> : <p>Phone-down time already noted.</p>}
    {!prior?.reelsBucket && <label>Reels time <select value={bucket} onChange={event => setBucket(event.target.value)}><option value="">Choose a range</option><option value="none">None</option><option value="under-15">Under 15 min</option><option value="15-60">15 to 60 min</option><option value="over-60">Over 60 min</option></select></label>}
    <button type="button" disabled={prior?.lightsOutAt == null && !time || !prior?.reelsBucket && !bucket} onClick={() => void save()}>Save last night</button>{message && <p role="status">{message}</p>}</section>;
}
