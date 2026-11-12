// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { canonicalRoute, go, initializeHistory, parentRoute, route, screenKey, tabOf, tabRule } from './router';

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

it('opens on the Courtyard every time (spec 571 stage 2, was Yatra by spec 37), keeps a linked route, and redirects old links', () => {
  initializeHistory();
  expect(location.hash).toBe('#courtyard');
  go('learn');
  expect(route()).toBe('grow/read');
  go('read/chapter/money-markets/money-markets-ch1');
  expect(route()).toBe('grow/read/chapter/money-markets/money-markets-ch1');
  // A fresh open with no link lands on the Courtyard again, not on the last tab.
  history.replaceState(null, '', '/');
  initializeHistory();
  expect(location.hash).toBe('#courtyard');
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
  it('a crew link screen sits under the Courtyard in the tab bar (spec 571 stage 2: the crew’s one home)', () => {
    expect(tabOf('crew/join/AbC')).toBe('Courtyard');
    expect(tabOf('yatra/crew')).toBe('Courtyard');
  });
});

describe('spec 571 stage 1: the alias table (G7)', () => {
  // Every old path keeps opening the same screen (its old key), now under its new home and tab.
  const table: [old: string, route: string, screen: string, tab: string][] = [
    ['#read', 'grow/read', 'read', 'Grow'],
    ['#learn', 'grow/read', 'read', 'Grow'],
    ['#read/book/psychology', 'grow/read/book/psychology', 'read/book/psychology', 'Grow'],
    ['#read/chapter/psychology/psychology-ch1', 'grow/read/chapter/psychology/psychology-ch1', 'read/chapter/psychology/psychology-ch1', 'Grow'],
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
    ['#yatra/days/seasons', 'you/history', 'you/history', 'You'],
    // Unchanged paths: the trek's journal, Night (widget + focus notice), kolam, settings.
    ['#yatra/journal', 'yatra/journal', 'yatra/journal', 'Yatra'],
    ['#night', 'night', 'night', 'Grow'],
    ['#kolam', 'kolam', 'kolam', 'Grow'],
    ['#ground', 'you/settings', 'you/settings', 'You'],
    ['#ground/backup', 'you/backup', 'you/backup', 'You'],
  ];
  it.each(table)('%s opens %s (screen %s) with %s lit', (old, next, screen, tab) => {
    expect(canonicalRoute(old)).toBe(next);
    expect(screenKey(next)).toBe(screen);
    expect(tabOf(next)).toBe(tab);
    // Guard: every row is lit by an explicit rule, never the silent fallback.
    expect(tabRule(next).rule).not.toBe('fallback');
  });
  it('names Back after the door a screen sits behind', () => {
    expect(parentRoute('grow/read/check/psychology/psychology-ch1')).toBe('grow/read/book/psychology');
    expect(parentRoute('grow/remember')).toBe('grow');
    expect(parentRoute('grow/remember/cards')).toBe('grow/remember');
    expect(parentRoute('grow/sleep')).toBe('grow');
    expect(parentRoute('kolam')).toBe('grow/sleep');
    expect(parentRoute('grow/read')).toBe('grow');
    expect(parentRoute('you/days')).toBe('you');
  });
});

