import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { pendingWrites } from '../../core/pendingWrites';
import { runAutoBackup } from '../../data/autoBackup';
import { recordError } from '../errorRing';

export function useAutoBackup(): boolean {
  const [warning, setWarning] = useState(false);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    let waiting: (() => void) | undefined;
    const attempt = () => {
      waiting?.(); waiting = undefined;
      if (document.visibilityState !== 'visible') return;
      if (pendingWrites.count > 0) {
        waiting = pendingWrites.subscribe(count => { if (count === 0) attempt(); });
        return;
      }
      void runAutoBackup().then(state => {
        if (!cancelled) setWarning(state.failureStreak >= 3);
      }).catch(error => recordError('promise', error));
    };
    const visibility = () => {
      if (document.visibilityState === 'visible') attempt();
      else { waiting?.(); waiting = undefined; }
    };
    const saved = () => setWarning(false);
    attempt();
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('nandi:auto-backup-saved', saved);
    return () => { cancelled = true; waiting?.(); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('nandi:auto-backup-saved', saved); };
  }, []);
  return warning;
}
