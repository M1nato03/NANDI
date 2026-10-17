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
    'plan', 'plan/focus', 'plan/focus', 'plan/morning', 'train/workout', 'learn',
    'mind/board/daily', 'mind/reviews', 'learn/lesson', 'learn/unit', 'you/backup',
  ]);
  expect(parentRoute('mind/board/crowns/easy')).toBe('mind/practice');
  expect(tabOf('you/mind/board')).toBe('Mind');
  expect(tabOf('learn/unit')).toBe('Learn');
});

it('starts at Plan, redirects old links, and remembers a tab for one hour', () => {
  initializeHistory();
  expect(location.hash).toBe('#plan');
  go('learn');
  expect(route()).toBe('learn');
  expect(lastTab(Date.now() + 59 * 60_000)).toBe('learn');
  expect(lastTab(Date.now() + 61 * 60_000)).toBe('plan');
  history.replaceState(null, '', '#you/train/history');
  initializeHistory();
  expect(location.hash).toBe('#train/history');
});
