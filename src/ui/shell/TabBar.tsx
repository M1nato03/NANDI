import { useEffect } from 'react';
import { tabs, type Tab } from './tabs';
import { go } from './router';
import { DeckGlyph, type Glyph } from '../DeckGlyph';

const glyphs: Record<Tab, Glyph> = { Courtyard: 'courtyard', Yatra: 'trek', Grow: 'grow', You: 'you' };
const areas: Record<Tab, string> = { Courtyard: 'move', Yatra: 'do', Grow: 'learn', You: 'notice' };

/**
 * The bar's and the top bar's real heights as CSS variables (--tabbar-h, --topbar-h), so what sits above the tab bar
 * (the Courtyard card) clears it at every text size (b2 9 Nov: at 200% the card's last line slid under the bar).
 */
function usePublishedChrome() {
  useEffect(() => {
    const root = document.documentElement;
    const measure = () => {
      const bar = document.querySelector('.tabbar'), top = document.querySelector('.topbar');
      if (bar) root.style.setProperty('--tabbar-h', `${bar.getBoundingClientRect().height}px`);
      if (top) root.style.setProperty('--topbar-h', `${top.getBoundingClientRect().height}px`);
    };
    measure();
    const watch = new ResizeObserver(measure);
    for (const node of document.querySelectorAll('.tabbar, .topbar')) watch.observe(node);
    return () => watch.disconnect();
  }, []);
}

export function TabBar({ current }: { current: Tab }) {
  usePublishedChrome();
  return <nav className="tabbar" aria-label="Main tabs">{tabs.map(item => <a key={item} className={`deck-area-${areas[item]}`} href={`#${item.toLowerCase()}`} onClick={event => { event.preventDefault(); go(item.toLowerCase()); }} aria-current={item === current ? 'page' : undefined}><DeckGlyph type={glyphs[item]} /><span>{item}</span></a>)}</nav>;
}
