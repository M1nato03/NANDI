import { Capacitor } from '@capacitor/core';
import { liveQuery } from 'dexie';
import { db } from '../data/db';
import { getOrCreateDeviceId } from '../data/device';
import type { ReminderRow, SessionRow, TaskRow } from '../data/types';
import { mayScheduleReminder } from '../core/notificationBudget';
import { CapacitorNotifier, notifId, notifier, type Reminder } from './notifier';
import { ulid } from 'ulidx';

export function wantedReminders(tasks: TaskRow[], sessions: SessionRow[], now: number): Reminder[] {
  const common = { now, optIn: true, scheduledEngagement: [], bedtime: '01:30', shutdown: '23:15' };
  return [
    ...tasks.filter(row => row.deleted === 0 && row.status === 'planned' && row.scheduledStart != null &&
      mayScheduleReminder({ ...common, kind: 'task', at: row.scheduledStart! })).map(row => ({
      id: `task:${row.id}`, at: row.scheduledStart!, title: 'Task block starts', body: row.title, channel: 'tasks' as const,
    })),
    ...sessions.filter(row => row.deleted === 0 && row.status === 'active' && row.restEndsAt != null &&
      mayScheduleReminder({ ...common, kind: 'rest', at: row.restEndsAt! })).map(row => ({
      id: `rest:${row.id}`, at: row.restEndsAt!, title: 'Rest is over', body: 'Your next set is ready.', channel: 'rest' as const,
    })),
  ];
}

/** Reconciles persisted reminders after edits, resume, and cold start. */
export async function reconcileReminders(now = Date.now()): Promise<void> {
  const [tasks, sessions, stored, pending] = await Promise.all([
    db.tasks.toArray(), db.sessions.toArray(), db.reminders.toArray(), notifier.listPending(),
  ]);
  const desired = wantedReminders(tasks, sessions, now);
  const byRef = new Map(desired.map(row => [row.id, row]));
  const pendingIds = new Set(pending);
  for (const row of stored.filter(row => row.status === 'scheduled')) {
    const next = byRef.get(`${row.refType === 'session' ? 'rest' : 'task'}:${row.refId}`);
    if (!next || next.at !== row.at) {
      await notifier.cancel(row.id);
      await db.reminders.put({ ...row, status: 'cancelled', updatedAt: now });
    }
  }
  if (!desired.length) return;
  if (Capacitor.isNativePlatform()) {
    if (await notifier.requestPermission() !== 'granted') return;
  } else if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const deviceId = await getOrCreateDeviceId(db, now);
  for (const reminder of desired) {
    const refType = reminder.channel === 'rest' ? 'session' : 'task';
    const refId = reminder.id.split(':').slice(1).join(':');
    const previous = stored.find(row => row.refType === refType && row.refId === refId);
    const id = previous?.id ?? ulid(now);
    if (previous?.at === reminder.at && previous.status === 'scheduled' && pendingIds.has(id)) continue;
    await notifier.schedule({ ...reminder, id });
    const row: ReminderRow = {
      id, refType, refId, at: reminder.at, notifId: notifId(id),
      channel: reminder.channel, status: 'scheduled', updatedAt: now, deleted: 0, deviceId,
    };
    await db.reminders.put(row);
  }
}

export function startReminderSync(onError: (error: unknown) => void): () => void {
  let busy = Promise.resolve();
  const queue = () => { busy = busy.then(() => reconcileReminders()).catch(onError); };
  if (notifier instanceof CapacitorNotifier) void notifier.createChannels().then(queue).catch(onError);
  else queue();
  const subscription = liveQuery(() => Promise.all([db.tasks.toArray(), db.sessions.toArray()])).subscribe({ next: queue, error: onError });
  const resume = () => { if (document.visibilityState === 'visible') queue(); };
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('pageshow', queue);
  return () => { subscription.unsubscribe(); document.removeEventListener('visibilitychange', resume); window.removeEventListener('pageshow', queue); };
}
