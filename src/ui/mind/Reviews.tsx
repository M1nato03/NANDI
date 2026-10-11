import { useState } from 'react';
import { itemOptions, type DeckPack, type ReviewEntry } from '../../core/learn/deck';
import { db } from '../../data/db';
import { hideReview, reviewCard, reviewItem } from '../../data/repos/learn';
import type { CardRow, DeckProgRow } from '../../data/types';
import { recordError } from '../errorRing';
import { nightMindNote } from './economyVisibility';

type Props = { entries: ReviewEntry[]; cards: CardRow[]; progress: DeckProgRow[]; deck: DeckPack; lessonCards: Record<string, [string, string]>; afterBedtime: boolean; economyVisible: boolean; onDone: () => void };
export function Reviews({ entries: initial, cards, progress, deck, lessonCards, afterBedtime, economyVisible, onDone }: Props) {
  const [entries, setEntries] = useState(initial);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [options] = useState(() => Object.fromEntries(deck.body.items.map(item => [item.id, itemOptions(item, deck)])));
  const entry = entries[index];
  if (!entry) return <section className="screen mind-review"><h1>Reviews complete.</h1><button type="button" onClick={onDone}>Back to Mind</button></section>;
  const card = entry.kind === 'card' ? cards.find(row => row.id === entry.id) : undefined;
  const content = card ? (card.deckId === 'greene' ? deck.body.cards.find(row => row.id === card.id) : null) : null;
  const item = entry.kind === 'item' ? deck.body.items.find(row => row.id === entry.id) : undefined;
  const front = content?.front ?? lessonCards[entry.id]?.[0] ?? 'Card unavailable';
  const back = content?.back ?? lessonCards[entry.id]?.[1] ?? 'Card unavailable';
  const next = () => { setIndex(value => value + 1); setRevealed(false); setPicked(null); setHint(false); setError(''); };
  const gradeCard = async (correct: boolean) => {
    if (!card || busy) return;
    setBusy(true);
    try { await reviewCard(db, card, correct, afterBedtime); if (!correct && !entries.some((row, i) => i > index && row.id === entry.id)) setEntries(value => [...value, entry]); next(); }
    catch (cause) { recordError('window', cause); setError('Review did not save. Try again.'); }
    finally { setBusy(false); }
  };
  const answerItem = async (position: number) => {
    if (!item || busy || picked !== null) return;
    setBusy(true);
    try { await reviewItem(db, progress.find(row => row.id === item.id) ?? null, item.id, item.t, item.d, position === options[item.id]!.answer, hint, afterBedtime); setPicked(position); }
    catch (cause) { recordError('window', cause); setError('Review did not save. Try again.'); }
    finally { setBusy(false); }
  };
  const hide = async () => {
    setBusy(true);
    try { await hideReview(db, entry.kind === 'card' ? `card:${entry.id}` : entry.id); next(); }
    catch (cause) { recordError('window', cause); setError('Could not hide this review.'); }
    finally { setBusy(false); }
  };
  return <section className="screen mind-review"><p className="eyebrow">Daily reviews · {index + 1} of {entries.length}</p>{afterBedtime && <p role="status">{nightMindNote(economyVisible)}</p>}<h1>{entry.kind === 'card' ? 'Recall card' : item?.t === 'spot' ? 'Spot the tell' : item?.t === 'mystery' ? 'Mini mystery' : item?.t === 'teaser' ? 'Teaser' : 'Scenario'}</h1><article className="card" aria-label="Review card">
    {entry.kind === 'card' ? <><p className="mind-review-front">{front}</p>{revealed ? <><div className="mind-feedback"><p>{back}</p></div><p>Did you remember it?</p><div className="mind-review-actions"><button type="button" className="secondary" disabled={busy} onClick={() => void gradeCard(false)}>Again</button><button type="button" disabled={busy} onClick={() => void gradeCard(true)}>Got it</button></div></> : <button type="button" onClick={() => setRevealed(true)}>Reveal answer</button>}</> : item ? <>
      {item.t === 'scenario' && <p className="mind-scene">{item.scene} {item.text}</p>}
      {item.t === 'spot' && <><p>{item.who} {item.sub}</p>{item.msgs.map(([who, text], i) => <p className="mind-chat" key={i}>{who}: {text}</p>)}</>}
      {item.t === 'mystery' && <><h2>{item.title}</h2><p>{item.text}</p><ul>{item.clues.map((clue, i) => <li key={i}>{clue}</li>)}</ul></>}
      {item.t === 'teaser' && <p className="mind-scene">{item.text}</p>}
      <p className="mind-lesson-question">{item.t === 'spot' ? 'What is the tell?' : item.t === 'teaser' ? 'What follows?' : item.q}</p>
      <div className="mind-lesson-options">{options[item.id]!.options.map((option, i) => <button type="button" className="secondary" key={i} disabled={picked !== null || busy} onClick={() => void answerItem(i)}>{option}</button>)}</div>
      {'hint' in item && item.hint && picked === null && <button type="button" className="text-button" onClick={() => setHint(true)}>Hint</button>}{hint && 'hint' in item && <p>{item.hint}</p>}
      {picked !== null && <><div className="mind-feedback" role="status"><strong>{picked === options[item.id]!.answer ? 'Right.' : 'Not quite.'}</strong><p>Answer: {options[item.id]!.options[options[item.id]!.answer]}</p><p>{item.why}</p></div><button type="button" onClick={next}>Continue</button></>}
    </> : <p>Review unavailable.</p>}
    <button type="button" className="text-button" disabled={busy} onClick={() => void hide()}>Confusing or wrong? Hide it</button>{error && <p role="alert">{error}</p>}
  </article></section>;
}
