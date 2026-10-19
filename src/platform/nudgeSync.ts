import { Capacitor } from '@capacitor/core';
import { db } from '../data/db';
import { getOrCreateDeviceId } from '../data/device';
import type { ReminderRow } from '../data/types';
import { wantedNudges } from '../core/nudges';
import { notifier, notifId } from './notifier';

const OPENED_KEY = 'nandi.lastOpenedAt';

export function recordAppOpened(now = Date.now()): void { localStorage.setItem(OPENED_KEY, String(now)); }

export async function reconcileNudges(now = Date.now()): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const [settings, tasks, logs, facts, stored, pending] = await Promise.all([
    db.settings.toArray(), db.tasks.toArray(), db.dailyLog.toArray(), db.ledger.toArray(), db.reminders.toArray(), notifier.listPending(),
  ]);
  const lastOpenedAt = Number(localStorage.getItem(OPENED_KEY)) || undefined;
  const scheduledEngagement = stored.filter(row => row.status === 'scheduled' && (row.refType === 'planning' || row.refType === 'streak'))
    .map(row => ({ kind: row.refType as 'planning' | 'streak', at: row.at }));
  const desired = wantedNudges({ now, settings, tasks, logs, facts, lastOpenedAt, scheduledEngagement });
  const wanted = new Map(desired.map(row => [row.id, row]));
  const existing = stored.filter(row => row.refType === 'nudge');
  const pendingIds = new Set(pending);
  for (const row of existing.filter(row => row.status === 'scheduled')) {
    const next = wanted.get(row.id);
    if (!next || next.at !== row.at || next.title !== row.title || next.body !== row.body) {
      if (pendingIds.has(row.id)) { await notifier.cancel(row.id); pendingIds.delete(row.id); }
      await db.reminders.put({ ...row, status: row.at <= now && !pendingIds.has(row.id) ? 'fired' : 'cancelled', updatedAt: now });
    }
  }
  if (await notifier.checkPermission() !== 'granted') return;
  const deviceId = await getOrCreateDeviceId(db, now);
  for (const reminder of desired) {
    const previous = existing.find(row => row.id === reminder.id);
    if (previous?.status === 'fired') continue;
    if (previous?.status === 'scheduled' && previous.at === reminder.at && previous.title === reminder.title && previous.body === reminder.body && pendingIds.has(reminder.id)) continue;
    if (pendingIds.has(reminder.id)) await notifier.cancel(reminder.id);
    await notifier.schedule(reminder);
    const row: ReminderRow = { id: reminder.id, refType: 'nudge', refId: reminder.id.slice(6), at: reminder.at,
      notifId: notifId(reminder.id), channel: reminder.channel, title: reminder.title, body: reminder.body,
      status: 'scheduled', updatedAt: now, deleted: 0, deviceId };
    await db.reminders.put(row);
  }
}
