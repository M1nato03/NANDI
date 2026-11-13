import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { realThingsMs, receiptDuration, recapWindow, type ReceiptContent } from '../../core/recap';
import { JAR, jarDuration } from '../../core/yatra/jar';
import { STRETCHES_PER_LEG } from '../../core/yatra/trek';
import type { JourneyTrek } from '../../core/yatra/journey';
import { WEB_APP } from '../../core/puzzles/challenge';
import { clearJarPlan, JAR_PLAN_KEY, planReached, PLAN_MAX, readJarPlan, saveJarPlan, type JarPlan } from '../../data/repos/yatra';
import { recapPng } from '../screens/recapCard';
import { saveFileNow, shareFileNow, shareNote, useShareDay } from '../shareActions';
import { useModalFocus } from '../shell/useModalFocus';
import { recordError } from '../errorRing';
import { Kachhua } from '../cast/Cast';

/**
 * Spec 54 + 53: Home's top line is the receipt's REAL THINGS for this week so far (measured time only), so the two
 * never disagree. Jar minutes show only on the plan bar.
 */
export function RealThingsLine() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60_000); return () => window.clearInterval(timer); }, []);
  const source = useLiveQuery(async () => ({
    focus: await db.focus.toArray(), sessions: await db.sessions.toArray(),
    ledger: await db.ledger.where('mode').equals('calm').toArray(),
  }), []);
  if (!source) return null;
  // This week so far: the week that closes next Monday 04:00.
  const minutes = Math.floor(realThingsMs(recapWindow(now + 7 * 86_400_000), source) / 60_000);
  if (minutes < 1) return null;
  return <p className="home-real">This week: <b>{receiptDuration(minutes)}</b> of real things</p>;
}

/** Minutes still to walk to a camp from where the trek stands. */
const minutesTo = (trek: JourneyTrek, camp: number) => Math.max(0, (camp * STRETCHES_PER_LEG - (trek.place * STRETCHES_PER_LEG + trek.stretch)) * JAR.stretchMinutes - trek.jar.carry);

/**
 * The payout share's image: the receipt's paper with the camp reached, nothing else. The person's own plan line stays
 * on their screen; the share carries no titles (spec 54).
 */
export function payoutContent(place: string): ReceiptContent {
  return { dates: '', soFar: false, lines: [{ label: 'Reached', value: place }], slots: {}, heading: 'NANDI · TRAIL', subline: 'a camp reached' };
}

/** The one line that travels with the payout image: the camp, never the plan line. */
export const payoutShareText = (place: string) => `I reached ${place} on my NANDI trail.\n${WEB_APP}`;

/**
 * Spec 54: one open plan for a camp ahead ("Add a plan to a camp ahead"), its bar in jar minutes (no deadline), and
 * the payout card on reaching it, with Share as an image the person sees first.
 */
/** Spec 575: the plan's camp name, read on its own trail (a plan can be on a trail the walk has already left). */
const campName = (trek: JourneyTrek, plan: JarPlan) => trek.journey.trails.find(trail => trail.id === plan.trailId)?.places[plan.camp]?.name ?? '';

export function JarPlanArea({ trek }: { trek: JourneyTrek }) {
  // Wrapped, so "no plan row yet" is not mistaken for "still loading".
  const read = useLiveQuery(async () => ({ row: await db.settings.get(JAR_PLAN_KEY) }), []);
  const row = read?.row;
  const plan = row && !row.deleted ? readJarPlan(row.value) : null;
  const [editing, setEditing] = useState(false);
  const [next, setNext] = useState(false);
  const ahead = trek.trail.places.map((place, index) => ({ place, index })).filter(({ index }) => index > trek.place);
  if (read === undefined) return null;
  if (plan && planReached(plan, trek.journey, trek.place)) return <PayoutCard trek={trek} plan={plan} done={() => { setNext(true); void clearJarPlan(db, Date.now()).catch(error => recordError('promise', error)); }} />;
  const sheet = editing && <PlanSheet trek={trek} plan={plan} ahead={ahead} close={() => setEditing(false)} />;
  if (!plan) return ahead.length ? <div className="jar-plan-add">
    <button type="button" className="text-button" onClick={() => setEditing(true)}>{next ? 'Add the next plan?' : 'Add a plan to a camp ahead'}</button>{sheet}
  </div> : null;
  const walked = trek.jar.entries.filter(entry => entry.at >= plan.setAt).reduce((total, entry) => total + entry.counted, 0);
  const need = Math.max(plan.needMinutes, walked + minutesTo(trek, plan.camp));
  return <section className="jar-plan" aria-label="Your plan on the trail">
    <p className="jar-plan-line"><strong>{campName(trek, plan)}</strong> · {plan.line}</p>
    <div className="jar-plan-bar" role="progressbar" aria-label="Minutes walked toward this camp" aria-valuemin={0} aria-valuemax={need} aria-valuenow={Math.min(walked, need)}><i style={{ width: `${need ? Math.min(100, walked / need * 100) : 100}%` }} /></div>
    <p className="jar-plan-minutes">{jarDuration(walked)} of {jarDuration(need)}</p>
    <button type="button" className="text-button" onClick={() => setEditing(true)}>Change the plan</button>
    {sheet}
  </section>;
}

