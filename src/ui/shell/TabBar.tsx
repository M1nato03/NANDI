import { tabs, type Tab } from './tabs';
import { go } from './router';

export function TabBar({ current }: { current: Tab }) {
  return <nav className="tabbar" aria-label="Main tabs">{tabs.map(item => <a key={item} href={`#${item.toLowerCase()}`} onClick={event => { event.preventDefault(); go(item.toLowerCase()); }} aria-current={item === current ? 'page' : undefined}>{item}</a>)}</nav>;
}
