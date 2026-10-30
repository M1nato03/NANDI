import { tabs, type Tab } from './tabs';

const navigationEvent = 'nandi:navigate';
type Entry = { nandi: true; from?: string; deckIndex?: number };
const entry = (): Entry | null => history.state?.nandi === true ? history.state as Entry : null;

export function canonicalRoute(path: string): string {
  const value = legacyRoute(path.replace(/^#\/?/, '').toLowerCase());
  // Spec 34: Train and Kapi's shelf (Mind, then Read's Games) live in Yatra's corners now.
  if (value === 'train' || value.startsWith('train/')) return `yatra/${value}`;
  if (value === 'read/games' || value.startsWith('read/games/')) return `yatra/mind${value.slice(10)}`;
  return value;
}

function legacyRoute(value: string): string {
  // Spec 37: the app opens on Yatra; old Now links still go to Plan.
  if (!value) return 'yatra';
  if (value === 'now') return 'plan';
  if (value === 'now/focus' || value === 'today') return 'plan/focus';
  if (value === 'tasks') return 'plan';
  if (value === 'tasks/plan') return 'plan/morning';
  if (value === 'tasks/shutdown') return 'plan/shutdown';
  if (value === 'tasks/review') return 'plan/review';
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
  if (path === 'night') return 'plan';
  if (path === 'yatra/mind/board/daily' || path === 'yatra/mind') return path === 'yatra/mind' ? 'yatra' : 'yatra/mind';
  if (path.startsWith('yatra/mind/board/')) return 'yatra/mind/practice';
  if (path.startsWith('yatra/mind/')) return 'yatra/mind';
  if (path.startsWith('yatra/train/')) return 'yatra/train';
  if (path.startsWith('yatra/')) return 'yatra';
  if (path.startsWith('read/chapter/')) return `read/book/${path.split('/')[2]}`;
  if (path.startsWith('read/check/')) return 'yatra';
  if (path.startsWith('you/story/')) return 'you/stories';
  if (path === 'you/backup' || path === 'you/night' || path === 'you/cast' || path === 'you/owner') return 'you/settings';
  const root = path.split('/')[0];
  return root && tabs.some(tab => tab.toLowerCase() === root) ? root : 'plan';
}
export function navigationEventName(): string { return navigationEvent; }
export function deckIndex(): number { return Math.max(0, Number(entry()?.deckIndex) || 0); }
export function initializeHistory(): void {
  // Spec 37: every open without a link lands on Yatra; a notification, widget or Night route still wins.
  const initial = location.hash ? route() : 'yatra';
  if (location.hash !== `#${initial}` || !entry()) history.replaceState({ nandi: true, deckIndex: initial === 'night' ? deckIndex() : 0 }, '', `#${initial}`);
}
export function tabOf(path: string): Tab {
  const root = canonicalRoute(path).split('/')[0];
  return tabs.find(tab => tab.toLowerCase() === root) ?? 'Plan';
}
export function go(path: string): void {
  // Book and chapter ids carry hyphens (read/chapter/money-markets/money-markets-ch1).
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(path)) throw new Error('Invalid route');
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
/** Where Back goes, named: a tab, or the Yatra corner a screen sits in (spec 34). */
export function backDestination(): string {
  const target = canonicalRoute(entry()?.from ?? parentRoute(route()));
  if (target === 'yatra/mind' || target.startsWith('yatra/mind/')) return "Kapi's shelf";
  if (target === 'yatra/train' || target.startsWith('yatra/train/')) return 'Train';
  return tabOf(target);
}
