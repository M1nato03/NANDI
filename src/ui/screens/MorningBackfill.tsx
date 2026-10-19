import { useState } from 'react';
import { db } from '../../data/db';
import { addEconomyDays } from '../../core/economy/deriveEconomy';
import { recordMorningBackfill } from '../../data/repos/economy';
import type { DailyLogRow } from '../../data/types';

export function MorningBackfill({ today, now, logs }: { today: string; now: number; logs: DailyLogRow[] }) {
  const [message, setMessage] = useState('');
  const yesterday = addEconomyDays(today, -1);
  if (new Date(now).getHours() >= 12 || logs.some(row => row.dayKey === yesterday && row.lightsOutAt != null && !row.deleted)) return null;
  const slots = Array.from({ length: 28 }, (_, i) => {
    const minute = (21 * 60 + i * 15) % (24 * 60);
    return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
  });
  const save = async (time: string) => {
    try { await recordMorningBackfill(db, yesterday, time, now); setMessage('Last night noted.'); }
    catch { setMessage('Could not save that time. Try again.'); }
  };
  return <section className="card morning-backfill" aria-label="Last night"><span className="eyebrow">A quick note</span><h2>When did you put your phone down last night?</h2><p>This check-in is for your record. It earns 0 XP.</p><div className="backfill-slots">{slots.map(time => <button type="button" className="secondary" key={time} onClick={() => void save(time)}>{time}</button>)}</div>{message && <p role="status">{message}</p>}</section>;
}
