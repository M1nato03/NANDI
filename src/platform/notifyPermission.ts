import { Capacitor } from '@capacitor/core';
import { NUDGE_PERMISSION_ASKED } from '../core/nudges';
import { db } from '../data/db';
import { getOrCreateDeviceId } from '../data/device';
import { createSettingsRepos } from '../data/repos/settings';
import { notifier } from './notifier';

export type AskResult = 'granted' | 'denied' | 'prompt' | 'skipped';
let asking: Promise<AskResult> | null = null;

/**
 * Asks Android 13+ for notifications once, right after the user chose something a reminder serves: the first
 * night plan or the first timed task (Android notifications audit, F1). Earlier the only ask sat in Settings,
 * so the default-on nudges never showed on a fresh install. Never asks twice, and never on the web.
 */
export function askNotificationsOnce(now = Date.now()): Promise<AskResult> {
  if (!Capacitor.isNativePlatform()) return Promise.resolve('skipped');
  asking ??= (async (): Promise<AskResult> => {
    try {
      if ((await db.settings.get(NUDGE_PERMISSION_ASKED))?.value === true) return 'skipped';
      if (await notifier.checkPermission() === 'granted') return 'granted';
      const deviceId = await getOrCreateDeviceId(db, now);
      await createSettingsRepos(db, deviceId).settings.put({ key: NUDGE_PERMISSION_ASKED, value: true }, now);
      return await notifier.requestPermission();
    } finally { asking = null; }
  })();
  return asking;
}
