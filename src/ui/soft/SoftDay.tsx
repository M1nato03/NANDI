import { useEffect, useRef, useState } from 'react';
import { softMoreKey } from '../../core/soft/soft';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { canShareNow } from '../../data/repos/night';
import { getOrCreateDeviceId } from '../../data/device';
import { doSoftThing, setSoftState } from '../../data/repos/soft';
import { deriveEconomy } from '../../core/economy/deriveEconomy';
import { careCardDue, KIND_WORDS, SOFT_LINES, SOFT_OPTIONS, type SoftChoice, type SoftState } from '../../core/soft/soft';
import { WEB_APP } from '../../core/puzzles/challenge';
import type { LedgerRow, SettingRow, TaskRow } from '../../data/types';
import { Cast } from '../cast/Cast';
import { ExerciseFigure } from '../train/ExerciseFigure';
import { tapHaptic } from '../../platform/haptics';
import { shareOrDownload } from '../../platform/files';
import { go } from '../shell/router';
import type { TaskRepos } from '../tasks/useTaskBoard';
import { kindCardPng } from './kindCard';
import './soft.css';
import { useModalFocus } from '../shell/useModalFocus';

export const SOFT_KINDS = ['soft-start', 'soft'];
export function useSoftFacts() {
  return useLiveQuery(() => db.ledger.where('kind').anyOf(SOFT_KINDS).filter(row => row.deleted === 0).toArray(), []) ?? [];
}
const saveSetting = async (key: string, value: unknown) => { const at = Date.now(); await db.settings.put({ key, value, updatedAt: at, deleted: 0, deviceId: await getOrCreateDeviceId(db, at) }); };
export { softMoreKey };
/** Saves the gentle thing at tap time, credited to the soft day it was opened on. */
const softThingNow = (picked: SoftChoice, extra: { text?: string; inStory?: boolean } | undefined, day: string) => doSoftThing(db, picked, Date.now(), extra, day);

/** Spec 15 A: the way in. Never asked by notification; after bedtime it opens the night routine instead. */
export function SoftChip({ afterBedtime }: { afterBedtime: boolean }) {
  const [open, setOpen] = useState(false);
  const dialog = useModalFocus<HTMLElement>(() => setOpen(false));
  const pick = async (state: SoftState) => { setOpen(false); await setSoftState(db, state, Date.now()); };
  return <>
    <button type="button" className="soft-chip" onClick={() => afterBedtime ? go('night') : setOpen(true)}>Low on energy today?</button>
    {open && <div className="sheet-backdrop" onClick={() => setOpen(false)}><section ref={dialog} tabIndex={-1} className="task-sheet soft-sheet" role="dialog" aria-modal="true" aria-label="What kind of day is it?" onClick={event => event.stopPropagation()}>
      <h2>What kind of day is it?</h2>
      <div className="soft-sheet-choices"><button type="button" onClick={() => void pick('tired')}>Tired</button><button type="button" onClick={() => void pick('low')}>Feeling low</button><button type="button" className="secondary" onClick={() => setOpen(false)}>Not now</button></div>
    </section></div>}
  </>;
}

const STRETCHES = [
  { id: 'bed-reach', name: 'Reach long', how: 'Lie on your back. Reach your arms past your head and point your toes. Hold for three slow breaths.' },
  { id: 'knee-hug', name: 'Hug your knees', how: 'Pull both knees to your chest. Rock gently from side to side for three slow breaths.' },
  { id: 'bed-twist', name: 'Gentle twist', how: 'Bend your knees and let them fall to one side, then the other. Three slow breaths each way.' },
] as const;

