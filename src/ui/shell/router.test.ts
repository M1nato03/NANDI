// @vitest-environment jsdom
import { beforeEach, expect, it } from 'vitest';
import { canonicalRoute, go, initializeHistory, lastTab, parentRoute, route, tabOf } from './router';

beforeEach(() => {
  sessionStorage.clear();
  history.replaceState(null, '', '/');
});

it('maps legacy links to their single feature homes', () => {
  expect([
    '#now', '#now/focus', '#today', '#tasks/plan', '#you/train/workout', '#you/learn',
    '#you/mind/board/daily', '#you/mind/reviews', '#you/mind/lesson', '#you/mind/unit', '#ground/backup',
  ].map(canonicalRoute)).toEqual([
    'plan', 'plan/focus', 'plan/focus', 'plan/morning', 'train/workout', 'read',
    'read/games/board/daily', 'read/games/reviews', 'read/lesson', 'read/unit', 'you/backup',
  ]);
  // Spec 33: Learn became Read, Mind became Read's Games, and Train is parked under You.
  expect(['#learn', '#learn/drop', '#mind', '#mind/case', '#mind/generator'].map(canonicalRoute)).toEqual(['read', 'read/drop', 'read/games', 'read/games/case', 'you/mind/generator']);
  expect(parentRoute('read/games/board/crowns/easy')).toBe('read/games/practice');
  expect(parentRoute('read/chapter/psychology/psychology-ch1')).toBe('read/book/psychology');
  expect(parentRoute('train')).toBe('you');
  expect(tabOf('you/mind/board')).toBe('Read');
  expect(tabOf('learn/unit')).toBe('Read');
  expect(tabOf('train/history')).toBe('You');
});

it('starts at Plan, redirects old links, and remembers a tab for one hour', () => {
  initializeHistory();
  expect(location.hash).toBe('#plan');
  go('learn');
  expect(route()).toBe('read');
  expect(lastTab(Date.now() + 59 * 60_000)).toBe('read');
  go('read/chapter/money-markets/money-markets-ch1');
  expect(route()).toBe('read/chapter/money-markets/money-markets-ch1');
  expect(lastTab(Date.now() + 61 * 60_000)).toBe('plan');
  history.replaceState(null, '', '#you/train/history');
  initializeHistory();
  expect(location.hash).toBe('#train/history');
});
