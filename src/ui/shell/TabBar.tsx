import type { ReactNode } from 'react';
import { tabs, type Tab } from './tabs';
import { go } from './router';
import { DeckGlyph, type Glyph } from '../DeckGlyph';

const glyphs: Record<Tab, Glyph> = { Courtyard: 'courtyard', Yatra: 'trek', Grow: 'grow', You: 'you' };
/** Where a long label may break at large text (a <wbr>: no text of its own, so the link's name stays the plain word). */
const SHOWN: Partial<Record<Tab, ReactNode>> = { Courtyard: <>Court<wbr />yard</> };
const areas: Record<Tab, string> = { Courtyard: 'move', Yatra: 'do', Grow: 'learn', You: 'notice' };

export function TabBar({ current }: { current: Tab }) {
  return <nav className="tabbar" aria-label="Main tabs">{tabs.map(item => <a key={item} className={`deck-area-${areas[item]}`} href={`#${item.toLowerCase()}`} onClick={event => { event.preventDefault(); go(item.toLowerCase()); }} aria-current={item === current ? 'page' : undefined}><DeckGlyph type={glyphs[item]} /><span>{SHOWN[item] ?? item}</span></a>)}</nav>;
}
