import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { dayKey } from '../../core/time/dayKey';
import { WEB_APP } from '../../core/puzzles/challenge';
import { addLink, addText, asOfLine, joinOrder, joinerColour, crewFilled, crewTotal, inviteText, joinedText, latestAdds, makeCrew, myCrewMinutes, unsent, CREW_KEY, readCrew, type Crew } from '../../core/crew/crew';
import { cleanText, CREW_MAX, CREW_SIZES, decodeCrewLink, encodeCrewLink, NAME_MAX, PLAN_MAX, type CrewSize, type JoinLink } from '../../core/crew/links';
import { deriveJar, FOCUS_RATE_FROM_KEY, jarActs, jarDuration, JAR_FROM_KEY, JAR_KINDS, type JarEntry } from '../../core/yatra/jar';
import { acceptJoin, crewId, receiveCrewLink, saveCrew } from '../../data/repos/crew';
import { inBrowser } from '../../platform/links';
import { saveFileNow, shareFileNow, shareTextNow, shareNote } from '../shareActions';
import { recapPng } from '../screens/recapCard';
import { useModalFocus } from '../shell/useModalFocus';
import { Kachhua } from '../cast/Cast';
import type { ReceiptContent } from '../../core/recap';
import { go } from '../shell/router';
import { recordError } from '../errorRing';
import './yatra.css';

/**
 * Spec 55: a crew is a shared jar by chat links. Members show as coloured initial dots in join order (never ranked);
 * friends see positive adds only; nothing is sent unless the person chooses Send. No server: each phone keeps the
 * newest minutes it has seen from each member.
 */
const COLOURS = ['#c2410c', '#0f766e', '#7c3aed', '#b45309', '#2563eb', '#be185d', '#4d7c0f', '#475569'];
const linkUrl = (route: string) => `${WEB_APP}/#${route}`;
let pastedRoute = '';

/** The crew row, this phone's jar entries since jarFrom, and today. */
function useCrewData() {
  const today = dayKey(Date.now()); // eslint-disable-line react-hooks/purity
  const data = useLiveQuery(async () => ({
    row: await db.settings.get(CREW_KEY), from: await db.settings.get(JAR_FROM_KEY), rateFrom: await db.settings.get(FOCUS_RATE_FROM_KEY),
    facts: await db.ledger.where('kind').anyOf(JAR_KINDS).toArray(), focus: await db.focus.filter(row => row.deleted === 0).toArray(),
  }), []);
  return useMemo(() => {
    if (!data) return undefined;
    const crew = data.row && !data.row.deleted ? readCrew(data.row.value) : null;
    const from = typeof data.from?.value === 'string' ? data.from.value : today;
    const entries: JarEntry[] = deriveJar(jarActs(data.facts, data.focus, data.rateFrom && !data.rateFrom.deleted && typeof data.rateFrom.value === 'string' ? data.rateFrom.value : undefined), from, today);
    return { crew, entries, today };
  }, [data, today]);
}

function Dots({ crew }: { crew: Crew }) {
  const people = joinOrder(crew);
  return <span className="crew-dots" aria-hidden="true">{people.map((person, index) => <i key={index} style={{ background: COLOURS[person.colour % COLOURS.length] }}>{person.first.slice(0, 1).toUpperCase()}</i>)}</span>;
}

