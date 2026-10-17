import { expect, it } from 'vitest';
import * as v from 'valibot';
import raw from '../../../content/deck/deck.greene.json';
import { deckPackSchema } from '../../data/packs/schemas';
import { buildReviewSession, itemOptions } from './deck';

const deck = v.parse(deckPackSchema, raw);
const meta = { updatedAt: 1, deleted: 0 as const, deviceId: 'test' };

it('Review session takes the oldest waiting cards up to its cap', () => {
  const cards = deck.body.cards.map(card => ({ ...meta, id: card.id, deckId: 'greene', due: '2026-10-10', box: 2 }));
  const hidden = new Set([`card:${cards[0]!.id}`]);
  const session = buildReviewSession('2026-10-11', cards, [], [{ ...meta, id: 'people', value: 1000, n: 0 }], hidden, deck, 5);
  expect(session).toHaveLength(5);
  expect(session.every(entry => entry.type === 'recall')).toBe(true);
  expect(session.some(entry => entry.id === cards[0]!.id)).toBe(false);
});

it('People-reading items remain available in a separate short practice set', () => {
  const session = buildReviewSession('2026-10-11', [], [], [], new Set(), deck, 10);
  expect(session.length).toBeGreaterThan(0);
  expect(session.length).toBeLessThanOrEqual(10);
  expect(session.every(entry => entry.kind === 'item')).toBe(true);
});

it('spot and scenario answers remain correct after option shuffle', () => {
  for (const item of deck.body.items.slice(0, 10)) {
    const { options, answer } = itemOptions(item, deck);
    expect(options[answer]).toBe(item.t === 'spot' ? item.kind === 'type' ? item.type : deck.body.tactics?.[item.topic] : item.opts[item.a]);
  }
});
