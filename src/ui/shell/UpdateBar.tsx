import { useState, useEffect } from 'react';
import { canReloadNow } from '../../core/canReloadNow';
import { pendingWrites } from '../../core/pendingWrites';

let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | undefined;

export function UpdateBar() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [writes, setWrites] = useState(pendingWrites.count);

  useEffect(() => {
    const unsubscribe = pendingWrites.subscribe(setWrites);
    return () => { unsubscribe(); };
  }, []);

  useEffect(() => {
    if (import.meta.env.PROD || import.meta.env.VITE_E2E === '1') {
      import('virtual:pwa-register').then(({ registerSW }) => {
        updateSWFn = registerSW({
          immediate: true,
          onNeedRefresh() {
            setNeedRefresh(true);
          },
          onOfflineReady() {
            setOfflineReady(true);
          },
        });
      });
    }
  }, []);

  useEffect(() => {
    if (offlineReady) {
      const timer = setTimeout(() => setOfflineReady(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [offlineReady]);

  async function handleUpdate() {
    if (updateSWFn && canReloadNow() && writes === 0) {
      await updateSWFn(true);
    }
  }

  if (needRefresh && !dismissed) {
    const disabled = !canReloadNow() || writes > 0;
    return (
      <div className="update-bar" style={{ background: 'var(--brand)', color: '#fff', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Update available</span>
        <div>
          <button onClick={handleUpdate} disabled={disabled} style={{ marginRight: '10px', background: '#fff', color: '#000' }}>Update</button>
          <button onClick={() => setDismissed(true)} style={{ background: 'transparent', border: '1px solid #fff', color: '#fff' }}>Later</button>
        </div>
      </div>
    );
  }

  if (offlineReady) {
    return (
      <div className="offline-ready-toast" style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#333', color: '#fff', padding: '10px 20px', borderRadius: '20px', zIndex: 1000 }}>
        Ready to work offline
      </div>
    );
  }

  return null;
}
