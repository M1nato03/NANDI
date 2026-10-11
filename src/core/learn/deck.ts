import { shuffleOptions } from './learn';
import type { CardRow, DeckProgRow, RatingRow } from '../../data/types';
import type { Pack } from '../../data/packs/schemas';

export type DeckPack = Extract<Pack, { kind: 'deck' }>;
export type ReviewEntry = { kind: 'card' | 'item'; id: string; type: string };
export function buildReviewSession(day: string, cards: CardRow[], progress: DeckProgRow[], ratings: RatingRow[], hidden: Set<string>, deck: DeckPack, maxCards = 20): ReviewEntry[] {
  const state = new Map(progress.map(row => [row.id, row]));
  const due = cards.filter(row => !row.deleted && !hidden.has(`card:${row.id}`) && row.due <= day).sort((a, b) => a.due.localeCompare(b.due) || Number(b.id.startsWith('track:')) - Number(a.id.startsWith('track:')) || a.id.localeCompare(b.id));
  const recallCount = Math.min(due.length > 12 ? 4 : 3, due.length);
  const entries: ReviewEntry[] = due.slice(0, recallCount).map(row => ({ kind: 'card', id: row.id, type: 'recall' }));
  const wanted: Record<string, number> = { scenario: 2, spot: 2, mystery: 1, teaser: recallCount > 3 ? 1 : 2 };
  for (const [type, count] of Object.entries(wanted)) {
    const rating = ratings.find(row => row.id === (type === 'mystery' ? 'detective' : 'people'))?.value ?? 1000;
    const candidates = deck.body.items.filter(item => item.t === type && !hidden.has(item.id) && (!state.has(item.id) || (state.get(item.id)!.due <= day && (state.get(item.id)!.b ?? 0) < 90)));
    candidates.sort((a, b) => Number(state.has(a.id)) - Number(state.has(b.id)) || Math.abs(a.d - rating) - Math.abs(b.d - rating));
    entries.push(...candidates.slice(0, count).map(item => ({ kind: 'item' as const, id: item.id, type })));
  }
  const remaining = entries.slice(0, maxCards);
  const out: ReviewEntry[] = [];
  while (remaining.length) {
    const i = remaining.findIndex(entry => entry.type !== out.at(-1)?.type);
    out.push(remaining.splice(i < 0 ? 0 : i, 1)[0]!);
  }
  return out;
}
export function itemOptions(item: DeckPack['body']['items'][number], deck: DeckPack): { options: string[]; answer: number } {
  if (item.t !== 'spot') {
    const order = shuffleOptions(item.opts.length);
    return { options: order.map(index => item.opts[index]!), answer: order.indexOf(item.a) };
  }
  const correct = item.kind === 'type' ? item.type ?? '' : deck.body.tactics?.[item.topic] ?? '';
  const pool = item.kind === 'type' ? (deck.body.types ?? []).filter(value => value !== correct && !item.avoid?.includes(value)) : Object.entries(deck.body.tactics ?? {}).filter(([key]) => key !== item.topic).map(([, value]) => value);
  const options = [correct, ...pool.slice(0, 3)];
  const order = shuffleOptions(options.length);
  return { options: order.map(index => options[index]!), answer: order.indexOf(0) };
}