/** Home: the crew bar under the trail, and once a day the quiet "Send today's 45 m" line when there is something. */
export function CrewBar() {
  const data = useCrewData();
  const [message, setMessage] = useState('');
  if (!data) return null;
  // With no crew, one quiet row in, styled like "Add a plan to a camp ahead"; pasting a link is one tap either way.
  if (!data.crew) return <div className="crew-entry">
    <button type="button" className="text-button" onClick={() => go('yatra/crew')}>Fill a jar with friends</button>
    <button type="button" className="text-button" onClick={() => go('yatra/crew/paste')}>Paste a crew link</button>
  </div>;
  const { crew, entries, today } = data;
  const mine = myCrewMinutes(crew, entries), total = crewTotal(crew, mine);
  const send = unsent(crew, entries, today);
  const offer = send.minutes > 0 && crew.me.sentDay !== today && crew.me.skipDay !== today;
  return <section className="crew-bar" aria-label={`${crew.plan} crew`}>
    <button type="button" className="crew-bar-go" onClick={() => go('yatra/crew')}>
      <Dots crew={crew} />
      <span><strong>{jarDuration(Math.min(total, crew.size * 60))} of {crew.size} h</strong> for {crew.plan}</span>
    </button>
    {offer && <p className="crew-send">{send.onlyToday ? `Send today's ${jarDuration(send.minutes)}` : `Send your ${jarDuration(send.minutes)}`} to the {crew.plan} crew?
      <span className="crew-send-actions">
        <button type="button" className="text-button" onClick={() => void sendAdd(crew, entries, today).then(setMessage)}>Send</button>
        <button type="button" className="text-button" onClick={() => void saveCrew(db, { ...crew, me: { ...crew.me, skipDay: today } }, Date.now())}>Not today</button>
      </span></p>}
    <button type="button" className="text-button crew-paste-go" onClick={() => go('yatra/crew/paste')}>Paste a crew link</button>
    {message && <p role="status">{message}</p>}
  </section>;
}

/** Opens the share sheet with the add link; only a sent (or copied) message moves "what was sent". */
async function sendAdd(crew: Crew, entries: readonly JarEntry[], today: string): Promise<string> {
  const link = addLink(crew, entries, today);
  const minutes = link.u - crew.me.sentCum;
  const result = await shareTextNow(addText(crew, minutes, crewTotal(crew, link.u), linkUrl(encodeCrewLink(link))), undefined, { title: 'Crew minutes', dialogTitle: 'Send to the crew' });
  if (result === 'shared' || result === 'copied') await saveCrew(db, { ...crew, me: { ...crew.me, sentCum: link.u, sentDay: today } }, Date.now());
  return shareNote(result);
}