function PlanSheet({ trek, plan, ahead, close }: { trek: JourneyTrek; plan: JarPlan | null; ahead: { place: { name: string }; index: number }[]; close: () => void }) {
  const dialog = useModalFocus<HTMLElement>(close);
  const fallback = ahead.at(Math.min(ahead.length, 10) - 1)?.index ?? trek.place + 1;
  const [camp, setCamp] = useState(plan && plan.trailId === trek.trail.id && plan.camp > trek.place ? plan.camp : fallback);
  const [line, setLine] = useState(plan?.line ?? '');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const now = Date.now();
    setBusy(true);
    try {
      // A changed camp starts its bar again from now; the same camp keeps what was walked toward it.
      const same = plan && plan.trailId === trek.trail.id && plan.camp === camp;
      await saveJarPlan(db, { line, camp, trailId: trek.trail.id, setAt: same ? plan.setAt : now, needMinutes: same ? plan.needMinutes : minutesTo(trek, camp) }, now);
      close();
    } catch (error) { recordError('promise', error); setBusy(false); }
  };
  const remove = async () => { setBusy(true); try { await clearJarPlan(db, Date.now()); close(); } catch (error) { recordError('promise', error); setBusy(false); } };
  return <div className="sheet-backdrop" onClick={close}><section ref={dialog} tabIndex={-1} className="task-sheet jar-plan-sheet" role="dialog" aria-modal="true" aria-label="A plan for a camp ahead" onClick={event => event.stopPropagation()}>
    <h2>A plan for a camp ahead</h2>
    <label>Camp<select value={camp} onChange={event => setCamp(Number(event.target.value))}>
      {ahead.map(({ place, index }) => <option key={index} value={index}>{place.name}</option>)}
    </select></label>
    <p className="jar-plan-far">About {jarDuration(minutesTo(trek, camp))} on the trail from here</p>
    <label>What it’s for<input value={line} maxLength={PLAN_MAX} placeholder="the new book, movie night…" onChange={event => setLine(event.target.value)} /></label>
    <div className="jar-plan-actions">
      <button type="button" disabled={busy || !line.trim()} onClick={() => void save()}>Save</button>
      {plan && <button type="button" className="secondary" disabled={busy} onClick={() => void remove()}>Delete the plan</button>}
      <button type="button" className="text-button" onClick={close}>Cancel</button>
    </div>
  </section></div>;
}

export function PayoutCard({ trek, plan, done }: { trek: JourneyTrek; plan: JarPlan; done: () => void }) {
  const place = campName(trek, plan);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const day = useShareDay();
  return <section className="jar-payout card" aria-label="Plan reached">
    <p className="eyebrow">Plan reached</p>
    <h2>You reached {place}: {plan.line}</h2>
    <div className="jar-payout-actions">
      {day && <button type="button" className="secondary" onClick={() => { setMessage(''); setOpen(true); }}>Share</button>}
      <button type="button" onClick={done}>Done</button>
    </div>
    {open && day && <PayoutShare place={place} close={result => { setOpen(false); if (result) setMessage(result); }} />}
    {message && <p role="status">{message}</p>}
  </section>;
}

/** The person sees the exact image before it goes anywhere; Share sends it with one line and the app's link. */
export function PayoutShare({ place, close }: { place: string; close: (message?: string) => void }) {
  const dialog = useModalFocus<HTMLElement>(() => close());
  const logo = useRef<HTMLDivElement>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true, url = '';
    void recapPng(payoutContent(place), logo.current?.querySelector('svg')).then(image => { if (!active) return; url = URL.createObjectURL(image); setBlob(image); setPreview(url); }).catch(() => undefined);
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [place]);
  const file = () => new File([blob!], 'nandi-trail-camp.png', { type: 'image/png' });
  const share = async () => {
    setBusy(true);
    try { const result = await shareFileNow(file(), payoutShareText(place), { title: 'A camp reached', dialogTitle: 'Share my camp' }); close(result === 'shared' ? 'Shared.' : result === 'downloaded' ? 'Image saved.' : shareNote(result)); }
    catch { close('Could not share it.'); }
  };
  const save = async () => {
    setBusy(true);
    try { const result = await saveFileNow(file()); close(result === 'saved' ? 'Saved in Documents.' : result === 'downloaded' ? 'Image saved.' : shareNote(result)); }
    catch { close('Couldn’t save it. Try again.'); }
  };
  return <div className="recap-sheet-backdrop sheet-backdrop" onClick={() => close()}><section ref={dialog} tabIndex={-1} className="recap-sheet ui-sheet" role="dialog" aria-modal="true" aria-label="Share this camp" onClick={event => event.stopPropagation()}>
    <div ref={logo} hidden aria-hidden="true"><Kachhua pose="cheer" size={170} /></div>
    <div className="ui-sheet-handle" aria-hidden="true" />
    <h2>Share this camp</h2>
    {preview ? <img src={preview} width="1080" height="1920" alt={`Camp reached: ${place}`} /> : <p>Making your card…</p>}
    <div className="recap-sheet-actions">
      <button type="button" onClick={() => void share()} disabled={!blob || busy}>Share</button>
      <button type="button" className="secondary" onClick={() => void save()} disabled={!blob || busy}>Save image</button>
      <button type="button" className="text-button" onClick={() => close()}>Not now</button>
    </div>
  </section></div>;
}
