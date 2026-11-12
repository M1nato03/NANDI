import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import pack from '../../../content/quests660/board.json';
import { db } from '../../data/db';
import { dayKey } from '../../core/time/dayKey';
import { softToday } from '../../core/soft/soft';
import {
  boardFor, LEARNED, OUTCOMES, PREDICTIONS, QUEST_KIND, QUEST_MINUTES, QUEST_MODE, QUEST_WHERE, questJarMinutes, questStones, readSafety, realityCheck, realityLine,
  SAFETY_ASKED_KEY, swappedOn, type BoardFilter, type BoardPack, type BoardQuest, type Learned, type Outcome, type Prediction, type QuestMinutes, type QuestSafety, type QuestWhere,
} from '../../core/quests660/quests';
import { questMeta, questRowLine } from '../../core/quests660/row';
import { acceptQuest, addQuestPhoto, deleteAllQuestPhotos, deleteQuestPhoto, finishQuest, fitWithin, ownQuests, questPhotoUsage, saveSafety, skipQuest, swapQuest, writeOwnQuest } from '../../data/repos/quests660';
import { QUEST_PHOTOS_LINE } from '../../data/backup';
import { Cast } from '../cast/Cast';
import { HomeCardRow } from '../courtyard/HomeCard';
import { go } from '../shell/router';
import { recordError } from '../errorRing';
import './quests.css';

const PACK = pack as BoardPack;
const fail = (reason: unknown) => recordError('promise', reason);
const WHERE_WORD: Record<QuestWhere, string> = { home: 'Home', travel: 'On the way', outside: 'Outside' };
const TRACK_NAME = { courage: 'Courage', speak: 'Speak' } as const;

/** Every quest the board can open: the pack's, then the person's own. */
export function findQuest(id: string, facts: readonly import('../../data/types').LedgerRow[]): BoardQuest | undefined {
  return PACK.quests.find(quest => quest.id === id) ?? ownQuests(facts).find(quest => quest.id === id);
}

