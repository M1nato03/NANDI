import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { bundledPacks } from '../../data/packs/seed';
import type { DeckPack } from '../../core/learn/deck';
import { readReviewRamp, reviewAllowance } from '../../core/learn/reviewSessions';
import { seedDeckCards } from '../../data/repos/learn';
import { getOrCreateDeviceId } from '../../data/device';
import { trackWrite } from '../../core/pendingWrites';
import { dayKey } from '../../core/time/dayKey';
import { recordError } from '../errorRing';
import { EmptyState } from '../EmptyState';
import { go } from '../shell/router';

const deck = bundledPacks.find((pack): pack is DeckPack => pack.kind === 'deck');

/**
 * Spec 571 (one place): card reviews and the people-reading deck are Moti's, so they live on Grow › Remember only.
 * Kapi's shelf no longer shows them; the rounds themselves still play in the same player.
 */
export function CardReviews({ onReady }: { onReady?: () => void } = {}) {
  const today = dayKey(Date.now()); // eslint-disable-line react-hooks/purity
  const data = useLiveQuery(async () => ({
    cards: await db.cards.toArray(), flags: await db.flags.toArray(),
    ramp: await db.settings.get('mind.reviewRamp'), on: await db.settings.get('mind.deckOn'),
  }), []);
  // CLS (gate-s2): the screen shows what sits below this card only once it is here, so nothing below jumps when it lands.
  useEffect(() => { if (data) onReady?.(); }, [data, onReady]);
  if (!data) return null;
  const hidden = new Set(data.flags.filter(row => row.hidden && !row.deleted).map(row => row.refId));
  const dueCount = data.cards.filter(row => !row.deleted && !hidden.has(`card:${row.id}`) && row.due <= today).length;
  const todayReviews = reviewAllowance(dueCount, today, readReviewRamp(data.ramp?.deleted ? undefined : data.ramp?.value));
  // Older installs already hold the seeded cards; for them the deck simply stays on.
  const deckOn = (data.on?.value === true && !data.on.deleted) || data.cards.some(row => row.deckId === 'greene' && !row.deleted);
  const turnOn = async () => {
    const time = Date.now(), deviceId = await getOrCreateDeviceId(db, time);
    await trackWrite(() => db.settings.put({ key: 'mind.deckOn', value: true, updatedAt: time, deleted: 0, deviceId }));
    if (deck) await seedDeckCards(db, deck);
  };
  return <section className="card remember-cards" aria-label="Card reviews" data-testid="card-reviews"><h2>Card reviews</h2>
    {todayReviews ? <><p>{todayReviews} for today</p>{dueCount > todayReviews && <p className="deck-meta">{dueCount} waiting</p>}<button type="button" className="secondary" onClick={() => go('grow/remember/cards')}>Review cards</button></>
      : dueCount ? <><p>That's enough for today</p><p className="deck-meta">{dueCount} waiting</p></> : <EmptyState area="learn">You're all caught up for now.</EmptyState>}
    {deckOn ? <button type="button" className="secondary" onClick={() => go('grow/remember/deck')}>Practice people-reading deck</button>
      : <div className="mind-deck-off"><p className="small">People-reading deck: {deck?.body.cards.length ?? 0} cards on reading people and power. It stays off until you want it.</p><button type="button" className="secondary" onClick={() => void turnOn().catch(error => recordError('window', error))}>Turn on the deck</button></div>}
  </section>;
}
