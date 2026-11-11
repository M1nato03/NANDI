import { useRef, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { loadGame, playedMonths, playMove, saveDraft, startMonth } from '../../data/repos/bookGame';
import {
  bestMove, CURE_NUMBERS, CURES, CUSHION_TARGET, FESTIVAL_CHOICES, fmt, fresh, GOALS, goalSaved, LAW_NUMBERS, ledgerRows, messageParts, MONTHS, net,
  PLAY_TITLES, RESULT_TITLES, SCENARIOS, signCounts, simulate, SPLIT, SUBS, tryDifferent, type Action, type ArkadState, type Pot,
} from '../../core/bookGame/arkad';
import { BOOK_GAMES, chaptersDone, monthLock, yearProgress } from '../../core/bookGame/unlocks';
import { go } from '../shell/router';
import { useModalFocus } from '../shell/useModalFocus';
import { Cast } from '../cast/Cast';
import './bookGame.css';

/**
 * Spec 40 "Your first year": the Babylon book game (round 14, approved 30 Oct), one month per sitting. Its one home is
 * the Babylon book page (Grow › Read); the route is grow/read/game/<bookId>[/<mon>]. The engine is
 * core/bookGame/arkad.ts; the year is saved in Dexie (bookGameStates). The moves sit pinned in the thumb zone above
 * the tab bar; the middle scrolls (E12). Every growth figure says it is a fictional example; nothing reads as advice.
 */
const MONTH_IDS = MONTHS.map(m => m.toLowerCase());
const FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TAG_TEXT = { red: 'Warning', green: 'Good sign', grey: 'Other' } as const;
/** An amount with its sign that never splits across lines (a9: "+ / ₹5,000"): a word joiner after the sign. */
const signed = (n: number) => `${n > 0 ? '+\u2060' : ''}${fmt(n)}`;

function useGame(bookId: string) {
  return useLiveQuery(async () => {
    const state = await loadGame(db, bookId);
    const done = new Set((await db.ledger.where('kind').equals('chapter').filter(row => !row.deleted).toArray()).map(row => row.refId));
    return { state, done };
  }, [bookId]);
}

export function BookGameScreen({ bookId, month: monthParam }: { bookId: string; month?: string }) {
  const game = BOOK_GAMES[bookId];
  const data = useGame(bookId);
  const [busy, setBusy] = useState(false);
  if (!game) return <section className="screen book-game"><h1>No game for this book</h1><button type="button" onClick={() => go('grow/read')}>Back to the library</button></section>;
  if (!data) return <section className="screen book-game" aria-busy="true" />;
  const state = data.state ?? fresh();
  const chapters = chaptersDone(game, data.done);
  const played = playedMonths(data.state);
  const progress = yearProgress(chapters, played);
  const back = <button type="button" className="secondary" onClick={() => go(`grow/read/book/${bookId}`)}>Back to the book</button>;
  const run = async (step: () => Promise<unknown>) => { if (busy) return; setBusy(true); try { await step(); } finally { setBusy(false); } };

  // A deep link to one month: a played month reopens read-only; a locked one says why in one line.
  if (monthParam !== undefined) {
    const month = MONTH_IDS.indexOf(monthParam);
    if (month < 0) return <section className="screen book-game"><h1>{game.title}</h1><p className="book-game-lock" role="status">That month is not part of the year.</p>{back}</section>;
    if (state.results[month]) return <ResultView state={state} month={month} readOnly footer={<button type="button" onClick={() => go(`grow/read/game/${bookId}`)}>Back to your year</button>} />;
    const lock = monthLock(month, chapters, played);
    if (!lock.open) return <section className="screen book-game"><p className="eyebrow">{game.title}</p><h1>{FULL[month]}</h1><p className="book-game-lock" role="status" data-testid="book-game-lock">{lock.reason}</p>{back}</section>;
    if (!(state.phase === 'play' && state.month === month)) return <section className="screen book-game"><p className="eyebrow">{game.title}</p><h1>{FULL[month]}</h1>
      <BottomActions><button type="button" disabled={busy} onClick={() => void run(async () => { await startMonth(db, bookId, month); go(`grow/read/game/${bookId}`); })}>Start {FULL[month]}</button></BottomActions></section>;
  }

  const save = (next: ArkadState) => void saveDraft(db, bookId, next);
  const act = (action: Action) => void run(() => playMove(db, bookId, action));

  if (state.phase === 'teach' || !data.state) return <Teach state={state} onGoal={goal => save({ ...state, goal })}
    footer={progress.next === 0 ? <button type="button" disabled={busy} onClick={() => void run(async () => { if (state.goal === null) await saveDraft(db, bookId, { ...state, goal: 0 }); await startMonth(db, bookId, 0); })}>Start January</button>
      : <><p className="book-game-lock" role="status" data-testid="book-game-lock">{monthLock(0, chapters, played).open ? '' : (monthLock(0, chapters, played) as { reason: string }).reason}</p>{back}</>} />;
  if (state.phase === 'play') return <Play state={state} busy={busy} onChange={save} onAct={act} />;
  if (state.phase === 'result') {
    const next = state.month + 1;
    const lock = next < 12 ? monthLock(next, chapters, played) : null;
    const footer = state.month === 11 ? <button type="button" onClick={() => save({ ...state, phase: 'end' })}>View the full year</button>
      : lock?.open ? <button type="button" disabled={busy} onClick={() => void run(() => startMonth(db, bookId, next))}>Start {MONTHS[next]}</button>
        : <><p className="book-game-lock" role="status" data-testid="book-game-lock">{lock && !lock.open ? lock.reason : ''}</p>{back}</>;
    return <ResultView state={state} month={state.month} footer={footer} />;
  }
  return <YearEnd state={state} footer={back} />;
}

/** The moves pinned in the thumb zone, above the tab bar. */
const BottomActions = ({ children }: { children: ReactNode }) => <div className="book-game-actions">{children}</div>;

function PotsStrip({ state }: { state: ArkadState }) {
  return <div className="book-game-pots" aria-label="Your pots">
    {(['mine', 'cushion', 'growing'] as const).map(pot => <div key={pot} className={`book-game-pot is-${pot}`}><span>{pot === 'mine' ? 'Mine' : pot === 'cushion' ? 'Cushion' : 'Growing'}</span><strong>{fmt(state.pots[pot])}</strong>{pot === 'growing' && <small>fictional example</small>}</div>)}
    {state.debt > 0 && <div className="book-game-pot is-debt"><span>Unpaid</span><strong>{fmt(-state.debt)}</strong></div>}
  </div>;
}

function Cure({ month }: { month: number }) {
  return <div className="book-game-cure"><strong>Arkad's cure #{CURE_NUMBERS[month]}{LAW_NUMBERS[month] ? ` · Gold law #${LAW_NUMBERS[month]}` : ''}</strong> {CURES[month]![1]}</div>;
}

function GoalBar({ state }: { state: ArkadState }) {
  if (state.goal === null) return null;
  const goal = GOALS[state.goal]!, saved = goalSaved(state);
  return <div className="book-game-goal"><div><span>{goal.name}</span><span>{fmt(Math.min(saved, goal.amount))} / {fmt(goal.amount)}</span></div>
    <div className="book-game-bar"><i style={{ width: `${Math.min(100, saved / goal.amount * 100)}%` }} /></div></div>;
}

function Teach({ state, onGoal, footer }: { state: ArkadState; onGoal: (goal: number) => void; footer: ReactNode }) {
  return <section className="screen book-game book-game-teach">
    <p className="eyebrow">Your first working year</p><h1>Keep a part. See where it goes.</h1>
    <div className="card"><h2>Pick a goal for your year</h2><div className="book-game-goals">{GOALS.map((goal, i) =>
      <button type="button" key={goal.name} className={state.goal === i ? '' : 'secondary'} aria-pressed={state.goal === i} onClick={() => onGoal(i)}>{goal.name}<span>{fmt(goal.amount)}</span></button>)}</div></div>
    <div className="card book-game-arkad"><ArkadPortrait /><div><b>Arkad · richest man in old Babylon</b><p className="small">People asked how he got rich. His first rule:</p>
      <p className="book-game-rule">Keep ₹1 of every ₹10 you earn, first.</p></div></div>
    <p className="small book-game-hint"><Cast name="Chiku" pose="idle" size={32} /> One month per sitting. Your choices carry into the next one. Each chapter you finish opens the next months.</p>
    <BottomActions>{footer}</BottomActions>
  </section>;
}

function Scene({ kind, icon, children }: { kind: string; icon: string; children: ReactNode }) {
  return <div className="card book-game-scene"><div className="book-game-scene-head"><span aria-hidden="true">{icon}</span>{kind}</div><div>{children}</div></div>;
}

function Play({ state, busy, onChange, onAct }: { state: ArkadState; busy: boolean; onChange: (next: ArkadState) => void; onAct: (action: Action) => void }) {
  const m = state.month;
  const [sheet, setSheet] = useState(false);
  const head = <><p className="eyebrow">{MONTHS[m]} · Month {m + 1} of 12</p><h1>{PLAY_TITLES[m]}</h1><PotsStrip state={state} /><Cure month={m} /></>;
  // b2 (12 Nov): a single Continue-type move is the filled button; the choices in a decision month are all neutral, so
  // no answer (least of all the scam one) looks recommended.
  const button = (label: string, action: Action, choice = false) => <button type="button" className={choice ? 'secondary book-game-choice' : ''} disabled={busy} onClick={() => onAct(action)}>{label}</button>;
  let body: ReactNode, moves: ReactNode;
  if (m === 0 || m === 10) {
    const sp = SPLIT[state.pendingSplit]!;
    const room = Math.max(0, CUSHION_TARGET - state.pots.cushion);
    const raise = m === 10 && state.course && state.pendingSplit > 0 ? 3000 : 0;
    body = <Scene kind={`Salary credited · ${fmt(m === 10 && state.course ? 28000 : 25000)}`} icon="₹"><b>Choose what stays with you.</b>
      <div className="book-game-chips" role="group" aria-label="Salary split">{SPLIT.map((x, j) => <button type="button" key={x.total} className={state.pendingSplit === j ? '' : 'secondary'} aria-pressed={state.pendingSplit === j} onClick={() => onChange({ ...state, pendingSplit: j })}>{fmt(x.total)}<small>{['0%', '10%', '20%', '30%'][j]}</small></button>)}</div>
      <p className="small">Mine {fmt(sp.mine + Math.max(0, sp.cushion - room) + raise)} · Cushion {fmt(Math.min(sp.cushion, room))}</p>
      <p className="small">Rent / PG ₹8,000 · Food ₹6,000 · Travel + phone ₹2,500</p></Scene>;
    moves = button('Continue', 'split-commit');
  } else if (m === 1) {
    body = <><Scene kind="Your monthly auto-charges" icon="↻">These renewed after payday. Swipe left to cancel one; a tap works too.</Scene>
      <SubsList state={state} onChange={onChange} />
      <p className="small">Stopped this month: <b>{fmt(state.subs.reduce((n, v, i) => n + (v ? SUBS[i]![1] : 0), 0))}</b> · stays in Cushion each month.</p></>;
    moves = button('Continue', 'feb-commit');
  } else if (SCENARIOS[m]) {
    const d = SCENARIOS[m]!;
    const counts = signCounts(m, state.found);
    let index = -1;
    body = <><p className="small book-game-hint"><Cast name="Chiku" pose="idle" size={32} />{m === 2 ? 'Hmm, read that again. Tap a dotted phrase.' : 'Tap any dotted phrase that stands out.'}</p>
      <Scene kind={d.kind} icon={d.icon}><p className="book-game-message">{messageParts(m).map((part, i) => {
        if (typeof part === 'string') return <span key={i}>{part}</span>;
        index += 1;
        const at = index, found = !!state.found[at];
        return <button type="button" key={i} className={`book-game-phrase${found ? ` is-${part.tag}` : ''}`} aria-pressed={found} onClick={() => onChange({ ...state, found: { ...state.found, [at]: true } })}>
          {part.text}{found && <span className="book-game-tag"> · {TAG_TEXT[part.tag]}: {part.label}</span>}</button>;
      })}</p></Scene>
      <p className="small book-game-signs">Warnings {counts.red} · Good signs {counts.green} · Other {counts.grey}</p></>;
    moves = <>{button('Say yes', 'yes', true)}<button type="button" className="secondary book-game-choice" onClick={() => setSheet(true)}>Check first</button>{button('Say no', 'no', true)}</>;
  } else if (m === 4) {
    // a9's ≤35-word rule (spec 40 §6): the approved line, trimmed from 43 words with its meaning kept.
    body = <Scene kind="Recurring deposit-style choice" icon="↗">Move ₹3,000 to Growing? It adds ₹40 a month (fictional).</Scene>;
    moves = <>{button('Move ₹3,000', 'invest', true)}{button('Keep in Mine', 'keep', true)}</>;
  } else if (m === 7) {
    const covered = state.pots.cushion >= 10000;
    body = <Scene kind="Laptop repair desk" icon="▣">Your laptop will not start. {covered ? `The ₹10,000 repair fits in your Cushion (${fmt(state.pots.cushion)}).` : 'Rushed, it costs ₹12,000; your Cushion is short.'}</Scene>;
    moves = button('Handle the repair', 'repair');
  } else if (m === 8) {
    body = <Scene kind="Weekend course · practical work" icon="✎">A ₹3,000 course could add ₹3,000 a month to November’s pay.</Scene>;
    moves = <>{button('Take the course', 'course', true)}{button('Skip it', 'skip', true)}</>;
  } else if (m === 9) {
    body = <><Scene kind="Festival group chat" icon="✦">{state.lent ? 'Rohan offers a ₹1,000 gig. Pick one festival number first.' : 'Gifts and sales: pick one number before browsing.'}</Scene>
      <div className="card"><b>Festival budget: {fmt(state.festival)}</b><div className="book-game-chips" role="group" aria-label="Festival budget">{FESTIVAL_CHOICES.map(n => <button type="button" key={n} className={state.festival === n ? '' : 'secondary'} aria-pressed={state.festival === n} onClick={() => onChange({ ...state, festival: n })}>{fmt(n)}</button>)}</div></div></>;
    moves = button('Continue', 'festival-commit');
  } else {
    body = <Scene kind="December · your year" icon="◷">{state.course ? 'The course raised your pay. ' : 'Your pay stayed steady. '}{state.invested ? 'Growing grew (a fictional example).' : state.skippedGrowthPotential ? 'Growing missed ₹280 (an example).' : 'Growing stayed empty, a valid choice.'}</Scene>;
    moves = button('See my year', 'dec-commit');
  }
  return <section className="screen book-game book-game-play" data-month={MONTH_IDS[m]}>
    {head}{body}<GoalBar state={state} />
    <BottomActions>{moves}</BottomActions>
    {sheet && SCENARIOS[m] && <CheckFirst month={m} busy={busy} onClose={() => setSheet(false)} onAct={action => { setSheet(false); onAct(action); }} />}
  </section>;
}

/** February: swipe left on a charge to cancel it (a tap works too). */
function SubsList({ state, onChange }: { state: ArkadState; onChange: (next: ArkadState) => void }) {
  const startX = useRef<number | null>(null), swiped = useRef<number | null>(null);
  const toggle = (i: number, value?: boolean) => onChange({ ...state, subs: state.subs.map((v, j) => j === i ? value ?? !v : v) });
  return <ul className="book-game-subs">{SUBS.map(([name, price], i) => <li key={name}>
    <button type="button" className={state.subs[i] ? 'is-off' : ''} aria-pressed={state.subs[i]} aria-label={`Cancel ${name}`}
      onPointerDown={event => { startX.current = event.clientX; }}
      onPointerUp={event => { if (startX.current !== null && startX.current - event.clientX > 30) { swiped.current = i; toggle(i, true); } startX.current = null; }}
      onClick={() => { if (swiped.current === i) { swiped.current = null; return; } toggle(i); }}>
      <span>{name}</span><b>{state.subs[i] ? 'Off' : `${fmt(price)}/mo ←`}</b></button></li>)}</ul>;
}

function CheckFirst({ month, busy, onClose, onAct }: { month: number; busy: boolean; onClose: () => void; onAct: (action: Action) => void }) {
  const focusRef = useModalFocus<HTMLElement>(onClose);
  const [answer, setAnswer] = useState<number | null>(null);
  const d = SCENARIOS[month]!;
  return <div className="sheet-backdrop" onClick={onClose}><section ref={focusRef} tabIndex={-1} className="ui-sheet task-sheet book-game-sheet" role="dialog" aria-modal="true" aria-label="Check first" onClick={event => event.stopPropagation()}>
    <h2>Who would you ask?</h2>
    <div className="book-game-experts">{d.experts.map(([name], i) => <button type="button" key={name} className={answer === i ? '' : 'secondary'} aria-pressed={answer === i} onClick={() => setAnswer(i)}>{name}</button>)}</div>
    {answer !== null && <><p className="book-game-answer" role="status"><b>{d.experts[answer]![0]}:</b> {d.experts[answer]![1]}</p>
      <div className="sheet-actions"><button type="button" className="secondary book-game-choice" disabled={busy} onClick={() => onAct('yes')}>Say yes</button><button type="button" className="secondary book-game-choice" disabled={busy} onClick={() => onAct('no')}>Say no</button></div></>}
    <button type="button" className="secondary" onClick={onClose}>Back to message</button>
  </section></div>;
}

function ResultView({ state, month, footer, readOnly }: { state: ArkadState; month: number; footer: ReactNode; readOnly?: boolean }) {
  const result = state.results[month];
  if (!result) return null;
  const delta = result.after - result.before;
  const covered = month === 7 && result.moves.some(x => x.pot === 'cushion' && x.delta === -10000);
  const headline = covered ? 'Repair paid: ₹10,000 from Cushion' : month === 9 ? `Festival: ${fmt(-result.moves.filter(x => x.label === 'Festival budget spent').reduce((n, x) => n + x.delta, 0))} spent` : signed(delta);
  const rows = ledgerRows(result.moves);
  return <section className="screen book-game book-game-result" data-month={MONTH_IDS[month]}>
    <p className="eyebrow">{MONTHS[month]} · What happened{readOnly ? ' · played' : ''}</p><h1>{month === 11 ? 'Your first year' : RESULT_TITLES[month]}</h1>
    <div className="card"><span className={`book-game-stamp${delta < 0 ? ' is-warn' : ''}`}>{result.stamp}</span>
      <p className="book-game-delta">{headline}</p>{covered && <p className="small">Mine untouched</p>}
      <p className="book-game-net">Net worth: {fmt(result.before)} → {fmt(result.after)}</p>
      <ul className="book-game-ledger">{(rows.length ? rows : [{ label: 'No pot move this month', value: 0, month }]).slice(0, 4).map(row => <li key={row.label}><span>{row.label}</span><strong>{signed(row.value)}</strong></li>)}</ul>
      <p>{result.text}</p></div>
    <div className="card"><p className="book-game-lesson">Arkad's lesson: {result.lesson}</p><p className="small">Try next: {result.habit}</p></div>
    {!readOnly && <PotsStrip state={state} />}
    <BottomActions>{footer}</BottomActions>
  </section>;
}

function YearEnd({ state, footer }: { state: ArkadState; footer: ReactNode }) {
  const goal = GOALS[state.goal ?? 0]!, best = bestMove(state);
  return <section className="screen book-game book-game-end">
    <p className="eyebrow">December · Year in review</p><h1>Your first year</h1>
    <div className="card"><h2>{fmt(net(state))} net worth</h2><p className="small">Mine {fmt(state.pots.mine)} + Cushion {fmt(state.pots.cushion)} + Growing {fmt(state.pots.growing)}{state.debt ? ` − unpaid repair bill ${fmt(state.debt)}` : ''}</p><GoalBar state={state} /></div>
    <div className="card"><h3>Your pots across 12 months</h3><YearChart state={state} /></div>
    <div className="book-game-compare"><div>You<strong>{fmt(net(state))}</strong><small>Your actual choices</small></div><div>Kept nothing<strong>{fmt(simulate('nothing'))}</strong><small>No cushion, so the repair became a ₹12,000 bill.</small></div><div>Said yes to everything<strong>{fmt(simulate('yes'))}</strong><small>Fees and phone costs</small></div></div>
    <div className="card small"><p><b>Goal:</b> {goalSaved(state) >= goal.amount ? `You reached ${goal.name}.` : `You reached ${Math.max(0, Math.round(goalSaved(state) / goal.amount * 100))}% of ${goal.name}.`} No grade, just a useful map.</p>
      <p><b>Best move:</b> {best[0]}. {best[1]}</p><p><b>Try differently:</b> {tryDifferent(state)}</p></div>
    <div className="card small"><h3>Three habits for next month</h3><p>1. Move a part on salary day.</p><p>2. Check the person and fee before paying.</p><p>3. Keep Cushion for surprises.</p></div>
    <details className="card"><summary>See every pot move</summary><ul className="book-game-ledger">{ledgerRows(state.ledger, true).map(row => <li key={`${row.month}-${row.label}-${row.value > 0}`}><span>{MONTHS[row.month]} · {row.label}</span><strong>{signed(row.value)}</strong></li>)}</ul></details>
    <p className="small book-game-note">This is a fictional learning game. Growth and outcomes are examples, not promises or personal financial advice. One tenth is Arkad's story rule, not an amount that fits every home.</p>
    <BottomActions>{footer}</BottomActions>
  </section>;
}

function YearChart({ state }: { state: ArkadState }) {
  const h = state.history, max = Math.max(10000, ...h.map(x => Math.max(x?.mine ?? 0, x?.cushion ?? 0, x?.growing ?? 0)));
  const points = (key: Pot) => h.map((x, i) => `${23 + i * 25},${112 - (x?.[key] ?? 0) / max * 91}`).join(' ');
  return <><svg className="book-game-chart" viewBox="0 0 360 145" role="img" aria-label="Line chart of Mine, Cushion and Growing from January to December">
    <path d="M22 112H304M22 65H304M22 20H304" className="grid" />
    <text x="2" y="24">{Math.round(max / 1000)}k</text><text x="20" y="133">Jan</text><text x="275" y="133">Dec</text>
    <polyline className="is-mine" points={points('mine')} /><polyline className="is-cushion" points={points('cushion')} /><polyline className="is-growing" points={points('growing')} />
    {/* b2: each line also carries its name at its end, so the pots read apart in greyscale too. */}
    {(['mine', 'cushion', 'growing'] as const).map(key => { const last = h[11] ?? h.filter(Boolean).at(-1); return last ? <text key={key} className={`end is-${key}`} x="306" y={Math.max(10, Math.min(116, 112 - (last[key] ?? 0) / max * 91 + 3))}>{key === 'mine' ? 'Mine' : key === 'cushion' ? 'Cushion' : 'Growing'}</text> : null; })}
  </svg><p className="small book-game-legend"><span className="is-mine">━ Mine</span> · <span className="is-cushion">╍ Cushion</span> · <span className="is-growing">┈ Growing (fictional example)</span></p></>;
}

function ArkadPortrait() {
  return <svg className="book-game-portrait" viewBox="0 0 110 130" role="img" aria-label="Arkad">
    <path d="M17 126Q20 82 42 69h31q22 17 25 57Z" fill="#477169" /><ellipse cx="56" cy="51" rx="29" ry="34" fill="#b97b59" />
    <path d="M26 47Q27 10 57 12q30 0 29 35Q72 25 57 25Q39 25 26 47" fill="#3d3838" />
    <path d="M24 33q7-32 33-30 27 1 34 30l-9 6q-24-16-49 0Z" fill="#8d5d4d" stroke="#e3bb80" strokeWidth="3" />
    <circle cx="46" cy="53" r="2.4" /><circle cx="68" cy="53" r="2.4" /><path d="M41 75q16 12 31 0" fill="none" stroke="#e2b779" strokeWidth="2" />
  </svg>;
}

/** The book page's one card for its game: "Play it · Your first year", n/12 and the next month (or why not yet). */
export function BookGameCard({ bookId }: { bookId: string }) {
  const game = BOOK_GAMES[bookId];
  const data = useGame(bookId);
  if (!game || !data) return null;
  const chapters = chaptersDone(game, data.done), played = playedMonths(data.state), progress = yearProgress(chapters, played);
  const line = played.size >= 12 ? 'Year complete' : progress.next !== null ? `Next: ${FULL[progress.next]}` : chapters === 0 ? 'Finish a chapter to open January' : 'Finish the next chapter to open more months';
  return <button type="button" className="card book-game-card" data-testid="book-game-card" onClick={() => go(`grow/read/game/${bookId}`)}>
    <span className="eyebrow">Play it</span><strong>{game.title}</strong><span className="small">{played.size}/12 · {line}</span></button>;
}

