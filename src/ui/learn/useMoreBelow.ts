import { useCallback, useRef, useState } from 'react';

/**
 * Spec 571 §0.20 (b2, 6 Nov): at large text the question's middle can hold more than the screen shows. This reports
 * whether there is more below the visible part of a scrolling node, so the screen can show a quiet cue (a fade and a
 * chevron, no words). Rechecked on scroll, on any size change of the node or its content, and when content changes.
 * b2 (6 Nov): the chevron is a real button. reveal(selector) scrolls the node so the first match sits at its top
 * (smooth, or at once under reduced motion) and moves focus there, since the cue goes away once nothing is below.
 */
export function useMoreBelow(): [(node: HTMLElement | null) => void, boolean, (selector: string) => void] {
  const [more, setMore] = useState(false);
  const cleanup = useRef<(() => void) | null>(null);
  const current = useRef<HTMLElement | null>(null);
  const reveal = useCallback((selector: string) => {
    const node = current.current;
    const target = node?.querySelector<HTMLElement>(selector);
    if (!node || !target) return;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const top = node.scrollTop + target.getBoundingClientRect().top - node.getBoundingClientRect().top;
    node.scrollTo({ top, behavior: still ? 'auto' : 'smooth' });
    target.focus({ preventScroll: true });
  }, []);
  const ref = useCallback((node: HTMLElement | null) => {
    cleanup.current?.();
    cleanup.current = null;
    current.current = node;
    if (!node) { setMore(false); return; }
    let frame = 0;
    const check = () => { setMore(node.scrollHeight - node.clientHeight - node.scrollTop > 2); };
    const later = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(check); };
    const sizes = new ResizeObserver(later);
    const watch = () => { sizes.observe(node); for (const child of node.children) sizes.observe(child); };
    watch();
    const mutations = new MutationObserver(() => { watch(); later(); });
    mutations.observe(node, { childList: true, subtree: true });
    node.addEventListener('scroll', later, { passive: true });
    later();
    cleanup.current = () => {
      cancelAnimationFrame(frame);
      sizes.disconnect();
      mutations.disconnect();
      node.removeEventListener('scroll', later);
    };
  }, []);
  return [ref, more, reveal];
}
