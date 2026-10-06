import { tabs, type Tab } from './tabs';

export function TabBar({ current }: { current: Tab }) {
  return <nav className="tabbar" aria-label="Main tabs">{tabs.map((item, index) => <a key={item} href={`#${item.toLowerCase()}`} aria-current={item === current ? 'page' : undefined}><span aria-hidden="true" className="tab-symbol">{['◉', '▤', '△', '◇', '#'][index]}</span><span>{item}</span></a>)}</nav>;
}
