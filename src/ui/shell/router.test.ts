// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { canonicalRoute, go, initializeHistory, parentRoute, route, screenKey, tabOf } from './router';

beforeEach(() => {
  sessionStorage.clear();
  history.replaceState(null, '', '/');
});

it('maps legacy links to their single feature homes', () => {
  expect([
    '#now', '#now/focus', '#today', '#tasks/plan', '#you/train/workout', '#you/learn',
    '#you/mind/board/daily', '#you/mind/reviews', '#you/mind/lesson', '#you/mind/unit', '#ground/backup',
  ].map(canonicalRoute)).toEqual([
    'plan', 'plan/focus', 'plan/focus', 'plan/morning', 'grow/train/workout', 'grow/read',
    'grow/play/board/daily', 'grow/remember/cards', 'grow/read/lesson', 'grow/read/unit', 'you/backup',
  ]);
  // Spec 33: Learn became Read, Mind became Read's Games, and Train is parked under You.
  expect(['#learn', '#learn/drop', '#mind', '#mind/case', '#mind/generator', '#you/mind/generator'].map(canonicalRoute)).toEqual(['grow/read', 'grow/read/drop', 'grow/play', 'grow/play/case', 'you/mind/generator', 'you/mind/generator']);
  // Spec 34: Train and Read's Games moved to Yatra's corners.
  // Spec 571 stage 1: Train, Play (Kapi's shelf), Read and Calm live behind Grow's doors; card reviews behind Remember.
  expect(['#train', '#train/history', '#read/games', '#read/games/board/daily', '#you/train', '#you/mind', '#learn/games'].map(canonicalRoute)).toEqual(['grow/train', 'grow/train/history', 'grow/play', 'grow/play/board/daily', 'grow/train', 'grow/play', 'grow/play']);
  expect(parentRoute('grow/play/board/crowns/easy')).toBe('grow/play/practice');
  expect(parentRoute('grow/play')).toBe('grow');
  expect(parentRoute('grow/calm')).toBe('grow/sleep');
  expect(parentRoute('grow/train/history')).toBe('grow/train');
  expect(parentRoute('grow/read/chapter/psychology/psychology-ch1')).toBe('grow/read/book/psychology');
  expect(parentRoute(canonicalRoute('train'))).toBe('grow');
  expect(tabOf('you/mind/board')).toBe('Grow');
  expect(tabOf('learn/unit')).toBe('Grow');
  expect(tabOf('train/history')).toBe('Grow');
});

it('opens on Yatra every time (spec 37), keeps a linked route, and redirects old links', () => {
  initializeHistory();
  expect(location.hash).toBe('#yatra');
  go('learn');
  expect(route()).toBe('grow/read');
  go('read/chapter/money-markets/money-markets-ch1');
  expect(route()).toBe('grow/read/chapter/money-markets/money-markets-ch1');
  // A fresh open with no link lands on Yatra again, not on the last tab.
  history.replaceState(null, '', '/');
  initializeHistory();
  expect(location.hash).toBe('#yatra');
  // A notification or the widget opens a link, and the link wins.
  history.replaceState(null, '', '#plan');
  initializeHistory();
  expect(location.hash).toBe('#plan');
  history.replaceState(null, '', '#now');
  initializeHistory();
  expect(location.hash).toBe('#plan');
  history.replaceState(null, '', '#you/train/history');
  initializeHistory();
  expect(location.hash).toBe('#grow/train/history');
});

describe('spec 55: crew link routes', () => {
  it('keep the case of the payload (base64url), normalising only the prefix', () => {
    expect(canonicalRoute('#crew/join/AbC-_9xY')).toBe('crew/join/AbC-_9xY');
    expect(canonicalRoute('#CREW/Add/AbC')).toBe('crew/add/AbC');
    expect(canonicalRoute('#Plan')).toBe('plan');
  });
  it('go() accepts a crew link and still refuses anything else with capitals', () => {
    expect(() => go('crew/add/AbC-_9')).not.toThrow();
    expect(location.hash).toBe('#crew/add/AbC-_9');
    expect(() => go('Plan/Evil')).toThrow('Invalid route');
  });
  it('a crew link screen sits under Yatra in the tab bar', () => {
    expect(tabOf('crew/join/AbC')).toBe('Yatra');
    expect(tabOf('yatra/crew')).toBe('Yatra');
  });
});

