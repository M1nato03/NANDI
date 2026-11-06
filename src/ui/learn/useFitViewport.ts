import { useCallback, useRef } from 'react';

/**
 * Spec 571 §0.20 (E12): a question screen fits the phone's screen with no page scroll. The node gets a height from
 * its own top down to the bottom of the visible screen (minus the safe area gap), refreshed on resize and on text-size
 * changes, so the answers and Check sit in the thumb zone and only the question area scrolls when it must.
 */
export function useFitViewport(gap = 4) {
  const cleanup = useRef<(() => void) | null>(null);
  return useCallback((node: HTMLElement | null) => {
    cleanup.current?.();
    cleanup.current = null;
    if (!node) return;
    const fit = () => {
      const view = window.visualViewport?.height ?? window.innerHeight;
      const top = node.getBoundingClientRect().top + window.scrollY;
      // The page's own bottom padding (it holds the safe area) also has to fit, or the page would scroll by that much.
      const content = node.closest<HTMLElement>('.content');
      const below = (content ? parseFloat(getComputedStyle(content).paddingBottom) || 0 : 0) + gap;
      // A screen too short for a fitted layout (or a node far down the page) keeps its natural height.
      const height = Math.floor(view - top - below);
      node.style.setProperty('--fit-h', height >= 360 ? `${height}px` : 'auto');
    };
    fit();
    const frame = requestAnimationFrame(fit);
    const observer = new ResizeObserver(fit);
    observer.observe(document.documentElement);
    window.addEventListener('resize', fit);
    window.visualViewport?.addEventListener('resize', fit);
    cleanup.current = () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', fit);
      window.visualViewport?.removeEventListener('resize', fit);
    };
  }, [gap]);
}
