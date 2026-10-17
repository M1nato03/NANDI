import { useEffect, useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ulid } from 'ulidx';
import { weekKey } from '../../core/quests';
import { db } from '../../data/db';
import { createQuestRepo } from '../../data/repos/quests';
import pack from '../../../content/quests/quests.core.json';
import { errorMessage } from '../shell/errorMessage';
import './quests.css';

const repo = createQuestRepo(db);
const categories = new Map(pack.body.quests.map(quest => [quest.id, quest.category]));
const hints: Record<string, { why: string; time: string }> = {
  movement: { why: 'Get moving in a small, doable way.', time: '10 min' },
  social: { why: 'Make room for a real connection.', time: '10 min' },
  learning: { why: 'Notice how the world works.', time: '20 min' },
  reading: { why: 'Give your attention to a page.', time: '10 min' },
  creativity: { why: 'Make something with your hands.', time: '15 min' },
  money: { why: 'Get clearer about your spending.', time: '10 min' },
  mind: { why: 'Take a little space from your screen.', time: '10 min' },
  literature: { why: 'Spend time with a story or place.', time: '15 min' },
};

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

export function SideQuests({ selectedId }: { selectedId?: string }) {
  const { rows, message, setMessage } = useQuestWeek();
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(selectedId ?? null);
  const [kind, setKind] = useState<'once' | 'total'>('once');
  const visible = rows.filter(row => row.status !== 'swapped' && !row.deleted);
  const shown = (selectedId ? visible.filter(row => row.id.toLowerCase() === selectedId) : visible)
    .sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'));
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
  return <section className="card side-quests" aria-label="Side quests">
    <div className="quest-heading"><div><p className="eyebrow">This week</p><h2>{selectedId ? 'Side quest' : 'Side quests'}</h2><span className="quest-count">{visible.filter(row => row.status === 'done').length} of {visible.length || 3} done</span></div>
      {!selectedId && <div className="quest-heading-actions"><button type="button" className="secondary" disabled={busy || rows.some(row => row.status === 'swapped')} aria-label="Swap one suggestion" onClick={() => void run(() => repo.swap(Date.now()))}>Swap</button><button type="button" className="secondary" aria-label="Add custom quest" onClick={() => setShowForm(value => !value)}>Add your own</button></div>}</div>
    <div className="quest-list">{shown.map(row => {
      const hint = hints[categories.get(row.sourceId) ?? ''] ?? { why: 'Make space for something you chose.', time: 'Your pace' };
      const expanded = expandedId?.toLowerCase() === row.id.toLowerCase();
      return <article className={row.status === 'done' ? 'quest-row quest-done' : 'quest-row'} key={row.id}>
        <div className="quest-row-main"><button type="button" className="quest-disclosure" aria-expanded={expanded} aria-controls={`quest-detail-${row.id}`} onClick={() => setExpandedId(expanded ? null : row.id)}>
          <strong>{row.title}</strong><span className="quest-why">{hint.why}</span><span className="quest-time">{hint.time}{row.custom ? ' · Custom' : ''} <span aria-hidden="true">{expanded ? '⌃' : '⌄'}</span></span>
        </button>
          <div className="quest-actions">{row.status === 'done' ? <span className="quest-check" aria-label="Done"><span aria-hidden="true">✓</span></span> : row.kind === 'once' ? <button type="button" disabled={busy} onClick={() => void run(() => repo.done(row.id, Date.now()))}>Done</button> : <div className="quest-count-action"><button type="button" aria-label={`Add ${row.step} to ${row.title}`} disabled={busy} onClick={() => void run(() => repo.tap(row.id, ulid(), row.step, Date.now()))}><span aria-hidden="true">+</span>{row.step}</button><span>{row.progress} of {row.target}</span></div>}</div></div>
        {expanded && <div className="quest-detail" id={`quest-detail-${row.id}`}><span>{row.kind === 'total' ? `${row.progress} of ${row.target} ${row.unit} this week` : 'One time this week'}</span>{row.status === 'active' && row.kind === 'total' && <button type="button" className="secondary" aria-label={`Subtract ${row.step} from ${row.title}`} disabled={busy || row.progress === 0} onClick={() => void run(() => repo.tap(row.id, ulid(), -row.step, Date.now()))}>Undo last +{row.step}</button>}</div>}
      </article>;
    })}</div>
    {showForm && <form className="quest-form" onSubmit={add}><label>Quest title<input name="title" maxLength={120} required placeholder="What will you do?" /></label><label>Kind<select value={kind} onChange={event => setKind(event.target.value as 'once' | 'total')}><option value="once">Once</option><option value="total">Total</option></select></label>
      {kind === 'total' && <><label>Target<input name="target" type="number" min="1" max="10000" defaultValue="10" required /></label><label>Unit<input name="unit" maxLength={24} placeholder="pages" required /></label><label>Step<input name="step" type="number" min="1" max="1000" defaultValue="1" required /></label></>}
      <button type="submit" disabled={busy}>Save custom quest</button></form>}
    {message && <p role="status">{message}</p>}
  </section>;
}
