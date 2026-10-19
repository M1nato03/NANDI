/**
 * Reminders: a plain to-do list with no time, date, size or rules.
 * They never earn XP, never count as postponed and never fill a Today dot.
 */
export interface Reminder {
  id: string;
  text: string;
  createdAt: number;
  doneAt?: number;
}

export const REMINDER_LIMITS = { maxChars: 120, maxOpen: 50, keepDoneDays: 7 } as const;
export const REMINDERS_KEY = 'plan.reminders';

const DAY_MS = 86_400_000;

export function readReminders(value: unknown): Reminder[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is Reminder => !!row && typeof row === 'object'
    && typeof (row as Reminder).id === 'string' && typeof (row as Reminder).text === 'string'
    && typeof (row as Reminder).createdAt === 'number');
}

/** Done reminders fade out of the list a week after they were ticked. */
export function pruneReminders(list: readonly Reminder[], now: number): Reminder[] {
  return list.filter(row => row.doneAt === undefined || now - row.doneAt < REMINDER_LIMITS.keepDoneDays * DAY_MS);
}

export function addReminder(list: readonly Reminder[], text: string, now: number, id: string): { list: Reminder[]; error?: string } {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (!clean) return { list: [...list], error: 'Write a few words first.' };
  if (clean.length > REMINDER_LIMITS.maxChars) return { list: [...list], error: `Keep it under ${REMINDER_LIMITS.maxChars} characters.` };
  if (list.filter(row => row.doneAt === undefined).length >= REMINDER_LIMITS.maxOpen) return { list: [...list], error: 'The list is full. Tick or clear a few first.' };
  return { list: pruneReminders([...list, { id, text: clean, createdAt: now }], now) };
}

export function toggleReminder(list: readonly Reminder[], id: string, now: number): Reminder[] {
  return pruneReminders(list.map(row => row.id !== id ? row : row.doneAt === undefined ? { ...row, doneAt: now } : { id: row.id, text: row.text, createdAt: row.createdAt }), now);
}

export function removeReminder(list: readonly Reminder[], id: string): Reminder[] {
  return list.filter(row => row.id !== id);
}

/** Open reminders in the order they were written; done ones newest first. */
export function splitReminders(list: readonly Reminder[], now: number): { open: Reminder[]; done: Reminder[] } {
  const kept = pruneReminders(list, now);
  return {
    open: kept.filter(row => row.doneAt === undefined).sort((a, b) => a.createdAt - b.createdAt),
    done: kept.filter(row => row.doneAt !== undefined).sort((a, b) => b.doneAt! - a.doneAt!),
  };
}
