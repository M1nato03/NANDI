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
    'plan', 'plan/focus', 'plan/focus', 'plan/morning', 'yatra/train/workout', 'read',
    'yatra/mind/board/daily', 'yatra/mind/reviews', 'read/lesson', 'read/unit', 'you/backup',
  ]);
  // Spec 33: Learn became Read, Mind became Read's Games, and Train is parked under You.
  expect(['#learn', '#learn/drop', '#mind', '#mind/case', '#mind/generator', '#you/mind/generator'].map(canonicalRoute)).toEqual(['read', 'read/drop', 'yatra/mind', 'yatra/mind/case', 'you/mind/generator', 'you/mind/generator']);
  // Spec 34: Train and Read's Games moved to Yatra's corners.
  expect(['#train', '#train/history', '#read/games', '#read/games/board/daily', '#you/train', '#you/mind', '#learn/games'].map(canonicalRoute)).toEqual(['yatra/train', 'yatra/train/history', 'yatra/mind', 'yatra/mind/board/daily', 'yatra/train', 'yatra/mind', 'yatra/mind']);
  expect(parentRoute('yatra/mind/board/crowns/easy')).toBe('yatra/mind/practice');
  expect(parentRoute('yatra/mind')).toBe('yatra');
  expect(parentRoute('yatra/calm')).toBe('yatra');
  expect(parentRoute('yatra/train/history')).toBe('yatra/train');
  expect(parentRoute('read/chapter/psychology/psychology-ch1')).toBe('read/book/psychology');
  expect(parentRoute(canonicalRoute('train'))).toBe('yatra');
  expect(tabOf('you/mind/board')).toBe('Yatra');
  expect(tabOf('learn/unit')).toBe('Read');
  expect(tabOf('train/history')).toBe('Yatra');
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
  expect(location.hash).toBe('#yatra/train/history');
});
