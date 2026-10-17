import { useEffect, useState } from 'react';

export function DelayedCardSkeleton({ insideCard = false }: { insideCard?: boolean }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 300);
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return insideCard ? <div className="lazy-card-skeleton" aria-hidden="true" /> : <section className="screen" aria-hidden="true"><div className="card deck-card lazy-card-skeleton" /></section>;
}