describe('spec 571 stage 1: the alias table (G7)', () => {
  // Every old path keeps opening the same screen (its old key), now under its new home and tab.
  const table: [old: string, route: string, screen: string, tab: string][] = [
    ['#read', 'grow/read', 'read', 'Grow'],
    ['#learn', 'grow/read', 'read', 'Grow'],
    ['#read/book/psychology', 'grow/read/book/psychology', 'read/book/psychology', 'Grow'],
    ['#read/chapter/psychology/psychology-ch1', 'grow/read/chapter/psychology/psychology-ch1', 'read/chapter/psychology/psychology-ch1', 'Grow'],
    ['#read/check/psychology/psychology-ch1', 'grow/read/check/psychology/psychology-ch1', 'read/check/psychology/psychology-ch1', 'Grow'],
    ['#read/courses', 'grow/read/courses', 'read/courses', 'Grow'],
    ['#yatra/train', 'grow/train', 'yatra/train', 'Grow'],
    ['#train/easy', 'grow/train/easy', 'yatra/train/easy', 'Grow'],
    ['#you/train/history', 'grow/train/history', 'yatra/train/history', 'Grow'],
    ['#yatra/mind', 'grow/play', 'yatra/mind', 'Grow'],
    ['#mind/case', 'grow/play/case', 'yatra/mind/case', 'Grow'],
    ['#read/games/board/daily', 'grow/play/board/daily', 'yatra/mind/board/daily', 'Grow'],
    ['#mind/challenge/20261105/crowns/medium/797416356', 'grow/play/challenge/20261105/crowns/medium/797416356', 'yatra/mind/challenge/20261105/crowns/medium/797416356', 'Grow'],
    ['#mind/reviews', 'grow/remember/cards', 'yatra/mind/reviews', 'Grow'],
    ['#yatra/calm', 'grow/calm', 'yatra/calm', 'Grow'],
    ['#yatra/days', 'you/days', 'yatra/days', 'You'],
    ['#yatra/days/seasons', 'you/days/seasons', 'yatra/days/seasons', 'You'],
    // Unchanged in stage 1: Yatra's home, its journal and crew, Plan, Night (widget + focus notice), kolam, settings.
    ['#yatra', 'yatra', 'yatra', 'Yatra'],
    ['#yatra/journal', 'yatra/journal', 'yatra/journal', 'Yatra'],
    ['#yatra/crew', 'yatra/crew', 'yatra/crew', 'Yatra'],
    ['#crew/join/AbC-_9xY', 'crew/join/AbC-_9xY', 'crew/join/AbC-_9xY', 'Yatra'],
    ['#plan', 'plan', 'plan', 'Plan'],
    ['#now', 'plan', 'plan', 'Plan'],
    ['#night', 'night', 'night', 'Plan'],
    ['#kolam', 'kolam', 'kolam', 'Grow'],
    ['#ground', 'you/settings', 'you/settings', 'You'],
    ['#ground/backup', 'you/backup', 'you/backup', 'You'],
  ];
  it.each(table)('%s opens %s (screen %s) with %s lit', (old, next, screen, tab) => {
    expect(canonicalRoute(old)).toBe(next);
    expect(screenKey(next)).toBe(screen);
    expect(tabOf(next)).toBe(tab);
  });
  it('names Back after the door a screen sits behind', () => {
    expect(parentRoute('grow/remember')).toBe('grow');
    expect(parentRoute('grow/remember/cards')).toBe('grow/remember');
    expect(parentRoute('grow/sleep')).toBe('grow');
    expect(parentRoute('kolam')).toBe('grow/sleep');
    expect(parentRoute('grow/read')).toBe('grow');
    expect(parentRoute('you/days')).toBe('you');
  });
});