/** The board's data, live: today's 3 (after safety, a soft day, swaps and the filter), what is done today, the stones. */
export function useQuestBoard(filter: BoardFilter = {}) {
  const source = useLiveQuery(async () => {
    const today = dayKey(Date.now());
    return { today, facts: await db.ledger.where('mode').equals(QUEST_MODE).toArray(), todays: await db.ledger.where('dayKey').equals(today).toArray(), settings: await db.settings.toArray() };
  }, []);
  return useMemo(() => {
    if (!source) return undefined;
    const { today, facts, todays, settings } = source;
    const safety = readSafety(settings);
    const soft = softToday(todays, today).state !== null;
    const live = facts.filter(row => !row.deleted);
    const board = boardFor({ day: today, quests: PACK.quests, safety, soft, swapped: swappedOn(live, today), filter });
    const doneToday = new Set(live.filter(row => row.kind === QUEST_KIND.done && row.dayKey === today).map(row => row.refId));
    const asked = settings.some(row => row.key === SAFETY_ASKED_KEY && !row.deleted && row.value === true);
    return { today, facts: live, safety, soft, board, doneToday, asked, own: ownQuests(live), stones: questStones(live), check: realityCheck(live) };
  }, [source, filter.minutes, filter.where]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** The collapsed courtyard row: "Chiku has a quest · 5 min", and one tap opens the quest card. */
export function QuestRow({ quest }: { quest: BoardQuest }) {
  const words = questRowLine(quest);
  return <HomeCardRow row={{ friend: quest.friend, line: words.line, meta: words.meta, kind: 'quest', onOpen: () => go(`courtyard/quest/${quest.id}`) }} />;
}

/** Jenil's approved labels (decisions 4 Nov :227), word for word, in the question and in Settings › Quests alike. */
export const SAFETY_LABELS: readonly (readonly [keyof QuestSafety, string])[] = [
  ['strangers', 'Talking to people I don’t know'],
  ['transit', 'Quests on buses, trains or metro'],
  ['afterDark', 'Going out after dark'],
];

/** "12 Nov": the app's short date, never the stored ISO key. */
const shortDay = (key: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${key}T12:00:00`));

/**
 * The safety question, the first time Quests opens (Jenil 8 Nov, wording approved as drafted; all three off). It sits in
 * the board itself, in place of today's list until answered, so it never covers the rest of the card's sheet. E12 (b2
 * 12 Nov): when the sheet shows it, the sheet scrolls to it, so the question, the 3 boxes and Save / Not now fit one
 * screen at 100%; at large text only its middle scrolls and Save / Not now stay pinned at the sheet's foot.
 */
export function SafetyAsk() {
  const [picked, setPicked] = useState<QuestSafety>({ strangers: false, transit: false, afterDark: false });
  const node = useRef<HTMLElement>(null);
  useEffect(() => {
    const own = node.current;
    if (!own || typeof ResizeObserver === 'undefined') return;
    // The board is drawn while the card is still closed (hidden): scroll once it is laid out, i.e. the sheet opened.
    let done = false;
    const observer = new ResizeObserver(() => {
      if (done || !own.offsetHeight) return;
      done = true;
      own.scrollIntoView({ block: 'start', behavior: 'auto' });
      observer.disconnect();
    });
    observer.observe(own);
    return () => observer.disconnect();
  }, []);
  const finish = async (safety: QuestSafety) => { try { await saveSafety(db, safety); } catch (error) { fail(error); } };
  return <section ref={node} className="quest-safety" aria-labelledby="quest-safety-title" data-testid="quest-safety">
    <h3 id="quest-safety-title">Which quests are OK for you?</h3>
    <p>Some quests ask you to talk to people you don't know, travel somewhere, or go out after dark. Pick what suits you. You can change this any time.</p>
    {SAFETY_LABELS.map(([key, label]) => <label key={key} className="quest-safety-row"><input type="checkbox" checked={picked[key]} onChange={event => setPicked({ ...picked, [key]: event.target.checked })} /><span>{label}</span></label>)}
    <div className="quest-safety-actions"><button type="button" onClick={() => void finish(picked)}>Save</button><button type="button" className="secondary" onClick={() => void finish({ strangers: false, transit: false, afterDark: false })}>Not now</button></div>
  </section>;
}

function QuestCardRow({ quest, done, onSwap }: { quest: BoardQuest; done: boolean; onSwap: () => void }) {
  return <li className={`quest-card${done ? ' is-done' : ''}`} data-quest={quest.id}>
    <span className="quest-card-friend" aria-hidden="true"><Cast name={quest.friend} pose="idle" size={36} /></span>
    <span className="quest-card-text"><strong>{quest.text.en}</strong><span className="quest-card-meta">{quest.friend} · {questMeta(quest)}{done ? ' · Done today' : ''}</span></span>
    <span className="quest-card-moves">
      {!done && <button type="button" className="quest-start" aria-label={`Start: ${quest.text.en}`} onClick={() => go(`courtyard/quest/${quest.id}`)}>Start</button>}
      {!done && <button type="button" className="text-button quest-swap" aria-label={`Swap: ${quest.text.en}`} onClick={onSwap}>Swap</button>}
    </span>
  </li>;
}

/** "Write your own": a few words, a time and a place (≤ 80 characters), kept as the person's quest. */
function WriteOwn() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [minutes, setMinutes] = useState<QuestMinutes>(15);
  const [where, setWhere] = useState<QuestWhere>('home');
  if (!open) return <button type="button" className="text-button quest-own-open" onClick={() => setOpen(true)}>Write your own</button>;
  return <form className="quest-own" onSubmit={event => { event.preventDefault(); if (!text.trim()) return; void writeOwnQuest(db, { text, minutes, where }).then(fact => go(`courtyard/quest/${fact.id}`)).catch(fail); }}>
    <label className="field-label" htmlFor="quest-own-text">Your quest</label>
    <input id="quest-own-text" maxLength={80} value={text} onChange={event => setText(event.target.value)} placeholder="One thing, off the screen" />
    <div className="quest-chips" role="group" aria-label="How long">{QUEST_MINUTES.map(n => <button type="button" key={n} className="ui-chip" aria-pressed={minutes === n} onClick={() => setMinutes(n)}>{n}&nbsp;min</button>)}</div>
    <div className="quest-chips" role="group" aria-label="Where">{QUEST_WHERE.map(place => <button type="button" key={place} className="ui-chip" aria-pressed={where === place} onClick={() => setWhere(place)}>{WHERE_WORD[place]}</button>)}</div>
    <div className="quest-own-moves"><button type="submit" disabled={!text.trim()}>Add and start</button><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancel</button></div>
  </form>;
}

/** The tracks: the next step of each chain (the lowest step not done yet). */
function Tracks({ facts }: { facts: readonly import('../../data/types').LedgerRow[] }) {
  const done = new Set(facts.filter(row => row.kind === QUEST_KIND.done && row.inputs.outcome !== 'not-done').map(row => row.refId));
  return <div className="quest-tracks"><h3>Tracks</h3><ul>{(['courage', 'speak'] as const).map(track => {
    const steps = PACK.quests.filter(quest => quest.track === track);
    const next = steps.find(quest => !done.has(quest.id));
    const count = steps.filter(quest => done.has(quest.id)).length;
    return <li key={track}>
      <button type="button" className="quest-track" disabled={!next} onClick={() => next && go(`courtyard/quest/${next.id}`)}>
        <strong>{TRACK_NAME[track]}</strong><span>{next ? `Step ${next.step} of ${steps.length}: ${next.text.en}` : `All ${steps.length} steps done`}</span><em>{count}/{steps.length}</em>
      </button>
    </li>;
  })}</ul></div>;
}

/**
 * Spec 660 §2.2: the Quests board, in the courtyard card's sheet only (E11): today's 3 from 3 friends, the time filter,
 * swap one, write your own, the tracks and the way to the Reality Check. The safety question shows the first time.
 */
export function QuestBoard({ initialMinutes }: { initialMinutes?: QuestMinutes }) {
  const [minutes, setMinutes] = useState<QuestMinutes | undefined>(initialMinutes);
  const [where, setWhere] = useState<QuestWhere | undefined>();
  const data = useQuestBoard({ minutes, where });
  if (!data) return <section className="quest-board" data-testid="quest-board" aria-busy="true" />;
  const filtered = minutes !== undefined || where !== undefined;
  return <section className="quest-board" data-testid="quest-board" aria-labelledby="quest-board-title">
    <h2 id="quest-board-title">Quests</h2>
    <p className="small">Off the screen, in the next minute. Skip any, at no cost.</p>
    {!data.asked ? <SafetyAsk /> : <>
    <div className="quest-filter">
      <div className="quest-chips" role="group" aria-label="Time">{QUEST_MINUTES.map(n => <button type="button" key={n} className="ui-chip" aria-pressed={minutes === n} onClick={() => setMinutes(minutes === n ? undefined : n)}>{n}&nbsp;min</button>)}</div>
      <div className="quest-chips" role="group" aria-label="Where">{QUEST_WHERE.map(place => <button type="button" key={place} className="ui-chip" aria-pressed={where === place} onClick={() => setWhere(where === place ? undefined : place)}>{WHERE_WORD[place]}</button>)}</div>
    </div>
    {data.board.length ? <ul className="quest-list">{data.board.map(quest => <QuestCardRow key={quest.id} quest={quest} done={data.doneToday.has(quest.id)} onSwap={() => void swapQuest(db, quest.id).catch(fail)} />)}</ul>
      : <p className="quest-empty">{filtered ? 'Nothing fits that filter today. Try another time or place.' : 'That’s today’s quests. New ones tomorrow.'}</p>}
    <WriteOwn />
    {data.own.length > 0 && <ul className="quest-list quest-own-list">{data.own.slice(0, 3).map(quest => <QuestCardRow key={quest.id} quest={quest} done={data.doneToday.has(quest.id)} onSwap={() => void skipQuest(db, quest.id).catch(fail)} />)}</ul>}
    <Tracks facts={data.facts} />
    <button type="button" className="text-button quest-history-link" data-testid="quest-history-link" onClick={() => go('you/quests')}>
      {data.check ? 'Your Reality Check' : `Your quests${data.stones.length ? ` · ${data.stones.length} ${data.stones.length === 1 ? 'stone' : 'stones'}` : ''}`}
    </button>
    </>}
  </section>;
}

type Step = 'card' | 'before' | 'doing' | 'after' | 'finish';

/** Shrinks a photo on the phone (a canvas, no library) to a 1280 px long edge as a ~0.8 JPEG. */
async function shrinkPhoto(file: File): Promise<{ blob: Blob; w: number; h: number }> {
  const bitmap = await createImageBitmap(file);
  const { w, h } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(out => out ? resolve(out) : reject(new Error('The photo could not be read.')), 'image/jpeg', 0.8));
  return { blob, w, h };
}

function Scale({ label, value, onChange, low, high }: { label: string; value?: number; onChange: (n: number) => void; low: string; high: string }) {
  return <fieldset className="quest-scale"><legend>{label}</legend>
    <div className="quest-scale-row">{[1, 2, 3, 4, 5].map(n => <button type="button" key={n} className="ui-chip" aria-pressed={value === n} onClick={() => onChange(n)}>{n}</button>)}</div>
    <p className="quest-scale-ends"><span>{low}</span><span>{high}</span></p>
  </fieldset>;
}

/**
 * Brings a question just above the pinned footer (measured, not a fixed margin: the footer and the tab bar grow with
 * large text, a9 12 Nov). If it is taller than the room, its top comes into view instead. Instant under reduced motion.
 */
function bringAboveFooter(node: HTMLElement | null) {
  if (!node) return;
  const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const box = node.getBoundingClientRect();
  const limit = (node.closest('.quest-screen')?.querySelector('.quest-actions')?.getBoundingClientRect().top ?? window.innerHeight) - 8;
  const by = box.bottom > limit ? Math.min(box.bottom - limit, box.top - 8) : box.top < 0 ? box.top - 8 : 0;
  if (by) window.scrollBy({ top: by, behavior });
}

/** The pinned footer: the step's one move (and its quiet second), always in view; only the middle scrolls. */
const Actions = ({ children }: { children: ReactNode }) => <div className="quest-actions">{children}</div>;

/**
 * Spec 660 §2.3: one quest, start to finish. Card → (Courage/Speak: fear 1-5 + one prediction) → do it (optional timer;
 * the app can close) → what actually happened (+ "what I learned" if it went badly, an optional line) → the finish line.
 */
export function QuestScreen({ questId }: { questId: string }) {
  const data = useQuestBoard();
  const quest = data ? findQuest(questId, data.facts) : undefined;
  const [step, setStep] = useState<Step>('card');
  const [fear, setFear] = useState<number>();
  const [prediction, setPrediction] = useState<Prediction>();
  const [outcome, setOutcome] = useState<Outcome>();
  const [felt, setFelt] = useState<number>();
  // b2/a9 12 Nov: when an outcome opens the "How did it actually feel?" scale, bring it into view (Save waits on it).
  const feltRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!outcome || outcome === 'not-done' || felt !== undefined) return;
    bringAboveFooter(feltRef.current);
  }, [outcome]); // eslint-disable-line react-hooks/exhaustive-deps
  // b2 12 Nov (06 at 200%): on the prediction step, the first question not answered yet comes into view the same way.
  const fearRef = useRef<HTMLDivElement>(null);
  const predictionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (step !== 'before') return;
    bringAboveFooter(!fear ? fearRef.current : !prediction ? predictionRef.current : null);
  }, [step, fear]); // eslint-disable-line react-hooks/exhaustive-deps
  const [learned, setLearned] = useState<Learned>();
  const [line, setLine] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoNote, setPhotoNote] = useState('');
  const [startedAt, setStartedAt] = useState<number>();
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (step !== 'doing' || startedAt === undefined) return; const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, [step, startedAt]);
  if (!data) return <section className="screen quest-screen" aria-busy="true" />;
  if (!quest) return <section className="screen quest-screen"><h1>Quest not found</h1><p>It may have been a quest of your own you deleted.</p><button type="button" onClick={() => go('courtyard')}>Back to the courtyard</button></section>;
  const doneToday = data.doneToday.has(quest.id);
  const head = <><p className="eyebrow">{quest.track ? `${TRACK_NAME[quest.track]} · step ${quest.step}` : `${quest.friend}’s quest`}</p>
    <div className="quest-hero"><Cast name={quest.friend} pose="idle" size={64} /><div><h1>{quest.text.en}</h1><p className="quest-hinglish" lang="hi-Latn">{quest.text.hinglish}</p></div></div>
    <p className="quest-meta">{questMeta(quest)}</p></>;
  const start = async () => {
    try { await acceptQuest(db, quest, 'board'); } catch (cause) { fail(cause); }
    setStep(quest.predicts ? 'before' : 'doing');
  };
  const finish = async () => {
    if (!outcome) return;
    setBusy(true); setError('');
    try {
      const fact = await finishQuest(db, quest, { outcome, ...(quest.predicts ? { fear, prediction, felt } : {}), ...(outcome === 'happened' && learned ? { learned } : {}), line });
      if (photo && outcome !== 'not-done') {
        try { const added = await addQuestPhoto(db, fact.id, await shrinkPhoto(photo)); setPhotoNote(added.ok ? 'Photo kept on this phone.' : added.reason); }
        catch (cause) { fail(cause); setPhotoNote('The photo could not be kept. The quest is saved.'); }
      }
      setStep('finish');
    } catch (cause) { fail(cause); setError('That didn’t save. Try again.'); }
    setBusy(false);
  };
  let body: ReactNode, moves: ReactNode;
  if (step === 'card') {
    body = <>{doneToday && <p className="quest-note" role="status">Done today. You can do it again; it counts once.</p>}
      <p className="small">Do it off the screen. NANDI can close while you do.</p>
      {/* b2 12 Nov: before it is done, what it can add; after, the toast says what really went in. */}
      <p className="small quest-jar-note">Adds up to {questJarMinutes(quest.minutes)}&nbsp;min to the jar.</p></>;
    moves = <><button type="button" className="quest-go" onClick={() => void start()}>Start</button>
      <button type="button" className="secondary" onClick={() => { void skipQuest(db, quest.id).catch(fail); go('courtyard'); }}>Skip, no cost</button></>;
  } else if (step === 'before') {
    body = <><div ref={fearRef} className="quest-ask"><Scale label="How scary does it feel?" value={fear} onChange={setFear} low="Not at all" high="Very" /></div>
      <div ref={predictionRef} className="quest-ask"><fieldset className="quest-prediction"><legend>What do you think will happen?</legend><div className="quest-chips">
        {PREDICTIONS.map(p => <button type="button" key={p.id} className="ui-chip" aria-pressed={prediction === p.id} onClick={() => setPrediction(p.id)}>{p.label}</button>)}
      </div></fieldset></div></>;
    // A disabled "Go do it" says what it waits for (the d2eca41 pattern).
    const waiting = !fear ? 'Pick how scary it feels' : !prediction ? 'Pick what you think will happen' : '';
    moves = <>{waiting && <span className="quest-why small" data-testid="quest-why">{waiting}</span>}<button type="button" className="quest-go" disabled={!!waiting} onClick={() => setStep('doing')}>Go do it</button></>;
  } else if (step === 'doing') {
    const seconds = startedAt === undefined ? 0 : Math.floor((now - startedAt) / 1000);
    body = <><p className="quest-doing">Go. Come back when it's done.</p>
      {startedAt === undefined ? <button type="button" className="secondary quest-timer-start" onClick={() => { setStartedAt(Date.now()); setNow(Date.now()); }}>Start a {quest.minutes}-minute timer</button>
        : <p className="quest-timer" role="timer" aria-live="off">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} of {quest.minutes}:00</p>}</>;
    moves = <><button type="button" className="quest-go" onClick={() => setStep('after')}>I'm back</button></>;
  } else if (step === 'after') {
    body = <><fieldset className="quest-outcome"><legend>What actually happened?</legend><div className="quest-chips">
      {OUTCOMES.map(o => <button type="button" key={o.id} className="ui-chip" aria-pressed={outcome === o.id} onClick={() => setOutcome(o.id)}>{o.label}</button>)}
    </div></fieldset>
      {outcome === 'happened' && <fieldset className="quest-learned"><legend>What did you learn?</legend><div className="quest-chips">
        {LEARNED.map(l => <button type="button" key={l.id} className="ui-chip" aria-pressed={learned === l.id} onClick={() => setLearned(l.id)}>{l.label}</button>)}
      </div></fieldset>}
      {quest.predicts && outcome && outcome !== 'not-done' && <div ref={feltRef} className="quest-felt"><Scale label="How did it actually feel?" value={felt} onChange={setFelt} low="Easy" high="Very hard" /></div>}
      {outcome && outcome !== 'not-done' && <><label className="field-label" htmlFor="quest-line">A line for yourself (optional, kept on this phone)</label>
        <input id="quest-line" maxLength={140} value={line} onChange={event => setLine(event.target.value)} />
        <label className="quest-photo-pick"><span>{photo ? 'Photo added' : 'Add a photo (optional)'}</span><input type="file" accept="image/*" onChange={event => setPhoto(event.target.files?.[0] ?? null)} /></label>
        <p className="small">{QUEST_PHOTOS_LINE}</p></>}
      {error && <p className="quest-error" role="alert">{error}</p>}</>;
    // A disabled Save says what it waits for (never a dead button with no reason).
    const waiting = !outcome ? 'Pick what happened' : quest.predicts && outcome !== 'not-done' && !felt ? 'Pick how it felt' : '';
    moves = <>{waiting && <span className="quest-why small" data-testid="quest-why">{waiting}</span>}<button type="button" className="quest-go" disabled={!!waiting || busy} onClick={() => void finish()}>{busy ? 'Saving…' : 'Save'}</button></>;
  } else {
    const kept = outcome !== 'not-done';
    body = <div className="quest-finish" role="status">
      {kept ? <p className="quest-finish-line"><strong>Quest done.</strong> A stone for your path.</p>
        : <p className="quest-finish-line">No stone this time, and nothing lost. It'll be here.</p>}
      {photoNote && <p className="small">{photoNote}</p>}
    </div>;
    moves = <><button type="button" className="quest-go" onClick={() => go('courtyard')}>Back to the courtyard</button></>;
  }
  return <section className="screen quest-screen" data-step={step} data-testid="quest-screen">
    {head}{body}
    <Actions>{moves}</Actions>
  </section>;
}

/** You › your quests: the Reality Check (after 3 predicted quests), the stones, and the quests you finished. */
export function YouQuests() {
  const data = useQuestBoard();
  if (!data) return <section className="screen you-quests" aria-busy="true" />;
  const finished = data.facts.filter(row => row.kind === QUEST_KIND.done).sort((a, b) => b.dayKey.localeCompare(a.dayKey) || b.updatedAt - a.updatedAt);
  return <section className="screen you-quests"><p className="eyebrow">You</p><h1>Your quests</h1>
    {data.check ? <section className="card reality-check" data-testid="reality-check" aria-labelledby="reality-title">
      <h2 id="reality-title">Reality Check</h2>
      <p className="reality-line">{realityLine(data.check)}</p>
      {data.check.fearBefore !== null && data.check.feltAfter !== null && <p className="reality-fear">Your fear before: <strong>{data.check.fearBefore}/5</strong>. How it actually felt: <strong>{data.check.feltAfter}/5</strong>.</p>}
      <ul className="reality-list">{data.check.predictions.map(p => <li key={p.id}><span>{p.label}</span><span>predicted {p.made}, happened {p.happened}</span></li>)}</ul>
      <p className="small">From {data.check.quests} courage and speak quests. Misses stay in.</p>
    </section> : <section className="card"><h2>Reality Check</h2><p>After 3 Courage or Speak quests, this shows how often your fear came true.</p></section>}
    <p className="quest-stones-count">{data.stones.length} {data.stones.length === 1 ? 'stone' : 'stones'} on your path</p>
    {finished.length > 0 && <ul className="quest-done-list">{finished.slice(0, 30).map(row => {
      const quest = findQuest(row.refId, data.facts);
      return <li key={row.id}><strong>{quest?.text.en ?? 'A quest'}</strong><span>{shortDay(row.dayKey)}{row.inputs.outcome === 'not-done' ? ' · not this time' : ''}</span>{typeof row.inputs.line === 'string' && <em>{row.inputs.line}</em>}</li>;
    })}</ul>}
    <button type="button" className="card you-link" onClick={() => go('you/quests/settings')}><strong>Quest settings</strong><span>Which quests are OK for you, and photos</span></button>
  </section>;
}

/** Settings › Quests: the three switches (each with its plain line), all off on a fresh install. */
export function QuestSettings() {
  const data = useQuestBoard();
  // The switch moves at the tap; the saved setting follows (a live query is a tick behind).
  const [shown, setShown] = useState<QuestSafety | null>(null);
  if (!data) return <section className="screen quest-settings" aria-busy="true" />;
  const safety = shown ?? data.safety;
  const toggle = (key: keyof QuestSafety) => { const next = { ...safety, [key]: !safety[key] }; setShown(next); void saveSafety(db, next).catch(fail); };
  const row = (key: keyof QuestSafety, label: string) => <label key={key} className="toggle-row quest-switch"><span>{label}</span><input type="checkbox" checked={safety[key]} onChange={() => toggle(key)} /></label>;
  return <section className="screen quest-settings calm-screen" data-testid="quest-settings"><p className="eyebrow">Settings</p><h1>Quests</h1>
    <section className="card"><h2>Which quests are OK for you?</h2>
      {SAFETY_LABELS.map(([key, label]) => row(key, label))}
    </section>
    <QuestPhotos />
  </section>;
}

/** Settings › Quests: the photos kept on this phone, oldest first, to clear space (200 MB in all). */
function QuestPhotos() {
  const usage = useLiveQuery(() => questPhotoUsage(db), []);
  if (!usage) return null;
  const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}\u00a0MB`;
  return <section className="card quest-photos"><h2>Quest photos</h2>
    <p className="small">{QUEST_PHOTOS_LINE}</p>
    <p>{usage.count ? `${usage.count} ${usage.count === 1 ? 'photo' : 'photos'} · ${mb(usage.bytes)} of 200\u00a0MB` : 'No quest photos yet.'}</p>
    {usage.count > 0 && <ul className="quest-photo-list">{usage.oldest.slice(0, 20).map(row => <li key={row.id}><span>{dayKey(row.takenAt)} · {mb(row.bytes)}</span><button type="button" className="text-button" onClick={() => void deleteQuestPhoto(db, row.id).catch(fail)}>Delete</button></li>)}</ul>}
    {usage.count > 0 && <button type="button" className="secondary" onClick={() => void deleteAllQuestPhotos(db).catch(fail)}>Delete all quest photos</button>}
  </section>;
}

/**
 * Spec 660 §2.1: Plan's two links. A quest taken on today shows with a quest tag (one tap reopens it), and "+ quest"
 * opens the courtyard's Quests. Plan's weekly side quests are untouched.
 */
export function PlanQuests() {
  const data = useQuestBoard();
  if (!data) return null;
  const accepted = [...new Set(data.facts.filter(row => row.kind === QUEST_KIND.accept && row.dayKey === data.today && !data.doneToday.has(row.refId)).map(row => row.refId))]
    .map(id => findQuest(id, data.facts)).filter((quest): quest is BoardQuest => !!quest);
  return <section className="plan-quests" aria-label="Quests">
    {accepted.length > 0 && <ul className="plan-quest-list">{accepted.map(quest => <li key={quest.id}>
      <button type="button" className="plan-quest-link" data-testid="plan-quest-link" onClick={() => go(`courtyard/quest/${quest.id}`)}><span className="plan-quest-tag">Quest</span><span>{quest.text.en}</span></button>
    </li>)}</ul>}
    <button type="button" className="text-button plan-add-quest-link" data-testid="plan-add-quest-link" onClick={() => go('courtyard/quests')}>+ quest</button>
  </section>;
}

export { QUEST_KIND };
