import type { ReactNode } from 'react';

export type Glyph = 'do' | 'move' | 'think' | 'notice' | 'learn' | 'extra' | 'end' | 'night' | 'you';

export function DeckGlyph({ type }: { type: Glyph }) {
  const paths: Record<Glyph, ReactNode> = {
    do: <><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12 2.4 2.4 4.8-5" /></>,
    move: <><path d="M5 8v8M8 6v12M16 6v12M19 8v8M8 12h8M3 9v6M21 9v6" /></>,
    think: <><rect x="3.5" y="3.5" width="17" height="17" rx="2" /><path d="M9 3.5v17M15 3.5v17M3.5 9h17M3.5 15h17" /></>,
    notice: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
    learn: <><path d="M9 18h6m-5 3h4M8.3 15.5A7 7 0 1 1 15.7 15.5L15 18H9l-.7-2.5Z" /></>,
    extra: <><circle cx="12" cy="12" r="8.5" /><path d="m15.7 8.3-2.1 5.3-5.3 2.1 2.1-5.3 5.3-2.1Z" /></>,
    end: <><path d="M3 16h18M5 20h14M4 12l2-2m14 2-2-2M12 2v3M7 5l1.5 1.5M17 5l-1.5 1.5M6 16a6 6 0 0 1 12 0" /></>,
    you: <><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
    night: <><path d="M20 15.3A8.5 8.5 0 0 1 8.7 4a8.5 8.5 0 1 0 11.3 11.3Z" /><path d="M17 4v3M15.5 5.5h3" /></>,
  };
  return <span className="deck-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg></span>;
}
