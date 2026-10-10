import { expect, it } from 'vitest';
import * as v from 'valibot';
import raw from '../../../content/deck/deck.greene.json';
import { deckPackSchema } from '../../data/packs/schemas';
import { buildReviewSession, itemOptions } from './deck';

const deck = v.parse(deckPackSchema, raw);
const meta = { updatedAt: 1, deleted: 0 as const, deviceId: 'test' };

it('Greene session mixes due recall and rated items without consecutive types', () => {
  const cards = deck.body.cards.map(card => ({ ...meta, id: card.id, deckId: 'greene', due: '2026-10-10', box: 2 }));
  const hidden = new Set([`card:${cards[0]!.id}`]);
  const session = buildReviewSession('2026-10-11', cards, [], [{ ...meta, id: 'people', value: 1000, n: 0 }], hidden, deck);
  expect(session.filter(entry => entry.type === 'recall')).toHaveLength(4);
  expect(session.some(entry => entry.id === cards[0]!.id)).toBe(false);
  expect(session.filter(entry => entry.type === 'scenario')).toHaveLength(2);
  expect(session.filter(entry => entry.type === 'spot')).toHaveLength(2);
  expect(session.filter(entry => entry.type === 'mystery')).toHaveLength(1);
  for (let i = 1; i < session.length; i++) expect(session[i]!.type).not.toBe(session[i - 1]!.type);
});

it('spot and scenario answers remain correct after option shuffle', () => {
  for (const item of deck.body.items.slice(0, 10)) {
    const { options, answer } = itemOptions(item, deck);
    expect(options[answer]).toBe(item.t === 'spot' ? item.kind === 'type' ? item.type : deck.body.tactics?.[item.topic] : item.opts[item.a]);
  }
});
