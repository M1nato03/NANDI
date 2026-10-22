import { Capacitor } from '@capacitor/core';
import { liveQuery } from 'dexie';
import { db } from '../data/db';
import { getOrCreateDeviceId } from '../data/device';
import type { ReminderRow, SessionRow, SettingRow, TaskRow } from '../data/types';
import { reminderPlacement } from '../core/notificationBudget';
import { RULES } from '../core/rules.config';
import { CapacitorNotifier, notifId, notifier, type Reminder } from './notifier';
import { ulid } from 'ulidx';
import { reconcileNudges } from './nudgeSync';

const clock = (value: unknown, fallback: string) => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : fallback;
const setting = (rows: readonly SettingRow[], key: string) => rows.find(row => row.key === key && !row.deleted)?.value;

/** The same bedtime and shutdown reading as the nudges, so reminders follow the user's own night (audit F2). */
export function wantedReminders(tasks: TaskRow[], sessions: SessionRow[], now: number, settings: readonly SettingRow[] = []): Reminder[] {
  const bedtime = clock(setting(settings, 'planner.bedtime'), RULES.night.defaultBedtime);
  const shutdown = clock(setting(settings, 'planner.shutdown'), RULES.night.defaultShutdown);
  const common = { now, optIn: true, scheduledEngagement: [], bedtime, shutdown };
  const reminders: Reminder[] = [];
  for (const row of tasks) {
    if (row.deleted !== 0 || row.status !== 'planned' || row.scheduledStart == null) continue;
    const placement = reminderPlacement({ ...common, kind: 'task', at: row.scheduledStart });
    if (placement !== 'skip') reminders.push({ id: `task:${row.id}`, at: row.scheduledStart, title: 'Task block starts', body: row.title, channel: placement === 'quiet' ? 'quiet' : 'tasks' });
  }
  for (const row of sessions) {
    if (row.deleted !== 0 || row.status !== 'active' || row.restEndsAt == null) continue;
    const placement = reminderPlacement({ ...common, kind: 'rest', at: row.restEndsAt });
    if (placement !== 'skip') reminders.push({ id: `rest:${row.id}`, at: row.restEndsAt, title: 'Rest is over', body: 'Your next set is ready.', channel: placement === 'quiet' ? 'quiet' : 'rest' });
  }
  return reminders;
}

/** Reconciles persisted reminders after edits, resume, and cold start. */
export async function reconcileReminders(now = Date.now()): Promise<void> {
  const [tasks, sessions, stored, pending, settings] = await Promise.all([
    db.tasks.toArray(), db.sessions.toArray(), db.reminders.toArray(), notifier.listPending(), db.settings.toArray(),
  ]);
  const desired = wantedReminders(tasks, sessions, now, settings);
  const byRef = new Map(desired.map(row => [row.id, row]));
  const pendingIds = new Set(pending);
  for (const row of stored.filter(row => row.status === 'scheduled' && (row.refType === 'task' || row.refType === 'session'))) {
    if (row.at <= now) { await db.reminders.put({ ...row, status: 'fired', updatedAt: now }); continue; }
    const next = byRef.get(`${row.refType === 'session' ? 'rest' : 'task'}:${row.refId}`);
    if (!next || next.at !== row.at) {
      await notifier.cancel(row.id);
      await db.reminders.put({ ...row, status: 'cancelled', updatedAt: now });
    }
  }
  if (!desired.length) return;
  if (Capacitor.isNativePlatform()) {
    if (await notifier.checkPermission() !== 'granted') return;
  } else if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const deviceId = await getOrCreateDeviceId(db, now);
  if (notifier instanceof CapacitorNotifier) await notifier.refreshExact();
  for (const reminder of desired) {
    const refType = reminder.id.startsWith('rest:') ? 'session' : 'task';
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
  const queue = () => { busy = busy.then(async () => { await reconcileReminders(); await reconcileNudges(); }).catch(onError); };
  if (notifier instanceof CapacitorNotifier) void notifier.createChannels().then(queue).catch(onError);
  else queue();
  const subscription = liveQuery(() => Promise.all([db.tasks.toArray(), db.sessions.toArray(), db.settings.toArray(), db.dailyLog.toArray(), db.ledger.toArray()])).subscribe({ next: queue, error: onError });
  const resume = () => { if (document.visibilityState === 'visible') queue(); };
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('pageshow', queue);
  return () => { subscription.unsubscribe(); document.removeEventListener('visibilitychange', resume); window.removeEventListener('pageshow', queue); };
}