/** The crew screen: the plan, the bar, who is walking, today's adds only, invite, paste a link, leave. */
export function CrewScreen({ paste = false }: { paste?: boolean }) {
  const data = useCrewData();
  const [message, setMessage] = useState('');
  const [sharing, setSharing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  if (!data) return <section className="screen" role="status">Opening the crew…</section>;
  const { crew, entries, today } = data;
  if (!crew) return <section className="screen crew-screen"><h1>A crew</h1><p>Fill one jar together with up to four friends. Each of you walks your own trail; your minutes add up here when you send them.</p><MakeCrew /><PasteLink open={paste} /></section>;
  const mine = myCrewMinutes(crew, entries), total = crewTotal(crew, mine);
  const filled = crewFilled(crew, mine);
  const adds = latestAdds(crew, today);
  const asOf = asOfLine(crew, today);
  const invite = async () => {
    const link: JoinLink = { v: 1, t: 'join', c: crew.id, p: crew.plan, s: crew.size, mk: crew.made, m: crew.me.id, n: crew.me.first, k: crew.me.colour };
    setMessage(shareNote(await shareTextNow(inviteText(crew, linkUrl(encodeCrewLink(link))), undefined, { title: 'Join my crew', dialogTitle: 'Invite a friend' })));
  };
  return <section className="screen crew-screen">
    <p className="eyebrow">Your crew</p>
    <h1>{crew.plan}</h1>
    <div className="crew-meter" role="progressbar" aria-label="Crew jar" aria-valuemin={0} aria-valuemax={crew.size * 60} aria-valuenow={Math.min(total, crew.size * 60)}><i style={{ width: `${Math.min(100, total / (crew.size * 60) * 100)}%` }} /></div>
    <p><strong>{jarDuration(Math.min(total, crew.size * 60))} of {crew.size} h</strong></p>
    {asOf && <p className="small">{asOf}</p>}
    <p><Dots crew={crew} /> {crew.members.length + 1} walking</p>
    {filled && <div className="card crew-filled"><h2>The crew filled {crew.size} h: {crew.plan}</h2><div className="crew-filled-actions"><button type="button" className="secondary" onClick={() => setSharing(true)}>Share</button><button type="button" onClick={() => void leave(crew)}>Plan the next one</button></div></div>}
    {sharing && <CrewShare size={crew.size} close={result => { setSharing(false); if (result) setMessage(result); }} />}
    {adds.length > 0 && <><h2>Latest</h2><ul className="crew-adds">{adds.map(line => <li key={line}>{line}</li>)}</ul></>}
    {crew.members.length + 1 < CREW_MAX && <button type="button" className="secondary" onClick={() => void invite()}>Invite a friend</button>}
    <NameEdit crew={crew} />
    <PasteLink open={paste} />
    <button type="button" className="text-button" onClick={() => setLeaving(true)}>Leave crew</button>
    {leaving && <LeaveConfirm crew={crew} close={() => setLeaving(false)} />}
    {message && <p role="status">{message}</p>}
  </section>;
}

/** Leaving is never one tap: Stay is the main, safe choice; Leave clears this phone's crew (the others keep its minutes). */
function LeaveConfirm({ crew, close }: { crew: Crew; close: () => void }) {
  const dialog = useModalFocus<HTMLElement>(close);
  return <div className="sheet-backdrop" onClick={close}><section ref={dialog} tabIndex={-1} className="task-sheet crew-leave" role="dialog" aria-modal="true" aria-label="Leave the crew?" onClick={event => event.stopPropagation()}>
    <h2>Leave the {crew.plan} crew?</h2>
    <p>The crew keeps your minutes.</p>
    <div className="crew-leave-actions">
      <button type="button" autoFocus onClick={close}>Stay</button>
      <button type="button" className="text-button" onClick={() => { close(); void leave(crew); }}>Leave</button>
    </div>
  </section></div>;
}

async function leave(crew: Crew) {
  // Leaving sends nothing; the others keep this phone's dot and its past minutes.
  try { await saveCrew(db, null, Date.now()); } catch (error) { recordError('promise', error); }
  void crew;
}

/** One quiet line, "You're Riya · Change"; Change opens the field. The next add link carries the new name. */
function NameEdit({ crew }: { crew: Crew }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(crew.me.first);
  const save = () => {
    const first = cleanText(name, NAME_MAX);
    if (first && first !== crew.me.first) void saveCrew(db, { ...crew, me: { ...crew.me, first } }, Date.now());
    setEditing(false);
  };
  if (!editing) return <p className="crew-name">You're {crew.me.first} · <button type="button" className="text-button" onClick={() => setEditing(true)}>Change</button></p>;
  return <div className="crew-name-edit"><label>Your first name<input autoFocus value={name} maxLength={NAME_MAX} onChange={event => setName(event.target.value)} /></label><button type="button" className="secondary" onClick={save}>Save</button></div>;
}

function MakeCrew() {
  const [plan, setPlan] = useState('');
  const [size, setSize] = useState<CrewSize>(15);
  const [first, setFirst] = useState('');
  const make = async () => {
    const now = Date.now();
    await saveCrew(db, makeCrew({ id: crewId(), plan: cleanText(plan, PLAN_MAX), size, me: { id: crewId(), first: cleanText(first, NAME_MAX), colour: 0 }, now, today: dayKey(now) }), now);
  };
  return <div className="card crew-make">
    <h2>Make a crew</h2>
    <label>What the crew fills up for<input value={plan} maxLength={PLAN_MAX} placeholder="Sunday chai at the hill point" onChange={event => setPlan(event.target.value)} /></label>
    <p className="crew-size-label" id="crew-size">How big a jar</p>
    <div className="crew-sizes" role="group" aria-labelledby="crew-size">{CREW_SIZES.map(hours => <button type="button" key={hours} className="secondary" aria-pressed={size === hours} onClick={() => setSize(hours)}>{hours} h</button>)}</div>
    <label>Your first name<input value={first} maxLength={NAME_MAX} onChange={event => setFirst(event.target.value)} /></label>
    <button type="button" disabled={!cleanText(plan, PLAN_MAX) || !cleanText(first, NAME_MAX)} onClick={() => void make()}>Make the crew</button>
  </div>;
}

/** Until App Links are live, a link tapped in a chat opens the browser: paste it here instead. The clipboard is never read. */
function PasteLink({ open: start = false }: { open?: boolean }) {
  const [open, setOpen] = useState(start);
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const use = () => {
    const at = text.indexOf('#crew/');
    const route = at >= 0 ? text.slice(at + 1).trim().split(/\s/)[0]! : text.trim();
    if (!decodeCrewLink(route)) { setNote('That does not look like a crew link.'); return; }
    setText(''); setNote('');
    // A pasted link is already inside NANDI, so its screen acts as the app, even on the web build.
    pastedRoute = route;
    go(route);
  };
  // A button first; the field opens focused, so the keyboard's own Paste is one tap. The clipboard is never read.
  if (!open) return <div className="crew-paste"><button type="button" className="secondary" onClick={() => setOpen(true)}>Paste a crew link</button></div>;
  return <div className="crew-paste">
    <label>Crew link<input autoFocus value={text} onChange={event => setText(event.target.value)} placeholder="https://…#crew/…" /></label>
    <button type="button" className="secondary" disabled={!text.trim()} onClick={use}>Use this link</button>
    {note && <p role="status">{note}</p>}
  </div>;
}

/** Where a crew link lands (#crew/join|joined|add/…), in the app or in a browser. */
export function CrewLinkScreen({ route }: { route: string }) {
  const link = useMemo(() => decodeCrewLink(route), [route]);
  const crewRow = useLiveQuery(async () => ({ row: await db.settings.get(CREW_KEY) }), []);
  const [browserJoin, setBrowserJoin] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [first, setFirst] = useState('');
  const [copied, setCopied] = useState('');
  const crew = crewRow?.row && !crewRow.row.deleted ? readCrew(crewRow.row.value) : null;
  const outside = inBrowser() && pastedRoute !== route && !browserJoin;
  useEffect(() => {
    if (!link || link.t === 'join' || outside) return;
    void receiveCrewLink(db, route, Date.now(), dayKey(Date.now())).then(() => go('yatra/crew')).catch(error => recordError('promise', error));
  }, [link, route, outside]);
  if (!link) return <section className="screen crew-screen"><h1>A crew link</h1><p>Nothing to add from this link.</p><button type="button" onClick={() => go('yatra/crew')}>Open the crew</button></section>;
  const copy = async () => { try { await navigator.clipboard.writeText(`${WEB_APP}/#${route}`); setCopied('Copied.'); } catch { setCopied('Copy it from the address bar instead.'); } };
  if (outside) return <section className="screen crew-screen">
    <h1>{link.t === 'join' ? `Join the ${link.p} crew?` : 'A crew link'}</h1>
    <p><strong>Have the app?</strong> Copy this link, open NANDI, and tap Paste a crew link on Yatra.</p>
    <button type="button" onClick={() => void copy()}>Copy this link</button>
    {copied && <p role="status">{copied}</p>}
    {/* No install page exists yet (the updates site serves version.json and APKs only), so no link that would 404. */}
    <p className="small">No app yet? You can join here in the browser.</p>
    <button type="button" className="text-button" onClick={() => setBrowserJoin(true)}>{link.t === 'join' ? 'Join here in the browser' : 'Use it here in the browser'}</button>
  </section>;
  if (link.t !== 'join') return <section className="screen" role="status">Adding to the crew…</section>;
  if (done) return <section className="screen crew-screen"><h1>You joined</h1><p>Send this back so the crew sees you.</p><button type="button" onClick={() => void (async () => { if (!crew) return; setDone(shareNote(await shareTextNow(joinedText(crew, linkUrl(encodeCrewLink({ v: 1, t: 'joined', c: crew.id, m: crew.me.id, n: crew.me.first, k: crew.me.colour, d: crew.me.day ?? dayKey(Date.now()) }))), undefined, { title: 'Joined', dialogTitle: 'Tell the crew' })) || 'Sent.'); })()}>Send it to the crew</button>{done !== 'joined' && <p role="status">{done}</p>}<button type="button" className="text-button" onClick={() => go('yatra/crew')}>Open the crew</button></section>;
  if (crew) return <section className="screen crew-screen"><h1>Join the {link.p} crew?</h1><p>You are already in the {crew.plan} crew. One crew at a time: leave it first in Yatra → your crew.</p></section>;
  return <section className="screen crew-screen">
    <h1>Join the {link.p} crew?</h1>
    <p>{link.n} made it: when you fill {link.s} h together, it's {link.p}.</p>
    <p className="small">Crews hold up to {CREW_MAX}.</p>
    <label>Your first name<input value={first} maxLength={NAME_MAX} onChange={event => setFirst(event.target.value)} /></label>
    <button type="button" disabled={!cleanText(first, NAME_MAX)} onClick={() => void acceptJoin(db, route, { first: cleanText(first, NAME_MAX), colour: joinerColour(link.k) }, Date.now()).then(() => setDone('joined'))}>Join</button>
  </section>;
}

/** The crew's filled jar as an image: the size only, no member, no per-person number and no plan words. */
export function crewFilledContent(size: number): ReceiptContent {
  return { dates: '', soFar: false, lines: [{ label: 'Filled together', value: `${size} h` }], slots: {}, heading: 'NANDI · CREW', subline: 'a crew jar filled' };
}
export const crewFilledText = (size: number) => `Our NANDI crew filled ${size} h together.\n${WEB_APP}`;

/** The person sees the exact image first; Share sends it with one line, Save keeps it. */
function CrewShare({ size, close }: { size: number; close: (message?: string) => void }) {
  const dialog = useModalFocus<HTMLElement>(() => close());
  const logo = useRef<HTMLDivElement>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true, url = '';
    void recapPng(crewFilledContent(size), logo.current?.querySelector('svg')).then(image => { if (!active) return; url = URL.createObjectURL(image); setBlob(image); setPreview(url); }).catch(() => undefined);
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [size]);
  const file = () => new File([blob!], 'nandi-crew-filled.png', { type: 'image/png' });
  const share = async () => { setBusy(true); try { close(shareNote(await shareFileNow(file(), crewFilledText(size), { title: 'Our crew filled', dialogTitle: 'Share the crew jar' })) || 'Shared.'); } catch { close('Could not share it.'); } };
  const save = async () => { setBusy(true); try { const result = await saveFileNow(file()); close(result === 'saved' ? 'Saved in Documents/NANDI' : result === 'downloaded' ? 'Image saved.' : shareNote(result)); } catch { close('Could not save it.'); } };
  return <div className="recap-sheet-backdrop sheet-backdrop" onClick={() => close()}><section ref={dialog} tabIndex={-1} className="recap-sheet ui-sheet" role="dialog" aria-modal="true" aria-label="Share the crew jar" onClick={event => event.stopPropagation()}>
    <div ref={logo} hidden aria-hidden="true"><Kachhua pose="cheer" size={170} /></div>
    <div className="ui-sheet-handle" aria-hidden="true" />
    <h2>Share the crew jar</h2>
    {preview ? <img src={preview} width="1080" height="1920" alt={`A crew jar filled: ${size} h`} /> : <p>Making your card…</p>}
    <div className="recap-sheet-actions">
      <button type="button" onClick={() => void share()} disabled={!blob || busy}>Share</button>
      <button type="button" className="secondary" onClick={() => void save()} disabled={!blob || busy}>Save image</button>
      <button type="button" className="text-button" onClick={() => close()}>Not now</button>
    </div>
  </section></div>;
}
