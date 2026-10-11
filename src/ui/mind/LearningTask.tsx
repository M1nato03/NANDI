import { useLiveQuery } from 'dexie-react-hooks';
import { chooseTrackDay } from '../../core/learn/tracks';
import { trackWrite } from '../../core/pendingWrites';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { go } from '../shell/router';
import { trackPacks } from './Tracks';

/** One editable planner entry for the active track, without duplicating a Tasks row. */
export function LearningTask({ day }: { day: string }) {
  const settings = useLiveQuery(() => db.settings.toArray(), []) ?? [];
  const progress = useLiveQuery(() => db.lessonProg.toArray(), []) ?? [];
  const cards = useLiveQuery(() => db.cards.toArray(), []) ?? [];
  const pack = trackPacks.find(row => row.id === settings.find(setting => setting.key === 'mind.activeTrack' && !setting.deleted)?.value);
  if (!pack) return null;
  const units = pack.body.modules.flatMap(module => module.units);
  const completed = progress.filter(row => row.packId === pack.id && row.doneDayKey && row.id.startsWith('track:')).map(row => ({ id: row.id.split(':').at(-1)!, day: row.doneDayKey! }));
  const dueReviews = cards.filter(row => !row.deleted && (row.reviews ?? 0) > 0 && row.due <= day).length;
  const plan = chooseTrackDay({ day, active: true, unitIds: units.map(row => row.id), completed, dueReviews });
  if (plan.kind !== 'new') return null;
  const unit = units.find(row => row.id === plan.unitId);
  if (!unit) return null;
  const key = `mind.trackSlot:${day}`;
  const slot = settings.find(row => row.key === key && !row.deleted)?.value;
  async function saveSlot(value: string) {
    const now = Date.now(), deviceId = await getOrCreateDeviceId(db, now);
    await trackWrite(() => db.settings.put({ key, value, updatedAt: now, deleted: 0, deviceId }));
  }
  return <section className="card track-task" aria-label="Today’s learning task"><h2>Today’s learning task</h2><p>{pack.body.track.name}: {unit.title} · {unit.minutes + 3} min</p><label>Time <input type="time" value={typeof slot === 'string' ? slot : '09:00'} onChange={event => void saveSlot(event.target.value)} /></label><button type="button" onClick={() => go('mind')}>Open in Mind</button></section>;
}
