import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { shareWindow } from '../core/shareGate';
import { dayKey } from '../core/time/dayKey';
import { db } from '../data/db';
import { canShareNow } from '../data/repos/night';
import { shareLink, shareOrDownload, type ShareOptions } from '../platform/files';

/**
 * Spec 19 share rules, in one place: the person taps to send, nothing is recorded (no XP, Shards, badge,
 * ledger fact or count), and every handler checks the clock again at tap time, so a screen left open
 * past bedtime cannot send.
 */
export type TextShareResult = 'shared' | 'copied' | 'cancelled' | 'failed' | 'night';
export type FileShareResult = 'shared' | 'downloaded' | 'cancelled' | 'night';
const dayNow = () => canShareNow(db);

export async function shareTextNow(text: string, isDay: () => Promise<boolean> = dayNow, options?: Pick<ShareOptions, 'title' | 'dialogTitle'>): Promise<TextShareResult> {
  if (!await isDay()) return 'night';
  return shareLink(text, options);
}

export async function shareFileNow(file: File | (() => Promise<File>), text?: string, options: ShareOptions = {}, isDay: () => Promise<boolean> = dayNow): Promise<FileShareResult> {
  if (!await isDay()) return 'night';
  return shareOrDownload(typeof file === 'function' ? await file() : file, text, options);
}

/** A short status line after a tap; nothing when it was shared or closed. */
export function shareNote(result: TextShareResult | FileShareResult): string {
  if (result === 'copied') return 'Copied. Paste it into a chat.';
  if (result === 'failed') return 'Could not share it. Try again.';
  if (result === 'downloaded') return 'Image saved.';
  if (result === 'night') return 'Sharing waits for the morning.';
  return '';
}

/** True only in the day window; re-read every 30 s so a button disappears at shutdown without a reload. */
export function useShareDay(): boolean {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const today = dayKey(now);
  const data = useLiveQuery(async () => ({ settings: await db.settings.toArray(), tasks: await db.tasks.where('dayKey').equals(today).toArray(), log: await db.dailyLog.get(today) }), [today]);
  return !!data && shareWindow(now, data.settings, data.tasks, data.log?.windDownAt) === 'day';
}
