import { useEffect, useState } from 'react';

/** The reader's text size in CSS px (the root font size: 16 at 100%). One hidden 1rem box, watched for size changes,
 * so a change of the phone's or browser's text size re-renders the reader. */
export function useRootPx(): number {
  const read = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const [px, setPx] = useState(read);
  useEffect(() => {
    const probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:fixed;left:0;top:0;width:1rem;height:1rem;visibility:hidden;pointer-events:none;z-index:-1';
    document.body.appendChild(probe);
    const sizes = new ResizeObserver(() => setPx(probe.getBoundingClientRect().width || read()));
    sizes.observe(probe);
    return () => { sizes.disconnect(); probe.remove(); };
  }, []);
  return px;
}

/** Large text starts at 125% (root 20 px): from there a few px-sized pictures (book covers) get a live text twin. */
export const LARGE_TEXT_ROOT_PX = 20;
