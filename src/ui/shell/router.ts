import { tabs, type Tab } from './tabs';

export function route(): string { return location.hash.replace(/^#\/?/, '').toLowerCase() || 'today'; }
export function tabOf(path: string): Tab { return tabs.find(tab => tab.toLowerCase() === path.split('/')[0]) ?? 'Today'; }
export function go(path: string): void { location.hash = `#${path}`; }
