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
// b2 (7 Nov): the notice lives in the top bar, which the Night route hides. It waits there, unseen time not counted,
// and shows on the first screen with the top bar.
const topBarHidden = () => { const bar = document.querySelector<HTMLElement>('.topbar'); return !!bar && getComputedStyle(bar).display === 'none'; };

export function UpdateBar() {
  const { needRefresh } = useSyncExternalStore(subscribeToServiceWorker, getServiceWorkerState);
  const [dismissed, setDismissed] = useState(false);
  const [queued, setQueued] = useState(false);
  const [writes, setWrites] = useState(pendingWrites.count);
  const focusActive = useLiveQuery(isFocusActive, []);
  const trainActive = useLiveQuery(isTrainSessionActive, []);
  const updating = useRef(false);

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

  return null;
}

/**
 * The first open's "Ready to work offline" notice (b2, 7 Nov, option A). It sits over the brand side of the top bar, so
 * it never pushes the screen down, never covers a button or the Today dots, and taps go through it. It waits for any
 * sheet (spec 571 E10) and behind a live economy toast (CSS), and gives way to an available update.
 */
export function OfflineReady() {
  const { needRefresh, offlineReady } = useSyncExternalStore(subscribeToServiceWorker, getServiceWorkerState);
  const [showOfflineReady, setShowOfflineReady] = useState(false);

  useEffect(() => {
    if (!offlineReady) return;
    // A minute of waiting for sheets drops it; time on a screen without the top bar (Night) doesn't count.
    let deadline = Date.now() + 60_000;
    let shown = false;
    let displayTimer: ReturnType<typeof setTimeout> | undefined;
    let expiry: ReturnType<typeof setTimeout>;
    const arm = () => { expiry = setTimeout(() => {
      if (shown) return;
      if (topBarHidden()) deadline = Date.now() + 60_000;
      if (Date.now() >= deadline) dismissOfflineReady(); else arm();
    }, Math.max(0, deadline - Date.now())); };
    arm();
    const check = () => {
      if (topBarHidden()) {
        setShowOfflineReady(false);
        if (shown) dismissOfflineReady();
        else deadline = Date.now() + 60_000;
      } else if (hasOpenSheet()) {
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

  if (offlineReady && showOfflineReady && !needRefresh) return <div className="offline-ready-toast" role="status" aria-label="Offline ready">Ready to work offline</div>;
  return null;
}