describe('spec 571 stage 2: the alias table (tabs Courtyard · Yatra · Grow · You)', () => {
  // [old link, the route it opens, the screen it draws (its key), the lit tab]
  const table: [old: string, route: string, screen: string, tab: string][] = [
    ['', 'courtyard', 'you/courtyard', 'Courtyard'],
    ['#courtyard', 'courtyard', 'you/courtyard', 'Courtyard'],
    ['#you/courtyard', 'courtyard', 'you/courtyard', 'Courtyard'],
    ['#yatra', 'yatra', 'yatra', 'Yatra'],
    ['#plan', 'plan', 'plan', 'Yatra'],
    ['#now', 'plan', 'plan', 'Yatra'],
    ['#tasks', 'plan', 'plan', 'Yatra'],
    ['#today', 'plan/focus', 'plan/focus', 'Yatra'],
    ['#now/focus', 'plan/focus', 'plan/focus', 'Yatra'],
    ['#plan/focus', 'plan/focus', 'plan/focus', 'Yatra'],
    ['#plan/pause', 'plan/pause', 'plan/pause', 'Yatra'],
    ['#tasks/plan', 'plan/morning', 'plan/morning', 'Yatra'],
    ['#plan/morning', 'plan/morning', 'plan/morning', 'Yatra'],
    ['#tasks/shutdown', 'plan/shutdown', 'plan/shutdown', 'Yatra'],
    ['#tasks/review', 'you', 'you', 'You'],
    ['#plan/quest/q1', 'plan/quest/q1', 'plan/quest/q1', 'Yatra'],
    ['#yatra/journal', 'yatra/journal', 'yatra/journal', 'Yatra'],
    ['#yatra/crew', 'courtyard/crew', 'yatra/crew', 'Courtyard'],
    ['#yatra/crew/paste', 'courtyard/crew/paste', 'yatra/crew/paste', 'Courtyard'],
    ['#courtyard/crew', 'courtyard/crew', 'yatra/crew', 'Courtyard'],
    ['#crew/join/AbC-_9xY', 'crew/join/AbC-_9xY', 'crew/join/AbC-_9xY', 'Courtyard'],
    ['#crew/joined/AbC', 'crew/joined/AbC', 'crew/joined/AbC', 'Courtyard'],
    ['#crew/add/AbC', 'crew/add/AbC', 'crew/add/AbC', 'Courtyard'],
    // Row 85: the Book check is on its book (the stage 1 path keeps working).
    ['#read/check/psychology/psychology-ch1', 'grow/read/check/psychology/psychology-ch1', 'read/check/psychology/psychology-ch1', 'Grow'],
    ['#grow/read/check/psychology/psychology-ch1', 'grow/read/check/psychology/psychology-ch1', 'read/check/psychology/psychology-ch1', 'Grow'],
    // Rows 89-90: Today's idea opens the drop's one home.
    ['#learn/drop', 'grow/read/drop', 'read/drop', 'Grow'],
    ['#read/drop', 'grow/read/drop', 'read/drop', 'Grow'],
    ['#night', 'night', 'night', 'Grow'],
    ['#you/mind/generator', 'you/mind/generator', 'you/mind/generator', 'You'],
  ];
  it.each(table)('"%s" opens %s (screen %s) with %s lit', (old, next, screen, tab) => {
    expect(canonicalRoute(old)).toBe(next);
    expect(screenKey(next)).toBe(screen);
    expect(tabOf(next)).toBe(tab);
    // Guard: every row is lit by an explicit rule, never the silent fallback.
    expect(tabRule(next).rule).not.toBe('fallback');
  });
  it('Back: the crew goes to the Courtyard, a Book check to its book, Plan screens to Mor’s plan', () => {
    expect(parentRoute('courtyard/crew')).toBe('courtyard');
    expect(parentRoute('courtyard/crew/paste')).toBe('courtyard');
    expect(parentRoute('grow/read/check/richest-man-in-babylon/babylon-ch2')).toBe('grow/read/book/richest-man-in-babylon');
    expect(parentRoute('plan/focus')).toBe('plan');
    expect(parentRoute('yatra/journal')).toBe('yatra');
  });
  it('G-E11: Night is Kachhua’s, so its one home is Grow › Calm & Sleep (lit tab and Back)', () => {
    expect(tabRule('night')).toEqual({ tab: 'Grow', rule: 'night' });
    expect(tabRule('#night')).toEqual({ tab: 'Grow', rule: 'night' });
    expect(parentRoute('night')).toBe('grow/sleep');
  });
  it('the fallback is reachable only by a route no rule names', () => {
    expect(tabRule('nowhere/at/all').rule).toBe('fallback');
  });
  it('go() lands old crew and courtyard links on their Courtyard paths', () => {
    go('yatra/crew');
    expect(route()).toBe('courtyard/crew');
    go('you/courtyard');
    expect(route()).toBe('courtyard');
  });
});

describe('spec 40: the book game route', () => {
  it('read/game/… is its own route, never caught by the read/games → Play redirect; Back goes to the book', () => {
    expect(canonicalRoute('#read/game/richest-man-in-babylon')).toBe('grow/read/game/richest-man-in-babylon');
    expect(canonicalRoute('#grow/read/game/richest-man-in-babylon/mar')).toBe('grow/read/game/richest-man-in-babylon/mar');
    expect(canonicalRoute('#read/games')).not.toContain('read/game/');
    expect(screenKey('grow/read/game/richest-man-in-babylon')).toBe('read/game/richest-man-in-babylon');
    expect(parentRoute('grow/read/game/richest-man-in-babylon')).toBe('grow/read/book/richest-man-in-babylon');
    expect(tabOf('grow/read/game/richest-man-in-babylon')).toBe(tabOf('grow/read'));
  });
});

it('spec 660 §3: the removed screens\' links open their one new home (alias table guard)', () => {
  expect([
    '#you/shop', '#you/shop/theme', '#you/badges', '#you/season', '#you/days/seasons', '#yatra/days/seasons', '#plan/review', '#tasks/review',
  ].map(canonicalRoute)).toEqual([
    'you/history', 'you/history', 'you/history', 'you', 'you/history', 'you/history', 'you', 'you',
  ]);
});
