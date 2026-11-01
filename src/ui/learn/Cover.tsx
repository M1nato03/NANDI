import { useLayoutEffect, useRef } from 'react';
import type { TopicPack } from '../../data/packs/schemas';
import { bookTitle } from '../../core/learn/books';
import './read.css';

/** The smallest a cover title may step down to before it stops shrinking (it wraps at spaces only, never mid-word). */
const MIN_TITLE_PX = 7;

/**
 * Spec 33 §1: covers are typographic only, the title in the display face on the book's palette with its motif.
 * Spec 50 §4: a title wraps at spaces only and, if it still does not fit the cover, steps its font down; it is never
 * clipped. A pack may give a short cover title (`cover.short`); the full title stays in the tile's label and aria.
 */
export function Cover({ pack, size = 'shelf' }: { pack: TopicPack; size?: 'thumb' | 'shelf' | 'large' }) {
  const book = pack.body.book;
  const cover = useRef<HTMLSpanElement>(null);
  const title = useRef<HTMLSpanElement>(null);
  const text = book?.cover.short ?? bookTitle(pack);
  useLayoutEffect(() => {
    const box = cover.current, line = title.current;
    if (!box || !line) return;
    const fit = () => {
      // Not laid out (a hidden screen, a detached copy): nothing to measure, so leave the size as it is.
      if (!box.isConnected || box.clientHeight === 0 || line.clientWidth === 0) return;
      line.style.fontSize = '';
      const style = getComputedStyle(box);
      const author = line.nextElementSibling instanceof HTMLElement ? line.nextElementSibling.offsetHeight + parseFloat(getComputedStyle(line.nextElementSibling).marginTop || '0') : 0;
      const room = box.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - author;
      let px = parseFloat(getComputedStyle(line).fontSize);
      while (px > MIN_TITLE_PX && (line.scrollHeight > room + 0.5 || line.scrollWidth > line.clientWidth + 0.5)) {
        px -= 0.5;
        line.style.fontSize = `${px}px`;
      }
    };
    fit();
    // The display face can arrive after the first layout (and `fonts.ready` may already have settled before it was
    // asked for): load this title's own face and measure again once it is in, or once any face finishes loading.
    let live = true;
    const again = () => { if (live) fit(); };
    void document.fonts?.load(getComputedStyle(line).font).then(again, () => undefined);
    document.fonts?.addEventListener('loadingdone', again);
    return () => { live = false; document.fonts?.removeEventListener('loadingdone', again); };
  }, [text, size]);
  return <span ref={cover} className={`book-cover cover-${book?.cover.palette ?? 'teal'} motif-${book?.cover.motif ?? 'stripes'} cover-${size}`} aria-hidden="true">
    <span className="book-cover-motif" />
    <span ref={title} className="book-cover-title">{text}</span>
    {size !== 'thumb' && <span className="book-cover-author">{book?.author ?? 'NANDI'}</span>}
  </span>;
}
