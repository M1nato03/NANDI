import { useSyncExternalStore } from 'react';
import { getErrorRing, subscribeErrorRing } from '../errorRing';
import { EmptyState } from '../EmptyState';

export function ErrorRing() {
  const entries = useSyncExternalStore(subscribeErrorRing, getErrorRing);
  return <div className="card"><h2>Error ring</h2><p>Recent errors stay on this device. {entries.length} of 50 saved.</p>
      {entries.length ? <ol className="errors">{[...entries].reverse().map((entry, index) => <li key={`${entry.at}-${index}`}><time>{new Date(entry.at).toLocaleString()}</time> · {entry.source}: {entry.message}</li>)}</ol> : <EmptyState area="do">All clear here.</EmptyState>}</div>;
}
