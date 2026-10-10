import { useEffect, useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ulid } from 'ulidx';
import { weekKey } from '../../core/quests';
import { db } from '../../data/db';
import { createQuestRepo } from '../../data/repos/quests';
import { errorMessage } from '../shell/errorMessage';
import './quests.css';

const repo = createQuestRepo(db);

function useQuestWeek() {
  const [now, setNow] = useState(() => Date.now());
  const [message, setMessage] = useState('');
  const week = weekKey(now);
  const rows = useLiveQuery(() => db.quests.where('week').equals(week).toArray(), [week]) ?? [];
  useEffect(() => {
    let lastWeek = '';
    const refresh = () => { const at = Date.now(); const current = weekKey(at);
      if (current !== lastWeek) { lastWeek = current; setNow(at); void repo.ensureWeek(at).catch(error => setMessage(errorMessage(error))); }
    };
    refresh();
    const timer = window.setInterval(refresh, 1000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('pageshow', refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('pageshow', refresh); };
  }, []);
  return { rows, message, setMessage };
}

export function QuestSummaryCard() {
  const { rows } = useQuestWeek();
  const visible = rows.filter(row => row.status !== 'swapped' && !row.deleted);
  return <section className="card quest-summary" aria-label="Side quests"><strong>Side quests</strong><span>{visible.filter(row => row.status === 'done').length} of {visible.length || 3} side quests this week</span></section>;
}

export function SideQuests() {
  const { rows, message, setMessage } = useQuestWeek();
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState<'once' | 'total'>('once');
  const visible = rows.filter(row => row.status !== 'swapped' && !row.deleted);
  async function run(action: () => Promise<void>) {
    setBusy(true); setMessage('');
    try { await action(); setMessage('Quest saved.'); }
    catch (error) { setMessage(errorMessage(error)); }
    finally { setBusy(false); }
  }
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void run(async () => {
      await repo.addCustom({ title: String(form.get('title') ?? ''), kind,
        target: Number(form.get('target') ?? 1), unit: String(form.get('unit') ?? ''), step: Number(form.get('step') ?? 1) }, Date.now());
      setShowForm(false);
    });
  }
  return <section className="card side-quests" aria-label="Side quests"><div className="quest-heading"><div><p className="eyebrow">This week</p><h2>Side quests</h2></div><span>{visible.filter(row => row.status === 'done').length} of {visible.length || 3} done</span></div>
    {visible.map(row => <article className="quest-row" key={row.id}><div><strong>{row.title}</strong><p>{row.status === 'done' ? 'Done' : row.kind === 'total' ? `${row.progress} / ${row.target} ${row.unit}` : 'Ready when you are'}{row.custom ? ' · Custom' : ''}</p></div>
      {row.status === 'active' && <div className="quest-actions">{row.kind === 'once' ? <button type="button" disabled={busy} onClick={() => void run(() => repo.done(row.id, Date.now()))}>Done</button> : <><button type="button" aria-label={`Subtract ${row.step} from ${row.title}`} disabled={busy || row.progress === 0} onClick={() => void run(() => repo.tap(row.id, ulid(), -row.step, Date.now()))}>−{row.step}</button><button type="button" aria-label={`Add ${row.step} to ${row.title}`} disabled={busy} onClick={() => void run(() => repo.tap(row.id, ulid(), row.step, Date.now()))}>+{row.step}</button></>}</div>}
    </article>)}
    <div className="quest-footer"><button type="button" className="secondary" disabled={busy || rows.some(row => row.status === 'swapped')} onClick={() => void run(() => repo.swap(Date.now()))}>Swap one suggestion</button><button type="button" onClick={() => setShowForm(value => !value)}>Add custom quest</button></div>
    {showForm && <form className="quest-form" onSubmit={add}><label>Quest title<input name="title" maxLength={120} required placeholder="What will you do?" /></label><label>Kind<select value={kind} onChange={event => setKind(event.target.value as 'once' | 'total')}><option value="once">Once</option><option value="total">Total</option></select></label>
      {kind === 'total' && <><label>Target<input name="target" type="number" min="1" max="10000" defaultValue="10" required /></label><label>Unit<input name="unit" maxLength={24} placeholder="pages" required /></label><label>Step<input name="step" type="number" min="1" max="1000" defaultValue="1" required /></label></>}
      <button type="submit" disabled={busy}>Save custom quest</button></form>}
    {message && <p role="status">{message}</p>}
  </section>;
}
