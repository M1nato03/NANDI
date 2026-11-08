import { useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ulid } from 'ulidx';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { trackWrite } from '../../core/pendingWrites';
import { addReminder, readReminders, removeReminder, splitReminders, toggleReminder, REMINDERS_KEY, REMINDER_LIMITS, type Reminder } from '../../core/tasks/reminders';
import { EmptyState } from '../EmptyState';

/**
 * b2 (gate-s2): every change reads the list as stored and writes it back in one transaction, so two quick adds can't
 * both start from the same old list and lose one (the second used to overwrite the first). Returns the change's error.
 */
async function update(change: (list: Reminder[]) => { list: Reminder[]; error?: string }): Promise<string | undefined> {
  const at = Date.now();
  const deviceId = await getOrCreateDeviceId(db, at);
  let error: string | undefined;
  await trackWrite(() => db.transaction('rw', db.settings, async () => {
    const stored = await db.settings.get(REMINDERS_KEY);
    const result = change(readReminders(stored && !stored.deleted ? stored.value : undefined));
    error = result.error;
    if (!error) await db.settings.put({ key: REMINDERS_KEY, value: result.list, updatedAt: at, deleted: 0, deviceId });
  }));
  return error;
}

/** Fresh id and clock for a new line; kept outside the component so render stays pure. */
const addNow = (text: string) => { const at = Date.now(), id = ulid(); return (list: Reminder[]) => addReminder(list, text, at, id); };

/** A to-do list with no time or date: nothing here is ever late. */
export function Reminders() {
  const stored = useLiveQuery(() => db.settings.get(REMINDERS_KEY), []);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const list = readReminders(stored && !stored.deleted ? stored.value : undefined);
  const { open, done } = splitReminders(list, Date.now()); // eslint-disable-line react-hooks/purity

  async function add(event: FormEvent) {
    event.preventDefault();
    const failed = await update(addNow(text));
    if (failed) { setError(failed); return; }
    setError('');
    setText('');
  }

  const row = (item: Reminder) => <li key={item.id} className={`reminder-row${item.doneAt ? ' done' : ''}`}>
    <button type="button" className={`done-circle${item.doneAt ? ' done-mark' : ''}`} aria-pressed={item.doneAt !== undefined} aria-label={item.doneAt ? `Not done yet: ${item.text}` : `Done: ${item.text}`} onClick={() => { const at = Date.now(); void update(current => ({ list: toggleReminder(current, item.id, at) })); }}><span aria-hidden="true">✓</span></button>
    <span className="reminder-text">{item.text}</span>
    <button type="button" className="text-button reminder-remove" aria-label={`Remove ${item.text}`} onClick={() => void update(current => ({ list: removeReminder(current, item.id) }))}><span aria-hidden="true">×</span></button>
  </li>;

  return <section className="reminders" aria-label="Reminders">
    <div className="ui-section-header"><span className="eyebrow">No time, no date</span><h2>Reminders <span className="task-count">{open.length}</span></h2></div>
    <form className="reminder-add" onSubmit={event => void add(event)}>
      <input aria-label="New reminder" maxLength={REMINDER_LIMITS.maxChars} value={text} onChange={event => setText(event.target.value)} placeholder="e.g. buy a notebook" />
      <button type="submit" className="secondary">Add</button>
    </form>
    {error && <p role="alert" className="small">{error}</p>}
    {open.length === 0 ? <EmptyState area="do">Little things to remember, with no clock attached.</EmptyState> : <ul className="reminder-list">{open.map(row)}</ul>}
    {done.length > 0 && <details className="reminder-done"><summary>Done lately · {done.length}</summary><ul className="reminder-list">{done.map(row)}</ul></details>}
  </section>;
}