function Breathe({ done }: { done: () => void }) {
  return <div className="soft-task"><div className="soft-breath" aria-hidden="true"><span /></div><p className="soft-breath-text">Breathe in as the circle grows. Breathe out as it shrinks. About one minute is plenty.</p><button type="button" onClick={done}>Done</button></div>;
}
function Stretch({ done }: { done: () => void }) {
  return <div className="soft-task"><ol className="soft-stretches">{STRETCHES.map(item => <li key={item.id}><ExerciseFigure id={item.id} name={item.name} /><div><strong>{item.name}</strong><p className="small">{item.how}</p></div></li>)}</ol><button type="button" onClick={done}>Done</button></div>;
}
function TinyTask({ tasks, act, done }: { tasks: TaskRow[]; act: (operation: (repos: TaskRepos, at: number) => Promise<unknown>, success?: string) => Promise<boolean>; done: (text?: string) => void }) {
  const [text, setText] = useState('');
  const open = tasks.filter(task => !task.deleted && task.status !== 'done' && task.status !== 'dropped' && !tasks.some(child => child.parentId === task.id && !child.deleted))
    .sort((a, b) => (a.estimateMin ?? 30) - (b.estimateMin ?? 30))[0];
  return <div className="soft-task">
    {open && <div className="soft-tiny"><p>Your smallest task: <strong>{open.title}</strong></p><button type="button" onClick={() => void act(repos => repos.completeTask(open.id, Date.now())).then(ok => { if (ok) done(open.title); })}>Done</button></div>}
    <label className="soft-field">{open ? 'Or something tiny of your own' : 'Something tiny, like filling your water bottle'}<input value={text} maxLength={80} onChange={event => setText(event.target.value)} placeholder="Fill my water bottle" /></label>
    <button type="button" className={open ? 'secondary' : undefined} disabled={!text.trim()} onClick={() => done(text.trim())}>I did it</button>
  </div>;
}
function Outside({ done }: { done: () => void }) {
  return <div className="soft-task"><p>Step outside for about five minutes. Look at the sky, feel the air. Come back and tap when you are back.</p><button type="button" onClick={done}>I stepped outside</button></div>;
}
function GoodThing({ done }: { done: (text: string, inStory: boolean) => void }) {
  const [text, setText] = useState('');
  const [inStory, setInStory] = useState(false);
  return <div className="soft-task"><label className="soft-field">One good thing from today, however small<input value={text} maxLength={140} onChange={event => setText(event.target.value)} placeholder="Chai with Ma" /></label>
    <label className="soft-check"><input type="checkbox" checked={inStory} onChange={event => setInStory(event.target.checked)} /> Show it in my Sunday storybook</label>
    <p className="small">It stays on this phone.</p>
    <button type="button" disabled={!text.trim()} onClick={() => done(text.trim(), inStory)}>Keep it</button></div>;
}
/** Spec 15 E: a kind word, drawn as a card and sent through the phone's own share sheet. No reward, no count. */
export function KindWord({ done }: { done: () => void }) {
  const [line, setLine] = useState<string>(KIND_WORDS[0]);
  const [own, setOwn] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const friend = useRef<HTMLDivElement>(null);
  const text = own.trim() || line;
  const send = async () => {
    setBusy(true); setMessage('');
    try {
      // Spec 19: every share waits for the day window, checked again at the tap.
      if (!await canShareNow(db)) { setMessage('Sharing waits for the morning.'); return; }
      const blob = await kindCardPng(text, friend.current?.querySelector('svg') ?? null, WEB_APP);
      const result = await shareOrDownload(new File([blob], 'kind-word.png', { type: 'image/png' }), text, { title: 'A kind word', dialogTitle: 'Send a kind word', cancelledIfClosed: true });
      if (result !== 'cancelled') done();
    } catch { setMessage('Could not make the card. You can still send the words yourself.'); }
    finally { setBusy(false); }
  };
  return <div className="soft-task">
    <div ref={friend} className="soft-kind-friend"><Cast name="Kachhua" pose="cheer" size={72} title="Kachhua" /></div>
    <div className="soft-kind-lines" role="radiogroup" aria-label="Pick a line">{KIND_WORDS.map(item => <button type="button" key={item} role="radio" aria-checked={!own.trim() && line === item} className={`secondary soft-kind-line${!own.trim() && line === item ? ' selected' : ''}`} onClick={() => { setOwn(''); setLine(item); }}>{item}</button>)}</div>
    <label className="soft-field">Or your own words<input value={own} maxLength={120} onChange={event => setOwn(event.target.value)} /></label>
    <p className="soft-kind-preview">“{text}”</p>
    <button type="button" disabled={busy} onClick={() => void send()}>Send it</button>
    {message && <p role="status">{message}</p>}
  </div>;
}

/** Spec 15 F: shown once when low days keep coming, then at most every 14 days. Never a notification. */
function CareCard({ close }: { close: () => void }) {
  return <section className="card soft-care" aria-label="Someone to talk to"><p>Low days come to everyone. If they keep coming, talking to someone helps. Tele-MANAS is free, open day and night, in 20 languages.</p>
    <div className="sheet-actions"><a className="button-link" href="tel:14416" onClick={close}>Call 14416</a><button type="button" className="secondary" onClick={close}>Not now</button></div></section>;
}

