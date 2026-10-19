import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { weeklyContentSample, contentReviewKey } from '../../core/learn/contentReview';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { createSettingsRepos } from '../../data/repos/settings';
import { bundledTopicPacks } from '../../data/packs/seed';
import { trackWrite } from '../../core/pendingWrites';
import { RULES } from '../../core/rules.config';
import './contentReview.css';

type Verdict = { verdict: 'right' | 'flag'; note?: string };
const currentTime = () => Date.now();

export function ContentReview() {
  const [openedAt] = useState(currentTime);
  const sample = weeklyContentSample(bundledTopicPacks, openedAt);
  const settings = useLiveQuery(() => db.settings.toArray(), []) ?? [];
  const [flagging, setFlagging] = useState<string>();
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const verdicts = new Map(settings.filter(row => !row.deleted && row.key.startsWith('learn.contentReview:')).map(row => [row.key, row.value as Verdict]));
  const flagged = [...verdicts.values()].filter(row => row?.verdict === 'flag').length;
  async function save(itemId: string, value: Verdict) {
    try {
      const at = currentTime();
      const deviceId = await getOrCreateDeviceId(db, at);
      await trackWrite(() => createSettingsRepos(db, deviceId).settings.put({ key: contentReviewKey(itemId), value }, at));
      setFlagging(undefined); setNote(''); setMessage(value.verdict === 'flag' ? 'Flag saved.' : 'Review saved.');
    } catch { setMessage('Could not save this review. Try again.'); }
  }
  return <section className="screen content-review"><p className="eyebrow">About</p><h1>Review content</h1><p>{flagged} flagged</p><p>Five items from each module stay here for the week.</p>
    {sample.map(row => {
      const verdict = verdicts.get(contentReviewKey(row.item.id));
      return <article className="card content-review-item" key={row.item.id}><p className="eyebrow">{row.topic} · {row.module}</p><h2>{row.item.stem}</h2>
        <ol>{row.item.options.map(option => <li key={option.id}><span>{option.text}{option.correct ? ' ✓' : ''}</span><small>{option.feedback}</small></li>)}</ol>
        <p><strong>Correct answer:</strong> {row.item.options.filter(option => option.correct).map(option => option.text).join(', ') || (row.item.type === 'estimate' ? String(row.item.answer.value) : row.item.type === 'order' ? row.item.answer.join(' → ') : row.item.type === 'match' ? row.item.answer.map(pair => `${pair.left} → ${pair.right}`).join(', ') : '')}</p>
        <p><strong>Source:</strong> {row.sources.map(source => <span key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a> · {source.publisher}, {source.year}</span>)}</p>
        <div className="content-review-actions"><button type="button" className="secondary" onClick={() => void save(row.item.id, { verdict: 'right' })}>Looks right</button><button type="button" className="secondary" onClick={() => { setFlagging(row.item.id); setNote(verdict?.note ?? ''); }}>Flag</button></div>
        {flagging === row.item.id && <div className="content-review-note"><label>What needs a look?<textarea value={note} maxLength={RULES.teachingEngine.contentReviewNoteMaxChars} onChange={event => setNote(event.target.value)} /></label><div className="content-review-actions"><button type="button" disabled={!note.trim()} onClick={() => void save(row.item.id, { verdict: 'flag', note: note.trim() })}>Save flag</button><button type="button" className="secondary" onClick={() => setFlagging(undefined)}>Cancel</button></div></div>}
        {verdict && <p className="small">{verdict.verdict === 'flag' ? `Flagged: ${verdict.note}` : 'Looks right'}</p>}
      </article>;
    })}{message && <p role="status">{message}</p>}
  </section>;
}
