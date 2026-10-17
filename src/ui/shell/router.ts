import { tabs, type Tab } from './tabs';

const navigationEvent = 'nandi:navigate';
type Entry = { nandi: true; from?: string; deckIndex?: number };
const entry = (): Entry | null => history.state?.nandi === true ? history.state as Entry : null;

export function route(): string { return location.hash.replace(/^#\/?/, '').toLowerCase() || 'now'; }
function parentRoute(path: string): string {
  if (path === 'you/mind/board/daily') return 'you/mind';
  if (path.startsWith('you/mind/board/')) return 'you/mind/practice';
  if (path.startsWith('you/mind/')) return 'you/mind';
  if (path === 'you/mind' || path === 'you/train' || path === 'you/learn' || path === 'you/settings') return 'you';
  if (path === 'you/backup' || path === 'you/night') return 'you/settings';
  if (path.startsWith('you/train/')) return 'you/train';
  if (path.startsWith('plan/')) return 'plan';
  return 'now';
}
export function navigationEventName(): string { return navigationEvent; }
export function deckIndex(): number { return Math.max(0, Number(entry()?.deckIndex) || 0); }
export function initializeHistory(): void {
  if (entry()) return;
  const initial = route();
  history.replaceState({ nandi: true, deckIndex: 0 }, '', '#now');
  const destinations: string[] = [];
  for (let path = initial; path !== 'now'; path = parentRoute(path)) destinations.unshift(path);
  let from = 'now';
  for (const path of destinations) {
    history.pushState({ nandi: true, from }, '', `#${path}`);
    from = path;
  }
}
export function tabOf(path: string): Tab {
  const root = path.split('/')[0];
  if (root === 'today') return 'Now';
  if (root === 'tasks') return 'Plan';
  if (root === 'train' || root === 'mind' || root === 'ground') return 'You';
  return tabs.find(tab => tab.toLowerCase() === root) ?? 'Now';
}
export function go(path: string): void {
  if (!/^[a-z0-9]+(?:\/[a-z0-9]+)*$/.test(path)) throw new Error('Invalid route');
  if (route() === path) return;
  let from = route();
  if ((path === 'plan' || path === 'you') && from !== 'now') {
    history.replaceState({ nandi: true, deckIndex: 0 }, '', '#now');
    from = 'now';
  }
  history.pushState({ nandi: true, from, ...(path === 'now' ? { deckIndex: deckIndex() } : {}) }, '', `#${path}`);
  window.dispatchEvent(new Event(navigationEvent));
}
export function goToCard(index: number): void {
  if (route() !== 'now' || index === deckIndex()) return;
  history.pushState({ nandi: true, from: 'now', deckIndex: index }, '', '#now');
  window.dispatchEvent(new Event(navigationEvent));
}
export function back(fallback = parentRoute(route())): void {
  if (entry()?.from) history.back();
  else go(fallback);
}
export function backDestination(): string {
  const from = entry()?.from ?? parentRoute(route());
  if (from.startsWith('you/mind')) return 'Mind';
  if (from.startsWith('you/train')) return 'Train';
  return tabOf(from);
}
