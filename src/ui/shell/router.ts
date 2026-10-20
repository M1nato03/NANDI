import { tabs, type Tab } from './tabs';

const navigationEvent = 'nandi:navigate';
const lastTabKey = 'nandi.lastTab';
type Entry = { nandi: true; from?: string; deckIndex?: number };
const entry = (): Entry | null => history.state?.nandi === true ? history.state as Entry : null;

export function canonicalRoute(path: string): string {
  const value = path.replace(/^#\/?/, '').toLowerCase();
  if (!value || value === 'now') return 'plan';
  if (value === 'now/focus' || value === 'today') return 'plan/focus';
  if (value === 'tasks') return 'plan';
  if (value === 'tasks/plan') return 'plan/morning';
  if (value === 'tasks/shutdown') return 'plan/shutdown';
  if (value === 'tasks/review') return 'plan/review';
  if (value.startsWith('tasks/')) return `plan/${value.slice(6)}`;
  if (value === 'ground' || value === 'you/settings') return 'you/settings';
  if (value.startsWith('ground/')) return `you/${value.slice(7)}`;
  if (value === 'you/train' || value.startsWith('you/train/')) return `train${value.slice(9)}`;
  if (value === 'you/learn' || value.startsWith('you/learn/')) return `learn${value.slice(9)}`;
  if (value === 'you/mind/lesson' || value === 'you/mind/unit') return `learn/${value.slice(9)}`;
  if (value === 'you/mind' || value.startsWith('you/mind/')) return `mind${value.slice(8)}`;
  return value;
}

export function route(): string { return canonicalRoute(location.hash); }
export function parentRoute(path: string): string {
  if (path === 'night') return 'plan';
  if (path === 'mind/board/daily') return 'mind';
  if (path.startsWith('mind/board/')) return 'mind/practice';
  if (path === 'you/backup' || path === 'you/night' || path === 'you/cast') return 'you/settings';
  const root = path.split('/')[0];
  return root && tabs.some(tab => tab.toLowerCase() === root) ? root : 'plan';
}
export function navigationEventName(): string { return navigationEvent; }
export function deckIndex(): number { return Math.max(0, Number(entry()?.deckIndex) || 0); }
export function lastTab(now = Date.now()): string {
  try {
    const saved = JSON.parse(sessionStorage.getItem(lastTabKey) || 'null') as { path?: string; at?: number } | null;
    return saved && typeof saved.at === 'number' && now - saved.at < 3_600_000 && tabs.some(tab => tab.toLowerCase() === saved.path) ? saved.path! : 'plan';
  } catch { return 'plan'; }
}
function rememberTab(path: string): void {
  if (tabs.some(tab => tab.toLowerCase() === path)) sessionStorage.setItem(lastTabKey, JSON.stringify({ path, at: Date.now() }));
}
export function initializeHistory(): void {
  const initial = location.hash ? route() : lastTab();
  if (location.hash !== `#${initial}` || !entry()) history.replaceState({ nandi: true, deckIndex: initial === 'night' ? deckIndex() : 0 }, '', `#${initial}`);
  rememberTab(initial);
}
export function tabOf(path: string): Tab {
  const root = canonicalRoute(path).split('/')[0];
  return tabs.find(tab => tab.toLowerCase() === root) ?? 'Plan';
}
export function go(path: string): void {
  if (!/^[a-z0-9]+(?:\/[a-z0-9]+)*$/.test(path)) throw new Error('Invalid route');
  const destination = canonicalRoute(path);
  if (route() === destination) return;
  const from = route();
  history.pushState({ nandi: true, from, ...(destination === 'night' ? { deckIndex: 0 } : {}) }, '', `#${destination}`);
  rememberTab(destination);
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
export function backDestination(): string { return tabOf(entry()?.from ?? parentRoute(route())); }
