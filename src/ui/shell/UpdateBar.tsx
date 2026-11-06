import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { canReloadNow } from '../../data/canReloadNow';
import { isFocusActive } from '../../data/repos/tasks';
import { isTrainSessionActive } from '../../data/repos/train';
import { pendingWrites } from '../../core/pendingWrites';
import {
  applyServiceWorkerUpdate, dismissOfflineReady, getServiceWorkerState, subscribeToServiceWorker,
} from '../../platform/sw-register';
import './updateBar.css';

const hasOpenSheet = () => !!document.querySelector('[aria-modal="true"], .sheet-backdrop');

export function UpdateBar() {
  const { needRefresh, offlineReady } = useSyncExternalStore(subscribeToServiceWorker, getServiceWorkerState);
  const [dismissed, setDismissed] = useState(false);
  const [queued, setQueued] = useState(false);
  const [writes, setWrites] = useState(pendingWrites.count);
  const focusActive = useLiveQuery(isFocusActive, []);
  const trainActive = useLiveQuery(isTrainSessionActive, []);
  const updating = useRef(false);
  const [showOfflineReady, setShowOfflineReady] = useState(false);

  useEffect(() => pendingWrites.subscribe(setWrites), []);

  useEffect(() => {
    if (!queued || writes !== 0 || focusActive !== false || trainActive !== false || updating.current) return;
    let cancelled = false;
    void canReloadNow().then((ready) => {
      if (cancelled || !ready || pendingWrites.count !== 0 || updating.current) return;
      updating.current = true;
      void applyServiceWorkerUpdate();
    });
    return () => { cancelled = true; };
  }, [queued, writes, focusActive, trainActive]);

  useEffect(() => {
    if (!offlineReady) return;
    const deadline = Date.now() + 60_000;
    let shown = false;
    let displayTimer: ReturnType<typeof setTimeout> | undefined;
    const expiry = setTimeout(() => { if (!shown) dismissOfflineReady(); }, 60_000);
    const check = () => {
      if (hasOpenSheet()) {
        setShowOfflineReady(false);
        // Once seen, a new sheet ends the notice rather than showing it a second time.
        if (shown) dismissOfflineReady();
      } else if (!shown) {
        if (Date.now() >= deadline) { dismissOfflineReady(); return; }
        shown = true;
        setShowOfflineReady(true);
        displayTimer = setTimeout(dismissOfflineReady, 4000);
      }
    };
    const observer = new MutationObserver(check);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-modal', 'class'] });
    check();
    return () => {
      observer.disconnect();
      clearTimeout(expiry);
      clearTimeout(displayTimer);
      setShowOfflineReady(false);
    };
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
        <span>{queued ? trainActive ? 'Finish your workout first' : focusActive ? 'Finish or pause your focus first' : 'Saving… updating in a moment' : 'Update available'}</span>
        <div className="update-bar-actions">
          <button onClick={() => void handleUpdate()} disabled={queued}>Update</button>
          <button className="secondary" onClick={() => { setQueued(false); setDismissed(true); }}>Later</button>
        </div>
      </div>
    );
  }

  if (offlineReady && showOfflineReady) return <div className="offline-ready-toast" role="status" aria-label="Offline ready">Ready to work offline</div>;
  return null;
}
