import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { canReloadNow } from '../../data/canReloadNow';
import { isFocusActive } from '../../data/repos/tasks';
import { isTrainSessionActive } from '../../data/repos/train';
import { isMeditationActive } from '../../data/repos/meditation';
import { pendingWrites } from '../../core/pendingWrites';
import {
  applyServiceWorkerUpdate, dismissOfflineReady, getServiceWorkerState, subscribeToServiceWorker,
} from '../../platform/sw-register';

export function UpdateBar() {
  const { needRefresh, offlineReady } = useSyncExternalStore(subscribeToServiceWorker, getServiceWorkerState);
  const [dismissed, setDismissed] = useState(false);
  const [queued, setQueued] = useState(false);
  const [writes, setWrites] = useState(pendingWrites.count);
  const focusActive = useLiveQuery(isFocusActive, []);
  const trainActive = useLiveQuery(isTrainSessionActive, []);
  const meditationActive = useLiveQuery(isMeditationActive, []);
  const updating = useRef(false);

  useEffect(() => pendingWrites.subscribe(setWrites), []);

  useEffect(() => {
    if (!queued || writes !== 0 || focusActive !== false || trainActive !== false || meditationActive !== false || updating.current) return;
    let cancelled = false;
    void canReloadNow().then((ready) => {
      if (cancelled || !ready || pendingWrites.count !== 0 || updating.current) return;
      updating.current = true;
      void applyServiceWorkerUpdate();
    });
    return () => { cancelled = true; };
  }, [queued, writes, focusActive, trainActive, meditationActive]);

  useEffect(() => {
    if (!offlineReady) return;
    const timer = setTimeout(dismissOfflineReady, 4000);
    return () => clearTimeout(timer);
  }, [offlineReady]);

  async function handleUpdate() {
    const ready = await canReloadNow();
    if (pendingWrites.count > 0 || !ready) {
      setQueued(true);
    } else if (!updating.current) {
      updating.current = true;
      void applyServiceWorkerUpdate();
    }
  }

  if (needRefresh && !dismissed) {
    return (
      <div className="update-bar" role="region" aria-label="App update">
        <span>{queued ? trainActive ? 'Finish your workout first' : focusActive ? 'Finish or pause your focus first' : meditationActive ? 'Finish your meditation first' : 'Saving… updating in a moment' : 'Update available'}</span>
        <div className="update-bar-actions">
          <button onClick={() => void handleUpdate()} disabled={queued}>Update</button>
          <button className="secondary" onClick={() => { setQueued(false); setDismissed(true); }}>Later</button>
        </div>
      </div>
    );
  }

  if (offlineReady) return <div className="offline-ready-toast" role="status" aria-label="Offline ready">Ready to work offline</div>;
  return null;
}
