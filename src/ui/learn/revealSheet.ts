/**
 * Batch 3 (d): the result sheet is sticky at the bottom, so on a long question it sat over the last option, often the
 * right one with its check mark. scrollIntoView does nothing on a sticky element. Scrolling every scroller up the tree to
 * its end puts the sheet back in its own place below the options, so nothing is covered.
 */
export function revealSheet(from: Element | null | undefined): void {
  if (!from) return;
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.dataset.motion !== 'reduce';
  const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';
  for (let node = from.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if ((overflow === 'auto' || overflow === 'scroll') && node.scrollHeight > node.clientHeight) node.scrollTo?.({ top: node.scrollHeight, behavior });
  }
  const page = document.scrollingElement;
  if (page) window.scrollTo?.({ top: page.scrollHeight, behavior });
}
