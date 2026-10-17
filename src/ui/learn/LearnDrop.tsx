import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { gradeItem, masteryMapState, type ItemAnswer } from '../../core/learn/engine';
import { dayKey } from '../../core/time';
import { trackWrite } from '../../core/pendingWrites';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { loadEngineFacts, saveDrop, saveEngineAnswer } from '../../data/repos/learn-engine';
import { tapHaptic } from '../../platform/haptics';
import { go } from '../shell/router';
import { catalogFor, chosenTopics, dailyDropId, nightDropId, findItem, makeDrop, selectedTopicKey, topics } from './flow';
import './learn.css';

const currentTime = () => Date.now();

export function LearnDrop({ daily = true, night = false, itemCount, preferredConceptId, practiceTopicId, reviewDue = false, onDone }: { daily?: boolean; night?: boolean; itemCount?: number; preferredConceptId?: string; practiceTopicId?: string; reviewDue?: boolean; onDone?: () => void }) {
  const [now] = useState(currentTime);
  const [busy, setBusy] = useState(false);
  const data = useLiveQuery(async () => ({
    setting: await db.settings.get(selectedTopicKey),
    dailyDrop: await db.learnDrops.get(dailyDropId(now)),
    nightDrop: night ? await db.learnDrops.get(nightDropId(now)) : undefined,
    drops: await db.learnDrops.toArray(),
    concepts: await db.learnConcepts.toArray(),
    items: await db.learnItems.toArray(),
    ledger: await db.ledger.where('kind').anyOf('learn-answer', 'learn-retention').toArray(),
  }), []);
  const [picked, setPicked] = useState<string[]>([]);
  const [practiceId, setPracticeId] = useState<string>();
  const [feedback, setFeedback] = useState<{ cursor: number; correct: boolean; text: string; rule: string; optionId?: string }>();
  const [sequence, setSequence] = useState<string[]>([]);
  const [matchLeft, setMatchLeft] = useState<string>();
  const [pairs, setPairs] = useState<{ left: string; right: string }[]>([]);
  const [message, setMessage] = useState('');
  const writing = useRef(false);
  const starting = useRef(false);
  const ids = chosenTopics(data?.setting?.value);
  const practiceIds = practiceTopicId ? [practiceTopicId] : ids;
  const concepts = catalogFor(topics.map(pack => pack.body.topic.id));
  const row = night ? data?.nightDrop : daily ? data?.dailyDrop : data?.drops.find(candidate => candidate.id === practiceId);
  const drop = row?.drop;
  const step = drop?.items[feedback?.cursor ?? drop.pendingFeedback?.cursor ?? drop.cursor];
  const found = step ? findItem(concepts, step.itemId) : undefined;
  const savedAnswer = drop?.pendingFeedback?.answer;
  const savedOptionId = typeof savedAnswer === 'string' ? savedAnswer : Array.isArray(savedAnswer) ? (typeof savedAnswer.at(-1) === 'string' ? savedAnswer.at(-1) as string : (savedAnswer.at(-1) as { right?: string } | undefined)?.right) : found?.item.options.find(option => Number(option.text.match(/-?\d+(?:[.,]\d+)*/)?.[0]?.replaceAll(',', '')) === savedAnswer)?.id;
  const savedFeedback = drop?.pendingFeedback && found ? { cursor: drop.pendingFeedback.cursor, correct: drop.pendingFeedback.correct,
    text: found.item.options.find(option => option.id === savedOptionId)?.feedback ?? (drop.pendingFeedback.correct ? 'That fits.' : 'Look at the idea again next time.'), rule: found.concept.rule, optionId: savedOptionId } : undefined;
  const visibleFeedback = feedback ?? savedFeedback;
  const feedbackRef = useRef<HTMLDivElement>(null);
  const feedbackKey = visibleFeedback ? visibleFeedback.cursor : -1;
  useEffect(() => {
    // The explanation lands below the options; bring it on screen so nobody has to hunt for it.
    if (feedbackKey < 0) return;
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.dataset.motion !== 'reduce';
    feedbackRef.current?.querySelector('button')?.scrollIntoView?.({ block: 'end', behavior: smooth ? 'smooth' : 'auto' });
  }, [feedbackKey]);

  const start = async (selected: string[], isDaily = daily) => {
    if (starting.current || !data || !selected.length) return;
    starting.current = true;
    setBusy(true);
    try {
      const at = currentTime();
      const deviceId = await getOrCreateDeviceId(db, at);
      if (isDaily && ids.join('|') !== selected.join('|')) {
        await trackWrite(() => db.settings.put({ key: selectedTopicKey, value: selected, updatedAt: at, deleted: 0, deviceId }));
      }
      const today = dayKey(at);
      const answered = data.ledger.filter(fact => !fact.deleted && fact.dayKey === today);
      const { facts } = await loadEngineFacts(db);
      const created = makeDrop({ ids: selected, concepts: data.concepts, items: data.items, now: at, daily: isDaily, night, itemCount, preferredConceptId, reviewDue,
        answeredToday: answered.length, newToday: isDaily ? answered.filter(fact => data.drops.some(row => row.id === fact.inputs.dropId && row.drop.items.some(step => step.itemId === fact.inputs.itemId && step.mode === 'new'))).length : 0,
        spentMinutes: answered.length * 0.7, facts });
      if (isDaily || night) {
        if (!await db.learnDrops.get(created.id)) await saveDrop(db, created, deviceId, at);
      } else {
        await saveDrop(db, created, deviceId, at);
        setPracticeId(created.id);
      }
      setMessage('');
    } catch {
      setMessage('Could not save this drop. Try again.');
    } finally { starting.current = false; setBusy(false); }
  };

  useEffect(() => {
    if (data && practiceIds.length && (night ? !data.nightDrop : daily ? !data.dailyDrop : !practiceId)) queueMicrotask(() => void start(practiceIds));
    // The database query updates after the drop is stored.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.dailyDrop, data?.nightDrop, data?.setting, practiceId]);

  const answer = async (value: ItemAnswer, feedbackId?: string) => {
    if (!drop || !found || !step || writing.current || visibleFeedback) return;
    writing.current = true;
    setBusy(true);
    const grade = gradeItem(found.item, value);
    const option = found.item.options.find(candidate => candidate.id === feedbackId);
    setFeedback({ cursor: drop.cursor, correct: grade.correct, text: option?.feedback ?? (grade.correct ? 'That fits.' : 'Look at the order and try the idea again next time.'), rule: found.concept.rule, optionId: feedbackId });
    if (!night && grade.correct && !matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.dataset.motion !== 'reduce') void tapHaptic(true);
    try {
      const at = currentTime();
      await saveEngineAnswer(db, { answerId: `${drop.id}:${drop.cursor}`, dropId: drop.id, item: found.item,
        answer: value, confidence: 'fairly-sure', deviceId: await getOrCreateDeviceId(db, at), now: at });
    } catch {
      setFeedback(undefined);
      setMessage('Could not save that answer. Tap again.');
    } finally { writing.current = false; setBusy(false); }
  };
  const choose = (id: string) => {
    if (!found || visibleFeedback || writing.current) return;
    const item = found.item;
    if (item.type === 'order') {
      const next = [...sequence, id];
      if (next.length === item.answer.length) void answer(next, id);
      else setSequence(next);
    } else if (item.type === 'match') {
      if (!matchLeft) { setMatchLeft(id); return; }
      const next = [...pairs, { left: matchLeft, right: id }];
      setMatchLeft(undefined);
      if (next.length === item.answer.length) void answer(next, id);
      else setPairs(next);
    } else if (item.type === 'estimate') {
      const text = item.options.find(option => option.id === id)?.text ?? '';
      const number = Number(text.match(/-?\d+(?:[.,]\d+)*/)?.[0]?.replaceAll(',', ''));
      void answer(number, id);
    } else void answer(id, id);
  };
  const nextItem = async () => {
    if (writing.current || !drop) return;
    setBusy(true);
    try {
      const current = await db.learnDrops.get(drop.id);
      if (current?.drop.pendingFeedback) await saveDrop(db, { ...current.drop, pendingFeedback: undefined }, current.deviceId, currentTime());
      setFeedback(undefined); setSequence([]); setPairs([]); setMatchLeft(undefined); setMessage('');
    } catch { setMessage('Could not continue this drop. Try again.'); }
    finally { setBusy(false); }
  };

  if (!data) return <div className="learn-drop" role="status">Opening your drop…</div>;
  if (!topics.length) return <div className="learn-drop"><h2>Learn</h2><p>Topics are unavailable right now.</p></div>;
  if (!practiceIds.length) return <div className="learn-drop learn-pick"><p className="eyebrow">A small start</p><h2>What do you want to get sharp at?</h2><p>Pick one or a few. You can change them later.</p>
    <div className="learn-topic-tiles">{topics.map(pack => <button type="button" key={pack.id} className={`learn-topic-tile ${picked.includes(pack.body.topic.id) ? 'chosen' : ''}`} aria-pressed={picked.includes(pack.body.topic.id)} onClick={() => setPicked(current => current.includes(pack.body.topic.id) ? current.filter(id => id !== pack.body.topic.id) : [...current, pack.body.topic.id])}><strong>{pack.title}</strong><span>{pack.description}</span></button>)}</div>
    <button type="button" disabled={!picked.length || busy} onClick={() => void start(picked)}>Start my first drop</button>{message && <p role="status">{message}</p>}</div>;
  if (!drop) return <div className="learn-drop" role="status">Preparing your drop…{message}</div>;
  if (!step) {
    const touched = [...new Set(drop.items.map(item => item.conceptId))].map(id => concepts.find(concept => concept.id === id)).filter((concept): concept is NonNullable<typeof concept> => !!concept);
    const improved = touched.filter(concept => masteryMapState(data.concepts.find(row => row.id === concept.id)) !== 'Not started');
    const due = touched.map(concept => data.concepts.find(row => row.id === concept.id)?.memory?.dueAt).filter((value): value is number => typeof value === 'number').sort((a, b) => a - b)[0];
    return <div className="learn-drop learn-stop"><span className="pill">A good place to pause</span><h2 className="learn-stop-title">{night ? "That's the night drop" : daily ? "That's today's drop" : "That's your practice drop"}</h2><p>{drop.items.length} questions explored. {daily || night ? 'Come back when the ideas have had time to settle.' : 'Practice is optional. Your daily drop stays finished.'}</p><h3>Concepts touched</h3><div className="learn-chips">{touched.map(concept => <span className="learn-chip" key={concept.id}>{concept.title}</span>)}</div><p>What improved: {improved.length ? improved.map(concept => `${concept.title} is ${masteryMapState(data.concepts.find(row => row.id === concept.id)).toLowerCase()}`).join(', ') : 'you made a first attempt'}.</p><p>Next review: {due ? new Date(due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'check back tomorrow'}.</p><button type="button" onClick={onDone ?? (() => go('you/learn'))}>Continue</button></div>;
  }
  if (!found) return <div className="learn-drop"><h2>Learn</h2><p>This item is unavailable. Open Learn to choose a topic.</p><button type="button" onClick={() => go('you/learn')}>Open Learn</button></div>;
  const { item, concept } = found;
  const ordered = step.optionOrder.map(id => item.options.find(option => option.id === id)).filter((option): option is NonNullable<typeof option> => !!option);
  const used = new Set(item.type === 'order' ? sequence : pairs.map(pair => pair.left));
  return <div className={`learn-drop ${!night && visibleFeedback?.correct ? 'learn-correct' : ''}`}><header className="learn-drop-head">{!daily && !night && <button type="button" className="learn-header-link" onClick={onDone}>← Practice · Leave</button>}<span>{(visibleFeedback?.cursor ?? drop.cursor) + 1} / {drop.items.length}</span></header><div className="learn-progress" aria-hidden="true"><span style={{ width: `${((visibleFeedback?.cursor ?? drop.cursor) / drop.items.length) * 100}%` }} /></div>
    <p className="eyebrow">{concept.title} · {item.type.replaceAll('-', ' ')}</p><h2>{item.stem}</h2>
    {item.type === 'order' && <p className="learn-hint">Tap the steps in order. {sequence.length ? `${sequence.length} placed.` : ''}</p>}
    {item.type === 'match' && <p className="learn-hint">{matchLeft ? 'Now tap its match.' : 'Tap a term, then its match.'} {pairs.length ? `${pairs.length} paired.` : ''}</p>}
    <div className="learn-options">{ordered.map(option => <button type="button" key={option.id} disabled={!!visibleFeedback || used.has(option.id)} className={`ui-list-row ${matchLeft === option.id ? 'selected' : ''} ${visibleFeedback && option.correct ? 'right-option' : ''} ${visibleFeedback && !visibleFeedback.correct && visibleFeedback.optionId === option.id ? 'wrong-option' : ''}`} onClick={() => choose(option.id)}>{option.text}{visibleFeedback && option.correct && <span className="learn-option-check" aria-hidden="true">✓</span>}</button>)}</div>
    {visibleFeedback && <div ref={feedbackRef} className={`learn-feedback ${visibleFeedback.correct ? 'right' : ''}`} role="status"><strong>{visibleFeedback.correct ? 'Exactly.' : 'Good try. Here is the idea.'}</strong><p>{visibleFeedback.text}</p><p className="learn-rule">{visibleFeedback.rule}</p><button type="button" disabled={busy} onClick={() => void nextItem()}>Next</button></div>}
    {message && <p role="status">{message}</p>}{daily && !night && <button type="button" className="learn-open-link" onClick={() => go('you/learn')}>Open Learn</button>}</div>;
}
