import { tabs, type Tab } from './tabs';
import { go } from './router';
import { DeckGlyph, type Glyph } from '../DeckGlyph';

const glyphs: Record<Tab, Glyph> = { Plan: 'do', Train: 'move', Learn: 'learn', Mind: 'think', You: 'notice' };
const areas: Record<Tab, string> = { Plan: 'do', Train: 'move', Learn: 'learn', Mind: 'think', You: 'notice' };

export function TabBar({ current }: { current: Tab }) {
  return <nav className="tabbar" aria-label="Main tabs">{tabs.map(item => <a key={item} className={`deck-area-${areas[item]}`} href={`#${item.toLowerCase()}`} onClick={event => { event.preventDefault(); go(item.toLowerCase()); }} aria-current={item === current ? 'page' : undefined}><DeckGlyph type={glyphs[item]} /><span>{item}</span></a>)}</nav>;
}
