import { expect, it } from 'vitest';
import { weeklyContentSample } from './contentReview';
import { fixtureTopic } from './engine/fixtures/topic';

it('samples at most five items per module, stable within an ISO week', () => {
  const packs = [fixtureTopic];
  const monday = new Date(2026, 9, 19, 12).getTime();
  const tuesday = new Date(2026, 9, 20, 12).getTime();
  const first = weeklyContentSample(packs, monday);
  expect(first).toHaveLength(5);
  expect(weeklyContentSample(packs, tuesday).map(row => row.item.id)).toEqual(first.map(row => row.item.id));
  expect(first.every(row => row.sources.length > 0)).toBe(true);
});
