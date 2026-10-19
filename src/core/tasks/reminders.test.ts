import { describe, expect, it } from 'vitest';
import { addReminder, readReminders, removeReminder, splitReminders, toggleReminder, REMINDER_LIMITS, type Reminder } from './reminders';

const DAY = 86_400_000;

describe('reminders', () => {
  it('adds trimmed text and refuses empty or long lines', () => {
    expect(addReminder([], '  buy   a notebook ', 1, 'a').list).toEqual([{ id: 'a', text: 'buy a notebook', createdAt: 1 }]);
    expect(addReminder([], '   ', 1, 'a').error).toBe('Write a few words first.');
    expect(addReminder([], 'x'.repeat(REMINDER_LIMITS.maxChars + 1), 1, 'a').error).toMatch(/under 120/);
  });

  it('stops at the open limit but done items do not count', () => {
    const full: Reminder[] = Array.from({ length: REMINDER_LIMITS.maxOpen }, (_, i) => ({ id: `r${i}`, text: 'x', createdAt: i }));
    expect(addReminder(full, 'one more', 100, 'z').error).toMatch(/full/);
    const oneDone = toggleReminder(full, 'r0', 100);
    expect(addReminder(oneDone, 'one more', 101, 'z').error).toBeUndefined();
  });

  it('ticks, unticks and removes without touching other rows', () => {
    const list = addReminder(addReminder([], 'a', 1, '1').list, 'b', 2, '2').list;
    const ticked = toggleReminder(list, '1', 10);
    expect(ticked.find(row => row.id === '1')?.doneAt).toBe(10);
    expect(toggleReminder(ticked, '1', 11).find(row => row.id === '1')).toEqual({ id: '1', text: 'a', createdAt: 1 });
    expect(removeReminder(ticked, '2').map(row => row.id)).toEqual(['1']);
  });

  it('keeps open items forever and lets done items fade after a week', () => {
    const list: Reminder[] = [
      { id: 'old-open', text: 'call the bank', createdAt: 0 },
      { id: 'recent-done', text: 'buy tape', createdAt: 0, doneAt: 10 * DAY },
      { id: 'old-done', text: 'return book', createdAt: 0, doneAt: 1 * DAY },
    ];
    const { open, done } = splitReminders(list, 12 * DAY);
    expect(open.map(row => row.id)).toEqual(['old-open']);
    expect(done.map(row => row.id)).toEqual(['recent-done']);
  });

  it('reads only well-formed rows from storage', () => {
    expect(readReminders(undefined)).toEqual([]);
    expect(readReminders([{ id: 'a', text: 'ok', createdAt: 1 }, { id: 2 }, null, 'x'])).toEqual([{ id: 'a', text: 'ok', createdAt: 1 }]);
  });
});
