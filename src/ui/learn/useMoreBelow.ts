import { useCallback, useRef, useState } from 'react';

/**
 * Spec 571 §0.20 (b2, 6 Nov): at large text the question's middle can hold more than the screen shows. This reports
 * whether there is more below the visible part of a scrolling node, so the screen can show a quiet cue (a fade and a
 * chevron, no words). Rechecked on scroll, on any size change of the node or its content, and when content changes.
 * b2 (6 Nov): the chevron is a real button. reveal(selector) scrolls the node so the first match sits at its top
 * (smooth, or at once when the phone or NANDI's own setting reduces motion) and moves focus there, since the cue goes away once nothing is below.
 * `page` (large text, b2 7 Nov): the page scrolls instead of the node; "more" is whatever sits under the pinned action row.
 */
export function useMoreBelow(page = false): [(node: HTMLElement | null) => void, boolean, (selector: string) => void] {
  const [more, setMore] = useState(false);
  const cleanup = useRef<(() => void) | null>(null);
  const current = useRef<HTMLElement | null>(null);
  const reveal = useCallback((selector: string) => {
    const node = current.current;
    const target = node?.querySelector<HTMLElement>(selector);
    if (!node || !target) return;
    // Either the phone's setting or NANDI's own Reduce motion (You › Settings › Appearance) makes the scroll instant.
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';
    if (page) {
      // Large text (b2, 7 Nov): the page scrolls, not the middle. The first answer comes to the top of the screen, with
      // as many of the next ones as fit between it and the pinned action row.
      window.scrollTo({ top: window.scrollY + target.getBoundingClientRect().top - 12, behavior: still ? 'auto' : 'smooth' });
    } else {
      const top = node.scrollTop + target.getBoundingClientRect().top - node.getBoundingClientRect().top;
      node.scrollTo({ top, behavior: still ? 'auto' : 'smooth' });
    }
    target.focus({ preventScroll: true });
  }, [page]);
  const ref = useCallback((node: HTMLElement | null) => {
    cleanup.current?.();
    cleanup.current = null;
    current.current = node;
    if (!node) { setMore(false); return; }
    let frame = 0;
    // In page mode "below" means under the pinned action row (or the screen's bottom when there is none).
    const check = page
      ? () => { const row = node.parentElement?.querySelector<HTMLElement>(':scope > .learn-check'); setMore(node.getBoundingClientRect().bottom - (row ? row.getBoundingClientRect().top : window.innerHeight) > 2); }
      : () => { setMore(node.scrollHeight - node.clientHeight - node.scrollTop > 2); };
    const later = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(check); };
    const sizes = new ResizeObserver(later);
    const watch = () => { sizes.observe(node); for (const child of node.children) sizes.observe(child); };
    watch();
    const mutations = new MutationObserver(() => { watch(); later(); });
    mutations.observe(node, { childList: true, subtree: true });
    const scroller: HTMLElement | Window = page ? window : node;
    scroller.addEventListener('scroll', later, { passive: true });
    if (page) window.addEventListener('resize', later);
    later();
    cleanup.current = () => {
      cancelAnimationFrame(frame);
      sizes.disconnect();
      mutations.disconnect();
      scroller.removeEventListener('scroll', later);
      if (page) window.removeEventListener('resize', later);
    };
  }, [page]);
  return [ref, more, reveal];
}
