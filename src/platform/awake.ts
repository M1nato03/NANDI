import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';

/** Keeps a workout visible; callers release it when the workout screen closes. */
export function keepScreenAwake(): () => void {
  let lock: WakeLockSentinel | undefined;
  let active = true;
  const acquire = async () => {
    if (!active || document.visibilityState !== 'visible') return;
    try {
      if (Capacitor.isNativePlatform()) await KeepAwake.keepAwake();
      else if ('wakeLock' in navigator) lock = await navigator.wakeLock.request('screen');
    } catch { /* Device may refuse a wake lock. */ }
  };
  void acquire();
  document.addEventListener('visibilitychange', acquire);
  return () => {
    active = false;
    document.removeEventListener('visibilitychange', acquire);
    if (Capacitor.isNativePlatform()) void KeepAwake.allowSleep();
    else void lock?.release();
  };
}
