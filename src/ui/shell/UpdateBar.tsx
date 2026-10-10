import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { canReloadNow } from '../../core/canReloadNow';
import { pendingWrites } from '../../core/pendingWrites';
import {
  applyServiceWorkerUpdate, dismissOfflineReady, getServiceWorkerState, subscribeToServiceWorker,
} from '../../platform/sw-register';

export function UpdateBar() {
  const { needRefresh, offlineReady } = useSyncExternalStore(subscribeToServiceWorker, getServiceWorkerState);
  const [dismissed, setDismissed] = useState(false);
  const [queued, setQueued] = useState(false);
  const [writes, setWrites] = useState(pendingWrites.count);
  const updating = useRef(false);

  useEffect(() => pendingWrites.subscribe(setWrites), []);

  useEffect(() => {
    if (queued && writes === 0 && canReloadNow() && !updating.current) {
      updating.current = true;
      void applyServiceWorkerUpdate();
    }
  }, [queued, writes]);

  useEffect(() => {
    if (!offlineReady) return;
    const timer = setTimeout(dismissOfflineReady, 4000);
    return () => clearTimeout(timer);
  }, [offlineReady]);

  function handleUpdate() {
    if (pendingWrites.count > 0 || !canReloadNow()) {
      setQueued(true);
    } else if (!updating.current) {
      updating.current = true;
      void applyServiceWorkerUpdate();
    }
  }

  if (needRefresh && !dismissed) {
    return (
      <div className="update-bar" role="region" aria-label="App update">
        <span>{queued ? 'Saving… updating in a moment' : 'Update available'}</span>
        <div className="update-bar-actions">
          <button onClick={handleUpdate} disabled={queued}>Update</button>
          <button className="secondary" onClick={() => { setQueued(false); setDismissed(true); }}>Later</button>
        </div>
      </div>
    );
  }

  if (offlineReady) return <div className="offline-ready-toast" role="status" aria-label="Offline ready">Ready to work offline</div>;
  return null;
}