/** Spec 15 B + C: one card only. Kachhua hosts; one gentle thing; a calm finish that is the last screen. */
export function SoftHome({ state, today, done, facts, settings, tasks, act }: {
  state: SoftState; today: string; done: boolean; facts: Parameters<typeof careCardDue>[0]; settings: SettingRow[]; tasks: TaskRow[];
  act: (operation: (repos: TaskRepos, at: number) => Promise<unknown>, success?: string) => Promise<boolean>;
}) {
  const [choice, setChoice] = useState<SoftChoice | null>(null);
  // The day a gentle thing was opened on; the Home itself can re-render with the next day after 04:00.
  const openedOn = useRef<string | null>(null);
  const [closed, setClosed] = useState(false);
  const [careClosed, setCareClosed] = useState(false);
  const careShown = settings.find(row => row.key === 'soft.careShownAt')?.value;
  // Shown once: the day it first appears is saved straight away, so it stays for today and then waits 14 days.
  const care = state === 'low' && !careClosed && (careShown === today || careCardDue(facts, today, careShown));
  useEffect(() => { if (care && careShown !== today) void saveSetting('soft.careShownAt', today); }, [care, careShown, today]);
  // Spec 15 D: a soft day after a miss carries the welcome-back gift; say it here, calmly, not in an overlay.
  const ledger = useLiveQuery(() => done ? db.ledger.toArray() : Promise.resolve<LedgerRow[]>([]), [done]);
  const welcome = done && ledger?.length ? deriveEconomy(ledger, undefined, settings, today).days.find(day => day.dayKey === today)?.welcome ?? 0 : 0;
  const finish = async (picked: SoftChoice, extra?: { text?: string; inStory?: boolean }) => {
    await softThingNow(picked, extra, openedOn.current ?? today);
    void tapHaptic(true, 15);
    setChoice(null);
  };
  if (done) return <section className="card soft-card soft-finish" aria-label="Soft day">
    <Cast name="Kachhua" pose="rest" size={96} title="Kachhua resting" />
    <div className="soft-lantern" aria-hidden="true" />
    {closed ? <><h2>Today is kept.</h2><p>Rest well. See you tomorrow.</p></> : <><h2>That counts. Kachhua lit a lantern for today.</h2>{welcome > 0 && <p>Welcome back. Here is a small gift for coming back: +{welcome} XP.</p>}<p>You can stop here.</p>
      <button type="button" onClick={() => setClosed(true)}>Close for today</button></>}
    <button type="button" className="text-button" onClick={() => void saveSetting(softMoreKey(today), true)}>I feel better, show me more</button>
  </section>;
  const option = SOFT_OPTIONS[state].find(item => item.id === choice);
  return <>
    {care && <CareCard close={() => setCareClosed(true)} />}
    <section className="card soft-card" aria-label="Soft day">
      <div className="soft-host"><Cast name="Kachhua" pose="rest" size={72} title="Kachhua resting" /><p className="soft-line">{SOFT_LINES[state]}</p></div>
      {!option ? <ul className="soft-options">{SOFT_OPTIONS[state].map(item => <li key={item.id}><button type="button" className="soft-option" onClick={() => { openedOn.current = today; setChoice(item.id); }}>{item.label}{item.minutes && <small> · {item.minutes} min</small>}</button></li>)}</ul>
        : <div className="soft-doing"><h2>{option.label}</h2>
          {option.id === 'breathe' && <Breathe done={() => void finish('breathe')} />}
          {option.id === 'stretch' && <Stretch done={() => void finish('stretch')} />}
          {option.id === 'tiny-task' && <TinyTask tasks={tasks} act={act} done={text => void finish('tiny-task', { text })} />}
          {option.id === 'outside' && <Outside done={() => void finish('outside')} />}
          {option.id === 'kind-word' && <KindWord done={() => void finish('kind-word')} />}
          {option.id === 'good-thing' && <GoodThing done={(text, inStory) => void finish('good-thing', { text, inStory })} />}
          <button type="button" className="text-button" onClick={() => setChoice(null)}>Pick another</button></div>}
      <button type="button" className="text-button soft-okay" onClick={() => void setSoftState(db, 'okay', Date.now())}>I feel okay now</button>
      {/* Item 83: tasks stay reachable on a soft day (to move or tick one) without ending the gentle day. */}
      <button type="button" className="text-button" onClick={() => void saveSetting(softMoreKey(today), true)}>See my tasks</button>
    </section>
  </>;
}
