import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { gradeItem, masteryMapState, type Confidence, type ItemAnswer } from '../../core/learn/engine';
import { RULES } from '../../core/rules.config';
import { dayKey, isAfterBedtime } from '../../core/time';
import { trackWrite } from '../../core/pendingWrites';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { loadEngineFacts, saveDrop, saveEngineAnswer } from '../../data/repos/learn-engine';
import { tapHaptic } from '../../platform/haptics';
import { go } from '../shell/router';
import { longestCombo, perfectDrop } from '../../core/economy/gamify';
import { saveGoldReview } from '../../data/repos/gamify';
import { catalogFor, chosenTopics, dailyDropId, nightDropId, findItem, makeDrop, reviewsOnlyRemainder, selectedTopicKey, topics } from './flow';
import { Cast } from '../cast/Cast';
import { dropCast } from '../cast/placement';
import { playCastSound } from '../cast/sound';
import { estimateFeedback, formatEstimate, sliderScale } from '../../core/learn/estimate';
import { askFor } from '../../core/learn/ask';
import { findStep } from '../../core/learn/steps';
import { saveLessonDone } from '../../data/repos/learn-engine';
import { StepLesson, StepVisual, type StepLessonResult } from './StepLesson';
import './learn.css';

const currentTime = () => Date.now();
const motionOn = () => !matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.dataset.motion !== 'reduce';

