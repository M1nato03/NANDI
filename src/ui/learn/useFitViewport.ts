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
      const next = height >= 360 ? `${height}px` : 'auto';
      if (node.style.getPropertyValue('--fit-h') !== next) node.style.setProperty('--fit-h', next);
      // The node's top moves only when something above it changes size: watch every element above it (each ancestor's
      // earlier siblings). Observing an element twice is a no-op, so this settles after one pass.
      // Its bottom room moves when an ancestor's padding does (the page drops the tab bar's room during a question), so
      // the ancestors' border boxes are watched too.
      for (let el: Element | null = node; el && el !== document.body; el = el.parentElement) {
        for (let above = el.previousElementSibling; above; above = above.previousElementSibling) observer.observe(above);
        if (el !== node) observer.observe(el, { box: 'border-box' });
      }
    };
    let frame = 0;
    const later = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(fit); };
    const observer = new ResizeObserver(later);
    fit();
    later();
    observer.observe(document.documentElement);
    // The page's own size need not change when the screen does (and a resize can land before the visual viewport has
    // its new height), so a hidden box pinned to the screen reports every change of the screen itself.
    const screenBox = document.createElement('div');
    screenBox.setAttribute('aria-hidden', 'true');
    screenBox.style.cssText = 'position:fixed;inset:0;visibility:hidden;pointer-events:none;z-index:-1';
    document.body.appendChild(screenBox);
    observer.observe(screenBox);
    // Something above the node can come or go without resizing the page (the one-time "Ready to work offline" notice
    // sits in the flow for 4 s), which moves the node's top: refit on any added or removed element.
    const mutations = new MutationObserver(later);
    mutations.observe(document.body, { childList: true, subtree: true });
    document.fonts?.addEventListener('loadingdone', later);
    window.addEventListener('resize', later);
    window.visualViewport?.addEventListener('resize', later);
    cleanup.current = () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutations.disconnect();
      screenBox.remove();
      document.fonts?.removeEventListener('loadingdone', later);
      window.removeEventListener('resize', later);
      window.visualViewport?.removeEventListener('resize', later);
    };
  }, [gap]);
}
