import { useCallback, useEffect, useRef, useState } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/**
 * Modal focus for a role="dialog" element (WCAG 2.4.3 / APG dialog pattern, a11y audit 10-22 #1): on open,
 * focus moves inside; Tab and Shift+Tab stay inside; Escape calls `onEscape` when the dialog can close; on
 * close, focus returns to what had it before. Returns a callback ref, so a dialog shown conditionally works too.
 * Give the dialog tabIndex={-1} so it can hold focus when it has no control yet.
 */
export function useModalFocus<T extends HTMLElement>(onEscape?: () => void): (node: T | null) => void {
  const [node, setNode] = useState<T | null>(null);
  const escape = useRef(onEscape);
  useEffect(() => { escape.current = onEscape; });
  useEffect(() => {
    if (!node) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const items = () => [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(item => item.getClientRects().length > 0);
    if (!node.contains(document.activeElement)) (items()[0] ?? node).focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && escape.current) { event.preventDefault(); escape.current(); return; }
      if (event.key !== 'Tab') return;
      const list = items();
      if (!list.length) { event.preventDefault(); node.focus({ preventScroll: true }); return; }
      const first = list[0]!, last = list[list.length - 1]!;
      if (!node.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, [node]);
  return useCallback((next: T | null) => setNode(next), []);
}
