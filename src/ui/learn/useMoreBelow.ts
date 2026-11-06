import { useCallback, useRef, useState } from 'react';

/**
 * Spec 571 §0.20 (b2, 6 Nov): at large text the question's middle can hold more than the screen shows. This reports
 * whether there is more below the visible part of a scrolling node, so the screen can show a quiet cue (a fade and a
 * chevron, no words). Rechecked on scroll, on any size change of the node or its content, and when content changes.
 */
export function useMoreBelow(): [(node: HTMLElement | null) => void, boolean] {
  const [more, setMore] = useState(false);
  const cleanup = useRef<(() => void) | null>(null);
  const ref = useCallback((node: HTMLElement | null) => {
    cleanup.current?.();
    cleanup.current = null;
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
  return [ref, more];
}
