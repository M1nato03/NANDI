import { tabs, type Tab } from './tabs';

const navigationEvent = 'nandi:navigate';
type Entry = { nandi: true; from?: string; deckIndex?: number };
const entry = (): Entry | null => history.state?.nandi === true ? history.state as Entry : null;

export function canonicalRoute(path: string): string {
  // Spec 55: a crew link's payload is case-sensitive base64url, so only its prefix is normalised.
  const raw = path.replace(/^#\/?/, '');
  if (/^crew\/(join|joined|add)\//i.test(raw)) return `crew/${raw.slice(5, raw.indexOf('/', 5)).toLowerCase()}${raw.slice(raw.indexOf('/', 5))}`;
  const value = legacyRoute(raw.toLowerCase());
  // Spec 34: Train and Kapi's shelf (Mind, then Read's Games) live in Yatra's corners now.
  if (value === 'train' || value.startsWith('train/')) return toGrow(`yatra/${value}`);
  if (value === 'read/games' || value.startsWith('read/games/')) return toGrow(`yatra/mind${value.slice(10)}`);
  return toGrow(value);
}

/**
 * Spec 571 stage 1: Read, Kapi's shelf (Play), Train and Calm live behind Grow's doors, and the useful-days record under
 * You. Old routes (shared links, widgets, notifications, backups) resolve here to their new homes.
 */
// Card reviews (Moti's) moved from Kapi's shelf to Remember, so they come first: the first match wins.
// Spec 571 stage 2: the crew lives on the Courtyard (its one home, E11 row 1), and so does the old You › Courtyard; the crew
// comes first so its new path is not read back as the old courtyard screen.
const MOVES: readonly [string, string][] = [
  ['yatra/crew', 'courtyard/crew'], ['you/courtyard', 'courtyard'],
  ['yatra/mind/reviews', 'grow/remember/cards'], ['yatra/mind/deck', 'grow/remember/deck'],
  ['read', 'grow/read'], ['yatra/train', 'grow/train'], ['yatra/mind', 'grow/play'], ['yatra/calm', 'grow/calm'], ['yatra/days', 'you/days'],
];
const moved = (value: string, from: string, to: string) => value === from || value.startsWith(`${from}/`) ? `${to}${value.slice(from.length)}` : null;
export function toGrow(value: string): string {
  for (const [from, to] of MOVES) { const next = moved(value, from, to); if (next) return next; }
  return value;
}
/** The screen a new route draws: the same screens as before the move, looked up by their old keys. */
export function screenKey(path: string): string {
  for (const [from, to] of MOVES) { const next = moved(path, to, from); if (next) return next; }
  return path;
}

function legacyRoute(value: string): string {
  // Spec 571 stage 2: the app opens on the Courtyard (spec 37's Yatra home moved there); old Now links still go to Plan.
  if (!value) return 'courtyard';
  if (value === 'now') return 'plan';
  if (value === 'now/focus' || value === 'today') return 'plan/focus';
  if (value === 'tasks') return 'plan';
  if (value === 'tasks/plan') return 'plan/morning';
  if (value === 'tasks/shutdown') return 'plan/shutdown';
  if (value === 'tasks/review') return 'plan/review';
  // Spec 660 §3.1: the shop closed; its old links open You › history ("Shards kept").
  if (value === 'you/shop' || value.startsWith('you/shop/')) return 'you/history';
  // Spec 660 §3.1b: badges ended; the ones earned are listed in You › history.
  if (value === 'you/badges' || value.startsWith('you/badges/')) return 'you/history';
  // Spec 660 §3.2: the season ladder went; its links open You (the level card).
  if (value === 'you/season' || value.startsWith('you/season/')) return 'you';
  // Past seasons have one home, You › history (no rank, tier or Shards there).
  if (value === 'you/days/seasons' || value === 'yatra/days/seasons') return 'you/history';
  if (value.startsWith('tasks/')) return `plan/${value.slice(6)}`;
  if (value === 'ground' || value === 'you/settings') return 'you/settings';
  if (value.startsWith('ground/')) return `you/${value.slice(7)}`;
  if (value === 'you/train' || value.startsWith('you/train/')) return `train${value.slice(9)}`;
  if (value === 'you/learn' || value.startsWith('you/learn/')) return `read${value.slice(9)}`;
  if (value === 'you/mind/lesson' || value === 'you/mind/unit') return `read/${value.slice(9)}`;
  if (value === 'you/mind/generator') return value; // the owner's generator check stays under You
  if (value === 'you/mind' || value.startsWith('you/mind/')) return `read/games${value.slice(8)}`;
  // Spec 33: Learn became Read and Mind became Read's Games; old links, notifications and backups still resolve.
  if (value === 'learn' || value.startsWith('learn/')) return `read${value.slice(5)}`;
  if (value === 'mind/generator') return 'you/mind/generator';
  if (value === 'mind' || value.startsWith('mind/')) return `read/games${value.slice(4)}`;
  return value;
}

export function route(): string { return canonicalRoute(location.hash); }
export function parentRoute(path: string): string {
  if (path === 'grow/remember' || path === 'grow/sleep') return 'grow';
  if (path.startsWith('grow/remember/')) return 'grow/remember';
  // Calm and tonight's kolam sit behind the Calm & Sleep door.
  if (path === 'grow/calm' || path === 'kolam' || path === 'night') return 'grow/sleep';
  // Spec 571 stage 2: the crew screens go back to the Courtyard.
  if (path.startsWith('courtyard/')) return 'courtyard';
  const legacy = screenKey(path);
  let parent = toGrow(oldParent(legacy));
  // A moved screen's top goes back to its new tab.
  if (parent === 'yatra' && legacy !== path) parent = path.startsWith('you/days') ? 'you' : 'grow';
  return parent === path ? (path.startsWith('grow/') ? 'grow' : path.split('/')[0]!) : parent;
}
function oldParent(path: string): string {
  if (path === 'night') return 'plan';
  if (path === 'yatra/mind/board/daily' || path === 'yatra/mind') return path === 'yatra/mind' ? 'yatra' : 'yatra/mind';
  if (path.startsWith('yatra/mind/board/')) return 'yatra/mind/practice';
  if (path.startsWith('yatra/mind/')) return 'yatra/mind';
  if (path.startsWith('yatra/train/')) return 'yatra/train';
  if (path === 'yatra/days/seasons') return 'yatra/days';
  if (path.startsWith('yatra/')) return 'yatra';
  if (path.startsWith('read/chapter/')) return `read/book/${path.split('/')[2]}`;
  // Spec 571 stage 2 (row 85): a Book check lives on its book, so Back lands on the book.
  if (path.startsWith('read/check/')) return `read/book/${path.split('/')[2]}`;
  // Spec 40: the book game's Back goes to its book.
  if (path.startsWith('read/game/')) return `read/book/${path.split('/')[2]}`;
  if (path.startsWith('you/story/')) return 'you/stories';
  if (path === 'you/backup' || path === 'you/night' || path === 'you/cast' || path === 'you/owner') return 'you/settings';
  const root = path.split('/')[0];
  return root && (tabs.some(tab => tab.toLowerCase() === root) || root === 'read') ? root : 'plan';
}
export function navigationEventName(): string { return navigationEvent; }
export function deckIndex(): number { return Math.max(0, Number(entry()?.deckIndex) || 0); }
export function initializeHistory(): void {
  // Spec 571 stage 2: every open without a link lands on the Courtyard; a notification, widget or Night route still wins.
  const initial = location.hash ? route() : 'courtyard';
  if (location.hash !== `#${initial}` || !entry()) history.replaceState({ nandi: true, deckIndex: initial === 'night' ? deckIndex() : 0 }, '', `#${initial}`);
}
/**
 * The lit tab for a route and the rule that chose it. Every known route has an explicit rule; `fallback` is only for a
 * route no rule names, and a test fails if any route in the alias tables reaches it (so a new route can't land silently).
 */
export function tabRule(path: string): { tab: Tab; rule: 'crew' | 'kolam' | 'night' | 'plan' | 'tab' | 'fallback' } {
  const root = canonicalRoute(path).split('/')[0];
  // Spec 55 + 571 stage 2: a crew link belongs to the Courtyard, where the crew lives.
  if (root === 'crew') return { tab: 'Courtyard', rule: 'crew' };
  // Spec 571: tonight's kolam is Kachhua's, behind Grow's Calm & Sleep door.
  if (root === 'kolam') return { tab: 'Grow', rule: 'kolam' };
  // Spec 571 stage 2 (b2 addition ii): Night is Kachhua's too; its one home is Grow › Calm & Sleep (Plan only links to it).
  if (root === 'night') return { tab: 'Grow', rule: 'night' };
  // Spec 571 stage 2: Mor's plan (every plan/* screen) sits under the trek in the Yatra tab.
  if (root === 'plan') return { tab: 'Yatra', rule: 'plan' };
  const tab = tabs.find(item => item.toLowerCase() === root);
  return tab ? { tab, rule: 'tab' } : { tab: 'Yatra', rule: 'fallback' };
}
export function tabOf(path: string): Tab { return tabRule(path).tab; }
export function go(path: string): void {
  // Book and chapter ids carry hyphens (read/chapter/money-markets/money-markets-ch1).
  // Spec 55: a crew link carries a base64url payload (letters of both cases, digits, - and _); the crew link validator
  // checks it on its screen.
  const crewLink = /^crew\/(join|joined|add)\/[A-Za-z0-9_-]{1,1500}$/.test(path);
  if (!crewLink && !/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(path)) throw new Error('Invalid route');
  const destination = canonicalRoute(path);
  if (route() === destination) return;
  const from = route();
  history.pushState({ nandi: true, from, ...(destination === 'night' ? { deckIndex: 0 } : {}) }, '', `#${destination}`);
  window.dispatchEvent(new Event(navigationEvent));
}
export function goToCard(index: number): void {
  if (route() !== 'night' || index === deckIndex()) return;
  history.pushState({ nandi: true, from: 'night', deckIndex: index }, '', '#night');
  window.dispatchEvent(new Event(navigationEvent));
}
export function back(fallback = parentRoute(route())): void {
  if (entry()?.from) history.back();
  else go(fallback);
}
/** Where Back goes, named: a tab, or the Yatra corner a screen sits in (spec 34), by its heading (spec 45c: Play, Train). */
export function backDestination(): string {
  const target = canonicalRoute(entry()?.from ?? parentRoute(route()));
  // Spec 571: a Grow door is named by its own heading.
  if (target === 'grow/play' || target.startsWith('grow/play/')) return 'Play';
  if (target === 'grow/train' || target.startsWith('grow/train/')) return 'Train';
  if (target.startsWith('grow/remember')) return 'Remember';
  if (target === 'grow/read' || target.startsWith('grow/read/')) return 'Read';
  if (target === 'grow/sleep') return 'Calm & Sleep';
  return tabOf(target);
}
