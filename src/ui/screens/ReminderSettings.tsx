import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorNotifier, notifier } from '../../platform/notifier';

const nativeNotifier = notifier as CapacitorNotifier;

export function ReminderSettings() {
  const [exact, setExact] = useState<boolean | null>(null);
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !(notifier instanceof CapacitorNotifier)) return;
    const refresh = () => { void nativeNotifier.exactAlarmGranted().then(setExact); };
    refresh(); document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, []);
  if (!Capacitor.isNativePlatform() || !(notifier instanceof CapacitorNotifier)) return <p className="small">Reminders are exact only in the installed Android app.</p>;
  return <section><h3>Reminders</h3>
    <p>{exact === true ? 'Exact alarms are allowed.' : exact === false ? 'Exact alarms are off. Task and rest reminders may arrive late.' : 'Checking exact alarms…'}</p>
    {exact === false && <button type="button" className="secondary" onClick={() => void nativeNotifier.openExactAlarmSettings()}>Open alarm settings</button>}
  </section>;
}