export function LearnDrop({ daily = true, night = false, itemCount, preferredConceptId, practiceTopicId, reviewDue = false, goldReview = false, onDone }: { daily?: boolean; night?: boolean; itemCount?: number; preferredConceptId?: string; practiceTopicId?: string; reviewDue?: boolean; goldReview?: boolean; onDone?: () => void }) {
  const [now] = useState(currentTime);
  const [busy, setBusy] = useState(false);
  const data = useLiveQuery(async () => ({
    setting: await db.settings.get(selectedTopicKey),
    bedtime: await db.settings.get('planner.bedtime'),
    sound: await db.settings.get('economy.soundOn'),
    dailyDrop: await db.learnDrops.get(dailyDropId(now)),
    nightDrop: night ? await db.learnDrops.get(nightDropId(now)) : undefined,
    drops: await db.learnDrops.toArray(),
    concepts: await db.learnConcepts.toArray(),
    items: await db.learnItems.toArray(),
    ledger: await db.ledger.where('kind').anyOf('learn-answer', 'learn-retention', 'gold-review', 'gold-attempt', 'learn-lesson').toArray(),
  }), []);
  const [picked, setPicked] = useState<string[]>([]);
  const [practiceId, setPracticeId] = useState<string>();
  const [feedback, setFeedback] = useState<{ cursor: number; correct: boolean; text: string; rule: string; optionId?: string }>();
  const [pending, setPending] = useState<{ value: ItemAnswer; optionId?: string }>();
  const [confidence, setConfidence] = useState<Confidence>('fairly-sure');
  const [sequence, setSequence] = useState<string[]>([]);
  const [guess, setGuess] = useState<number>();
  const [matchLeft, setMatchLeft] = useState<string>();
  const [pairs, setPairs] = useState<{ left: string; right: string }[]>([]);
  const [message, setMessage] = useState('');
  const [combo, setCombo] = useState(0);
  const [ideaAgain, setIdeaAgain] = useState(false);
  const writing = useRef(false);
  const starting = useRef(false);
  const ids = chosenTopics(data?.setting?.value);
  const practiceIds = practiceTopicId ? [practiceTopicId] : ids;
  const concepts = catalogFor(topics.map(pack => pack.body.topic.id));
  const row = night ? data?.nightDrop : daily ? data?.dailyDrop : data?.drops.find(candidate => candidate.id === practiceId);
  const drop = row?.drop;
  useEffect(() => {
    if (!row || !data) return;
    const bedtime = typeof data.bedtime?.value === 'string' ? data.bedtime.value : RULES.night.defaultBedtime;
    const trim = () => {
      if (!isAfterBedtime(currentTime(), bedtime)) return;
      const next = reviewsOnlyRemainder(row.drop);
      if (next !== row.drop) void saveDrop(db, next, row.deviceId, currentTime());
    };
    trim();
    const timer = window.setInterval(trim, 30_000);
    return () => window.clearInterval(timer);
  }, [row, data]);
  const step = drop?.items[feedback?.cursor ?? drop.pendingFeedback?.cursor ?? drop.cursor];
  const found = step ? findItem(concepts, step.itemId) : undefined;
  const savedAnswer = drop?.pendingFeedback?.answer;
  const savedOptionId = typeof savedAnswer === 'string' ? savedAnswer : Array.isArray(savedAnswer) ? (typeof savedAnswer.at(-1) === 'string' ? savedAnswer.at(-1) as string : (savedAnswer.at(-1) as { right?: string } | undefined)?.right) : found?.item.options.find(option => Number(option.text.match(/-?\d+(?:[.,]\d+)*/)?.[0]?.replaceAll(',', '')) === savedAnswer)?.id;
  const savedEstimate = found?.item.type === 'estimate' && typeof savedAnswer === 'number' && drop?.pendingFeedback ? estimateFeedback(found.item, savedAnswer, drop.pendingFeedback.correct) : undefined;
  const savedFeedback = drop?.pendingFeedback && found ? { cursor: drop.pendingFeedback.cursor, correct: drop.pendingFeedback.correct,
    text: savedEstimate?.text ?? found.item.options.find(option => option.id === savedOptionId)?.feedback ?? (drop.pendingFeedback.correct ? 'That fits.' : 'Look at the idea again next time.'), rule: found.concept.rule, optionId: savedEstimate ? savedEstimate.optionId : savedOptionId } : undefined;
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
      const answered = data.ledger.filter(fact => !fact.deleted && fact.dayKey === today && fact.kind !== 'learn-lesson');
      const { facts } = await loadEngineFacts(db);
      const created = makeDrop({ ids: selected, concepts: data.concepts, items: data.items, now: at, daily: isDaily, night, itemCount, preferredConceptId, goldReview, reviewDue,
        bedtime: typeof data.bedtime?.value === 'string' ? data.bedtime.value : RULES.night.defaultBedtime,
        answeredToday: answered.length, newToday: isDaily ? answered.filter(fact => data.drops.some(row => row.id === fact.inputs.dropId && row.drop.items.some(step => step.itemId === fact.inputs.itemId && step.mode === 'new'))).length : 0,
        spentMinutes: answered.length * 0.7, facts,
        taughtSteps: data.ledger.filter(fact => fact.kind === 'learn-lesson' && !fact.deleted).map(fact => fact.refId),
        lessonToday: data.ledger.some(fact => fact.kind === 'learn-lesson' && !fact.deleted && fact.dayKey === today) });
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
  }, [data, practiceId]);

  const answer = async (value: ItemAnswer, feedbackId?: string, chosenConfidence: Confidence = confidence) => {
    if (!drop || !found || !step || writing.current || visibleFeedback) return;
    writing.current = true;
    setBusy(true);
    const grade = gradeItem(found.item, value);
    const option = found.item.options.find(candidate => candidate.id === feedbackId);
    const slid = found.item.type === 'estimate' && typeof value === 'number' ? estimateFeedback(found.item, value, grade.correct) : undefined;
    setFeedback({ cursor: drop.cursor, correct: grade.correct, text: slid?.text ?? option?.feedback ?? (grade.correct ? 'That fits.' : 'Look at the order and try the idea again next time.'), rule: found.concept.rule, optionId: slid ? slid.optionId : feedbackId });
    if (!night) {
      if (grade.correct) playCastSound(combo > 0 ? 'combo' : 'correct', data?.sound?.value === true && !data.sound.deleted);
      setCombo(grade.correct ? combo + 1 : 0);
    }
    if (!night && grade.correct && !(daily && drop.cursor === drop.items.length - 1) && !matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.dataset.motion !== 'reduce') void tapHaptic(true);
    try {
      const at = currentTime();
      await saveEngineAnswer(db, { answerId: `${drop.id}:${drop.cursor}`, dropId: drop.id, item: found.item,
        answer: value, confidence: chosenConfidence, deviceId: await getOrCreateDeviceId(db, at), now: at, goldReview });
    } catch {
      setFeedback(undefined);
      setMessage('Could not save that answer. Tap again.');
    } finally { writing.current = false; setBusy(false); }
  };
  const choose = (id: string) => {
    if (!found || visibleFeedback || pending || writing.current) return;
    const item = found.item;
    if (!night && motionOn()) void tapHaptic(true, 8);
    if (item.type === 'order') {
      const next = [...sequence, id];
      if (next.length === item.answer.length) setPending({ value: next, optionId: id });
      else setSequence(next);
    } else if (item.type === 'match') {
      if (!matchLeft) { setMatchLeft(id); return; }
      const next = [...pairs, { left: matchLeft, right: id }];
      setMatchLeft(undefined);
      if (next.length === item.answer.length) setPending({ value: next, optionId: id });
      else setPairs(next);
    } else if (item.type === 'estimate') {
      const text = item.options.find(option => option.id === id)?.text ?? '';
      const number = Number(text.match(/-?\d+(?:[.,]\d+)*/)?.[0]?.replaceAll(',', ''));
      setPending({ value: number, optionId: id });
    } else setPending({ value: id, optionId: id });
  };
  const nextItem = async () => {
    if (writing.current || !drop) return;
    setBusy(true);
    try {
      const current = await db.learnDrops.get(drop.id);
      if (current?.drop.pendingFeedback) await saveDrop(db, { ...current.drop, pendingFeedback: undefined }, current.deviceId, currentTime());
      setFeedback(undefined); setPending(undefined); setGuess(undefined); setConfidence('fairly-sure'); setSequence([]); setPairs([]); setMatchLeft(undefined); setMessage(''); setIdeaAgain(false);
    } catch { setMessage('Could not continue this drop. Try again.'); }
    finally { setBusy(false); }
  };

  // Record the outcome once; a missed review can be tried again on a later day.
  useEffect(() => {
    if (!goldReview || !drop || drop.cursor < drop.items.length || !preferredConceptId || !data) return;
    const answers = data.ledger.filter(row => row.kind === 'learn-answer' && row.inputs.dropId === drop.id);
    if (answers.length !== drop.items.length || data.ledger.some(row => (row.kind === 'gold-review' && row.refId === preferredConceptId) || (row.kind === 'gold-attempt' && row.refId === `${preferredConceptId}:${dayKey(Date.now())}`))) return;
    void saveGoldReview(db, preferredConceptId, answers.filter(row => row.inputs.correct === true).length, answers.length);
  }, [goldReview, drop, preferredConceptId, data]);

  const finishLesson = async (stepId: string, conceptId: string, result: StepLessonResult) => {
    if (!drop || writing.current) return;
    writing.current = true;
    setBusy(true);
    try {
      const at = currentTime();
      const current = (await db.learnDrops.get(drop.id))?.drop ?? drop;
      await saveLessonDone(db, current, { stepId, conceptId, dropId: drop.id, ...result }, await getOrCreateDeviceId(db, at), at);
    } catch { setMessage('Could not save this lesson. Try again.'); }
    finally { writing.current = false; setBusy(false); }
  };

  if (!data) return <div className="learn-drop" role="status">Opening your drop…</div>;
  if (!topics.length) return <div className="learn-drop"><h2>Learn</h2><p>Topics are unavailable right now.</p></div>;
  if (!practiceIds.length && isAfterBedtime(now, typeof data.bedtime?.value === 'string' ? data.bedtime.value : RULES.night.defaultBedtime)) return <div className="learn-drop learn-stop"><span className="pill">A good place to pause</span><h2 className="learn-stop-title">{night ? "That's the night drop" : "That's today's drop"}</h2><p>Nothing to review tonight. Sleep is the best study.</p><button type="button" onClick={onDone ?? (() => go('learn'))}>Continue</button></div>;
  if (!practiceIds.length) return <div className="learn-drop learn-pick"><p className="eyebrow">A small start</p><h2>What do you want to get sharp at?</h2><p>Pick one or a few. You can change them later.</p>
    <div className="learn-topic-tiles">{topics.map(pack => <button type="button" key={pack.id} className={`learn-topic-tile ${picked.includes(pack.body.topic.id) ? 'chosen' : ''}`} aria-pressed={picked.includes(pack.body.topic.id)} onClick={() => setPicked(current => current.includes(pack.body.topic.id) ? current.filter(id => id !== pack.body.topic.id) : [...current, pack.body.topic.id])}><strong>{pack.title}</strong><span>{pack.description}</span></button>)}</div>
    <button type="button" disabled={!picked.length || busy} onClick={() => void start(picked)}>Start my first drop</button>{message && <p role="status">{message}</p>}</div>;
  if (!drop) return <div className="learn-drop" role="status">Preparing your drop…{message}</div>;
  if (!step) {
    const touched = [...new Set(drop.items.map(item => item.conceptId))].map(id => concepts.find(concept => concept.id === id)).filter((concept): concept is NonNullable<typeof concept> => !!concept);
    const improved = touched.filter(concept => masteryMapState(data.concepts.find(row => row.id === concept.id)) !== 'Not started');
    const due = touched.map(concept => data.concepts.find(row => row.id === concept.id)?.memory?.dueAt).filter((value): value is number => typeof value === 'number').sort((a, b) => a - b)[0];
    const questions = drop.items.filter(item => !item.lesson).length;
    const taughtToday = drop.items.map(item => item.lesson && findStep(concepts, item.lesson)).find(Boolean);
    const goldAnswers = data.ledger.filter(fact => fact.kind === 'learn-answer' && fact.inputs.dropId === drop.id);
    const passed = goldAnswers.filter(fact => fact.inputs.correct === true).length >= RULES.gamify.goldReviewPass;
    return <div className="learn-drop learn-stop"><span className="pill">A good place to pause</span><h2 className="learn-stop-title">{night ? "That's the night drop" : daily ? "That's today's drop" : goldReview ? 'Gold review complete' : "That's your practice drop"}</h2>{goldReview ? <p>{passed ? 'Gold is yours. That idea is holding well.' : 'Try again tomorrow.'}</p> : !drop.items.length && isAfterBedtime(currentTime(), typeof data.bedtime?.value === 'string' ? data.bedtime.value : RULES.night.defaultBedtime) ? <p>Nothing to review tonight. Sleep is the best study.</p> : <>{taughtToday && <div className="step-today card"><p className="eyebrow">Today's idea · {taughtToday.step.title}</p><p className="step-takeaway">{taughtToday.step.takeaway}</p><StepVisual visual={taughtToday.step.visual} /></div>}<p>{questions} questions explored. {daily || night ? 'Come back when the ideas have had time to settle.' : 'Practice is optional. Your daily drop stays finished.'}</p>{daily && perfectDrop(data.ledger, drop.id, questions) && <p>Perfect drop · +{RULES.gamify.perfectDropXp} XP</p>}<h3>Concepts touched</h3><div className="learn-chips">{touched.map(concept => <span className="learn-chip" key={concept.id}>{concept.title}</span>)}</div><p>What improved: {improved.length ? improved.map(concept => `${concept.title} is ${masteryMapState(data.concepts.find(row => row.id === concept.id)).toLowerCase()}`).join(', ') : 'you made a first attempt'}.</p><p>Next review: {due ? new Date(due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'check back tomorrow'}.</p></>}<button type="button" onClick={onDone ?? (() => go('learn'))}>Continue</button></div>;
  }
  if (step.lesson) {
    const taught = findStep(concepts, step.lesson);
    if (taught) return <div className="learn-drop learn-lesson"><header className="learn-drop-head">{!daily && !night && <button type="button" className="learn-header-link" onClick={onDone}>← Practice · Leave</button>}<span>New idea</span></header>
      <StepLesson key={step.lesson} step={taught.step} conceptTitle={taught.concept.title} friend={dropCast(false, undefined).name} busy={busy} onDone={result => void finishLesson(taught.step.id, taught.concept.id, result)} />
      {message && <p role="status">{message}</p>}</div>;
  }
  if (!found) return <div className="learn-drop"><h2>Learn</h2><p>This item is unavailable. Open Learn to choose a topic.</p><button type="button" onClick={() => go('learn')}>Open Learn</button></div>;
  const { item, concept } = found;
  const itemStep = item.step ? findStep([concept], item.step) : undefined;
  const ordered = step.optionOrder.map(id => item.options.find(option => option.id === id)).filter((option): option is NonNullable<typeof option> => !!option);
  const used = new Set(item.type === 'order' ? sequence : pairs.map(pair => pair.left));
  const inARow = longestCombo(data.ledger, drop.id);
  const position = visibleFeedback?.cursor ?? drop.cursor;
  // The bar moves forward after every answer, right or not (spec 13 D: a miss never moves it back).
  const filled = ((visibleFeedback ? position + 1 : position) / drop.items.length) * 100;
  const friend = dropCast(step.mode === 'review' || reviewDue, visibleFeedback?.correct).name;
  const pose = visibleFeedback ? (visibleFeedback.correct ? 'cheer' : 'think') : 'idle';
  return <div className={`learn-drop${night ? ' learn-night' : ''}${!night && visibleFeedback?.correct ? ' learn-correct' : ''}`}><header className="learn-drop-head">{!daily && !night && <button type="button" className="learn-header-link" onClick={onDone}>← Practice · Leave</button>}<span>{position + 1} / {drop.items.length}</span>{inARow >= 3 && <span className="pill learn-streak-pill" key={inARow}>{inARow} in a row</span>}</header><div className={`learn-progress${!night && combo >= 3 ? ' hot' : ''}`} aria-hidden="true"><span style={{ width: `${filled}%` }} /></div>
    <div className="learn-q" key={position}>
    <div className={`learn-ask-row${pending && !visibleFeedback ? ' leaning' : ''}`}><span className="learn-friend"><Cast name={friend} pose={pose} size={72} title={`${friend} ${pose === 'cheer' ? 'cheering' : pose === 'think' ? 'thinking' : 'watching'}`} /></span><div className="learn-ask-bubble"><p className="eyebrow">{concept.title}</p><p className="learn-ask">{askFor(item.type)}</p></div></div><h2>{item.stem}</h2>
    {!goldReview && item.type === 'order' && <p className="learn-hint">Tap the steps in order. {sequence.length ? `${sequence.length} placed.` : ''}</p>}
    {!goldReview && item.type === 'match' && <p className="learn-hint">{matchLeft ? 'Now tap its match.' : 'Tap a term, then its match.'} {pairs.length ? `${pairs.length} paired.` : ''}</p>}
    {item.type === 'estimate' ? (() => {
      const scale = sliderScale(item), unit = item.answer.unit;
      const shown = typeof savedAnswer === 'number' && visibleFeedback ? savedAnswer : guess ?? scale.start;
      const set = (next: number) => { if (visibleFeedback || writing.current) return; const value = Math.min(scale.hi, Math.max(scale.lo, Number(next.toFixed(6)))); setGuess(value); setPending({ value, optionId: 'slider' }); };
      return <div className={`learn-estimate${visibleFeedback ? (visibleFeedback.correct ? ' right' : ' missed') : ''}`}>
        {!goldReview && !visibleFeedback && <p className="learn-hint">Drag to your best guess, then check.</p>}
        <output className="learn-estimate-value" aria-live="polite">{formatEstimate(shown, unit)}</output>
        <div className="learn-estimate-row"><button type="button" className="secondary" aria-label="A little less" disabled={!!visibleFeedback || shown <= scale.lo} onClick={() => set(shown - scale.step)}>−</button>
          <input type="range" min={scale.lo} max={scale.hi} step={scale.step} value={shown} aria-label="Your guess" aria-valuetext={formatEstimate(shown, unit)} disabled={!!visibleFeedback} onChange={event => set(Number(event.target.value))} />
          <button type="button" className="secondary" aria-label="A little more" disabled={!!visibleFeedback || shown >= scale.hi} onClick={() => set(shown + scale.step)}>+</button></div>
        <div className="learn-estimate-scale" aria-hidden="true"><span>{formatEstimate(scale.lo, unit)}</span><span>{formatEstimate(scale.hi, unit)}</span></div>
        {visibleFeedback && <p className="learn-estimate-answer">Answer: {formatEstimate(item.answer.value, unit)}</p>}
      </div>;
    })() : <div className="learn-options">{ordered.map(option => <button type="button" key={option.id} disabled={!!visibleFeedback || !!pending || used.has(option.id)} className={`ui-list-row ${matchLeft === option.id || pending?.optionId === option.id ? 'selected' : ''} ${visibleFeedback && option.correct ? 'right-option' : ''} ${visibleFeedback && !visibleFeedback.correct && visibleFeedback.optionId === option.id ? 'wrong-option' : ''}`} onClick={() => choose(option.id)}>{option.text}{visibleFeedback && option.correct && <span className="learn-option-check" aria-hidden="true">✓</span>}</button>)}</div>}
    </div>
    {/* Spec 13 L: one question per question. A new idea records fairly sure; a review folds "how sure?" into Check itself (one tap),
        because "do I still know this?" is the real question there. Gold review keeps the three chips. */}
    {pending && !visibleFeedback && <div className="learn-confidence learn-check">{goldReview && <><p>How sure are you?</p><div className="learn-confidence-chips" role="group" aria-label="Confidence">{([['certain', 'Sure'], ['fairly-sure', 'Fairly sure'], ['guess', 'Guessing']] as const).map(([value, label]) => <button type="button" key={value} className="secondary" aria-pressed={confidence === value} disabled={busy} onClick={() => { setConfidence(value); void answer(pending.value, pending.optionId, value); }}>{label}</button>)}</div></>}
      {!goldReview && step.mode !== 'new' ? <div className="learn-check-pair"><button type="button" disabled={busy} onClick={() => void answer(pending.value, pending.optionId, 'certain')}>Check · I'm sure</button><button type="button" className="secondary" disabled={busy} onClick={() => void answer(pending.value, pending.optionId, 'guess')}>Check · Guessing</button></div>
        : <button type="button" disabled={busy} onClick={() => void answer(pending.value, pending.optionId)}>Check</button>}</div>}
    {visibleFeedback && <div ref={feedbackRef} className={`learn-feedback learn-sheet ${visibleFeedback.correct ? 'right' : 'idea'}`} role="status"><strong className="learn-sheet-title">{visibleFeedback.correct ? 'Exactly.' : goldReview ? 'Keep going.' : 'Good try. Here is the idea.'}</strong>{!goldReview && <><p>{visibleFeedback.text}</p>{itemStep ? (!visibleFeedback.correct && (ideaAgain ? <div className="step-again"><p className="step-teach-text">{itemStep.step.teach}</p><StepVisual visual={itemStep.step.visual} /></div> : <button type="button" className="text-button step-again-button" onClick={() => setIdeaAgain(true)}>See the idea again</button>)) : <p className="learn-rule">{visibleFeedback.rule}</p>}</>}<button type="button" disabled={busy} onClick={() => void nextItem()}>Next</button></div>}
    {message && <p role="status">{message}</p>}{daily && !night && <button type="button" className="learn-open-link" onClick={() => go('learn')}>Open Learn</button>}</div>;
}
