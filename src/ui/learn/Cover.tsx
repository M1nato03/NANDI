import type { TopicPack } from '../../data/packs/schemas';
import { bookTitle } from '../../core/learn/books';
import './read.css';

/** Spec 33 §1: covers are typographic only, the title in the display face on the book's palette with its motif. */
export function Cover({ pack, size = 'shelf' }: { pack: TopicPack; size?: 'thumb' | 'shelf' | 'large' }) {
  const book = pack.body.book;
  return <span className={`book-cover cover-${book?.cover.palette ?? 'teal'} motif-${book?.cover.motif ?? 'stripes'} cover-${size}`} aria-hidden="true">
    <span className="book-cover-motif" />
    <span className="book-cover-title">{bookTitle(pack)}</span>
    {size !== 'thumb' && <span className="book-cover-author">{book?.author ?? 'NANDI'}</span>}
  </span>;
}
