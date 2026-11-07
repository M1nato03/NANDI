import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Large text (b2, 7 Nov). A question screen normally fits the phone: the stem and answers sit in a fitted middle and
 * Check is pinned under it (spec 571 §0.20, E12). When the question can't fit that middle (200% text, long stems), the
 * whole page scrolls instead: the stem and the answers scroll together and only the bottom action row stays pinned.
 *
 * 'fit'  – today's layout, pixel for pixel.
 * 'page' – the page scrolls; the action row is sticky.
 *
 * Decided once per item load, and again whenever the screen, the text size, a font or the question's own size changes,
 * but only while nothing has been picked: the layout never flips under someone's finger.
 */
export type QuestionMode = 'fit' | 'page';

/**
 * `fitted` is false when the screen is too short for a fitted layout (--fit-h is auto); the middle then keeps its
 * natural height and nothing changes. Otherwise the question needs the page when its middle holds more than it shows
 * (over 1 px, the same test the E12 e2e uses for "fits").
 */
export function chooseQuestionMode(measure: { fitted: boolean; middleClient: number; middleScroll: number }): QuestionMode {
  if (!measure.fitted) return 'fit';
  return measure.middleScroll - measure.middleClient > 1 ? 'page' : 'fit';
}

/** Measures the drop as if it were in fit mode (the page class comes off and back on within one task, so nothing paints). */
export function measureQuestionMode(drop: HTMLElement): QuestionMode | undefined {
  const middle = drop.querySelector<HTMLElement>(':scope > .learn-q');
  if (!middle) return undefined;
  const paged = drop.classList.contains('learn-page');
  if (paged) drop.classList.remove('learn-page');
  const fitH = drop.style.getPropertyValue('--fit-h');
  const mode = chooseQuestionMode({ fitted: !!fitH && fitH !== 'auto', middleClient: middle.clientHeight, middleScroll: middle.scrollHeight });
  if (paged) drop.classList.add('learn-page');
  return mode;
}

export function useQuestionMode(itemKey: string, locked: boolean): [(node: HTMLElement | null) => void, QuestionMode] {
  const [mode, setMode] = useState<QuestionMode>('fit');
  const node = useRef<HTMLElement | null>(null);
  const lockedRef = useRef(locked);
  useLayoutEffect(() => { lockedRef.current = locked; }, [locked]);
  const decide = useCallback(() => {
    const drop = node.current;
    if (!drop) return;
    const next = measureQuestionMode(drop);
    if (next) setMode(next);
  }, []);
  const ref = useCallback((next: HTMLElement | null) => { node.current = next; }, []);
  // A new item: decide before the first paint (setState in a layout effect re-renders before the browser paints).
  useLayoutEffect(() => { if (itemKey) decide(); }, [itemKey, decide]);
  useEffect(() => {
    if (!itemKey) return;
    let frame = 0;
    // Queued after useFitViewport's own frame (it subscribed first), so --fit-h is already the new screen's.
    const later = () => { if (lockedRef.current) return; cancelAnimationFrame(frame); frame = requestAnimationFrame(decide); };
    let width = window.innerWidth, height = window.visualViewport?.height ?? window.innerHeight;
    const resized = () => {
      const nextWidth = window.innerWidth, nextHeight = window.visualViewport?.height ?? window.innerHeight;
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth; height = nextHeight;
      later();
    };
    // The reader's text size: a hidden 1rem box changes size when the root font size does.
    const probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:fixed;left:0;top:0;width:1rem;height:1rem;visibility:hidden;pointer-events:none;z-index:-1';
    document.body.appendChild(probe);
    let rem = 0;
    const sizes = new ResizeObserver(() => { const next = probe.getBoundingClientRect().width; if (rem && next !== rem) later(); rem = next; });
    sizes.observe(probe);
    // The question's own size settles after the first paint (fonts, the friend's art, the fit height arriving): watch
    // the drop and everything in its middle, so the first decision is made again on the settled layout.
    const drop = node.current;
    const content = new ResizeObserver(later);
    if (drop) {
      content.observe(drop);
      for (const child of drop.querySelector(':scope > .learn-q')?.children ?? []) content.observe(child);
    }
    window.addEventListener('resize', resized);
    window.visualViewport?.addEventListener('resize', resized);
    document.fonts?.addEventListener('loadingdone', later);
    return () => {
      cancelAnimationFrame(frame);
      sizes.disconnect();
      content.disconnect();
      probe.remove();
      window.removeEventListener('resize', resized);
      window.visualViewport?.removeEventListener('resize', resized);
      document.fonts?.removeEventListener('loadingdone', later);
    };
  }, [itemKey, decide]);
  return [ref, mode];
}
