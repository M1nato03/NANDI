import { useLiveQuery } from 'dexie-react-hooks';
import { readReviewRamp, reviewAllowance } from '../../core/learn/reviewSessions';
import { db } from '../../data/db';
import { go } from '../shell/router';

export function ReviewToday({ day }: { day: string }) {
  const cards = useLiveQuery(() => db.cards.toArray(), []) ?? [];
  const flags = useLiveQuery(() => db.flags.toArray(), []) ?? [];
  const state = useLiveQuery(() => db.settings.get('mind.reviewRamp'), []);
  const hidden = new Set(flags.filter(row => row.hidden && !row.deleted).map(row => row.refId));
  const due = cards.filter(row => !row.deleted && !hidden.has(`card:${row.id}`) && row.due <= day).length;
  const count = reviewAllowance(due, day, readReviewRamp(state?.value));
  if (!count) return null;
  return <div className="review-today"><p><strong>Reviews · {count} for today</strong></p>{due > count && <p className="deck-meta">{due} waiting</p>}<button type="button" className="secondary" onClick={() => go('mind/reviews')}>Review cards</button></div>;
}
