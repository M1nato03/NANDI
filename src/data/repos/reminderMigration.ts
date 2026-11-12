import type { NandiDb } from '../db';
import type { TaskRow } from '../types';
import { dayKey } from '../../core/time';
import { readReminders, REMINDERS_KEY } from '../../core/tasks/reminders';
import { getOrCreateDeviceId } from '../device';
import { trackWrite } from '../../core/pendingWrites';

/**
 * Spec 660 §3.4 (jenil-0b F4, 12 Nov): Plan's undated Reminders fold into Mor's list as Later items. Each open reminder
 * becomes one Later task (status 'someday') with a fixed id from the reminder's, `rem-<id>`, so running it again (every
 * open) or restoring an older backup that brings plan.reminders back never makes a second copy, and a migrated task the
 * person deleted stays deleted. Marked fromReminder: finishing one pays no XP and fills no jar, as reminders never did.
 * The originals stay in the setting, read-only in Settings › Reminders until the person deletes them. Done reminders
 * are left there.
 */
export const reminderTaskId = (reminderId: string) => `rem-${reminderId}`;

export async function migrateReminders(db: NandiDb, now = Date.now()): Promise<number> {
  const row = await db.settings.get(REMINDERS_KEY);
  if (!row || row.deleted) return 0;
  const open = readReminders(row.value).filter(reminder => reminder.doneAt === undefined);
  if (!open.length) return 0;
  return trackWrite(async () => {
    const deviceId = await getOrCreateDeviceId(db, now);
    let made = 0;
    await db.transaction('rw', db.tasks, async () => {
      for (const reminder of open) {
        const id = reminderTaskId(reminder.id);
        if (await db.tasks.get(id)) continue;
        const task: TaskRow = {
          id, title: reminder.text, status: 'someday', dayKey: dayKey(reminder.createdAt), size: 'S', estimateMin: 15, plannedSize: 'S',
          mustOrCould: 'could', scheduledStart: null, scheduledEnd: null, postponeCount: 0, fromReminder: true,
          updatedAt: now, deleted: 0, deviceId,
        };
        await db.tasks.put(task);
        made++;
      }
    });
    return made;
  });
}

/** Settings › Reminders: "Delete old reminders" clears the kept originals (the Later tasks stay). */
export async function deleteOldReminders(db: NandiDb, now = Date.now()): Promise<void> {
  await trackWrite(async () => {
    const deviceId = await getOrCreateDeviceId(db, now);
    await db.settings.put({ key: REMINDERS_KEY, value: [], updatedAt: now, deleted: 0, deviceId });
  });
}
