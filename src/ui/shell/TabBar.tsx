import { tabs, type Tab } from './tabs';

export function TabBar({ current }: { current: Tab }) {
  return <nav className="tabbar" aria-label="Main tabs">{tabs.map(item => <a key={item} href={`#${item.toLowerCase()}`} aria-current={item === current ? 'page' : undefined}>{item}</a>)}</nav>;
}
