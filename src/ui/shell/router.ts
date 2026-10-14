import { tabs, type Tab } from './tabs';

export function route(): string { return location.hash.replace(/^#\/?/, '').toLowerCase() || 'now'; }
export function tabOf(path: string): Tab {
  const root = path.split('/')[0];
  if (root === 'today') return 'Now';
  if (root === 'tasks') return 'Plan';
  if (root === 'train' || root === 'mind' || root === 'learn' || root === 'ground') return 'You';
  return tabs.find(tab => tab.toLowerCase() === root) ?? 'Now';
}
export function go(path: string): void { location.hash = `#${path}`; }
