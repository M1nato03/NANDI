import { useEffect, useRef, useState } from 'react';
import { chikuMatches, chikuOrder, type ChikuAct, type ChikuScene } from '../../core/learn/chiku';
import { Chiku, type Pose } from '../cast/Cast';
import { ChikuPropArt } from './ChikuProps';

/**
 * Spec 30: Chiku is stuck on the lesson's idea; the learner hands over one card; Chiku acts out what that card
 * predicts on a new day, then the scene replays what really happened. The mistake always belongs to Chiku and the
 * card. No red, no score, no timer; a tap anywhere skips to the end of the current beat; Skip is always there.
 */
type Beat = 'ask' | 'take' | 'newday' | 'guess' | 'truth' | 'done';
const NEXT: Partial<Record<Beat, Beat>> = { take: 'newday', newday: 'guess', guess: 'truth', truth: 'done' };
// Under 6 seconds a playthrough (spec 30): each timed beat, in ms.
const LENGTH: Partial<Record<Beat, number>> = { take: 400, newday: 1200, guess: 1900, truth: 1700 };
const ACT_ITEM: Partial<Record<ChikuAct, 'phone' | 'book' | 'plate' | 'coin' | 'bed'>> = { 'pull-phone': 'phone', 'pat-pocket': 'phone', 'open-book': 'book', 'close-book': 'book', eat: 'plate', pay: 'coin', sleep: 'bed' };
const POSE: Record<Beat, Pose> = { ask: 'think', take: 'idle', newday: 'idle', guess: 'think', truth: 'idle', done: 'idle' };

export function ChikuStage({ scene, seed, onPlayed, onDone }: { scene: ChikuScene; seed: string; onPlayed: (card: number, matched: boolean) => void; onDone: () => void }) {
  const [order] = useState(() => chikuOrder(seed, scene.cards.length));
  const [beat, setBeat] = useState<Beat>('ask');
  const [card, setCard] = useState<number | null>(null);
  const [tried, setTried] = useState<number[]>([]);
  const played = useRef(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  // After a card is handed over, focus moves to the scene so a keyboard or screen reader follows the beats.
  useEffect(() => { if (beat === 'take') sceneRef.current?.focus(); }, [beat]);
  // On open, focus goes to the scene too, so Chiku's question is read first (Codex B item 111).
  useEffect(() => { sceneRef.current?.focus(); }, []);
  useEffect(() => {
    const length = LENGTH[beat];
    if (!length) return;
    const timer = window.setTimeout(() => setBeat(current => current === beat ? NEXT[beat] ?? current : current), length);
    return () => window.clearTimeout(timer);
  }, [beat]);
  useEffect(() => {
    if (beat !== 'done' || card === null || played.current) return;
    played.current = true;
    onPlayed(card, chikuMatches(scene, card));
  }, [beat, card, scene, onPlayed]);
  const skipBeat = () => { const next = NEXT[beat]; if (next) setBeat(next); };
  const pick = (index: number) => { setCard(index); setTried(current => current.includes(index) ? current : [...current, index]); setBeat('take'); };
  const guess = card === null ? undefined : scene.guesses[card];
  const matched = card !== null && chikuMatches(scene, card);
  const act = beat === 'guess' ? guess?.act : beat === 'truth' || beat === 'done' ? scene.truth.act : undefined;
  const item = act ? ACT_ITEM[act] : undefined;
  const pose: Pose = beat === 'done' ? (matched ? 'cheer' : 'think') : act === 'sleep' ? 'rest' : POSE[beat];
  const moment = beat === 'done' ? (matched ? 'right' : 'wrong') : beat === 'ask' ? 'stuck' : beat;
  const caption = beat === 'newday' ? scene.newDay.caption : beat === 'guess' ? guess?.why : beat === 'truth' ? scene.truth.caption : undefined;
  const cardText = card === null ? '' : scene.cards[card]!.text;
  // One polite live region reads each beat (Codex B item 110); the visible captions carry no roles of their own.
  const said = beat === 'ask' ? (tried.length ? 'Got another card?' : scene.ask) : beat === 'take' ? `You gave Chiku: ${cardText}.` : beat === 'guess' ? `${scene.newDay.question} ${caption ?? ''}` : beat === 'done' ? (matched ? 'Got it, because your card named the real cause.' : `My card said "${cardText}", so I guessed ${guess?.answer}. It went the other way. Got another card?`) : caption ?? '';
  // A tap anywhere in the scene, or Enter or Space on it, skips to the next beat; buttons keep their own job.
  const skipFrom = (target: EventTarget) => { if (!(target as HTMLElement).closest('button')) skipBeat(); };
  const timed = !!NEXT[beat];
  return <section className="chiku-step" aria-label="Teach Chiku" data-beat={beat}>
    <p className="sr-only" aria-live="polite">{said}</p>
    <div className="chiku-scene" ref={sceneRef} tabIndex={-1} role="group" aria-label="Chiku's scene" onClick={event => skipFrom(event.target)} onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && timed && event.target === event.currentTarget) { event.preventDefault(); skipBeat(); } }}>
      <div className="chiku-stage" role="presentation">
        {beat !== 'ask' && <ChikuPropArt prop={scene.newDay.prop} className={`chiku-prop${beat === 'take' ? ' waiting' : ''}`} />}
        <span className={`chiku-actor chiku-${moment}${act ? ` chiku-act-${act}` : ''}`} key={`${beat}-${card ?? ''}`} data-moment={moment} data-act={act ?? ''}>
          <Chiku pose={pose} size={84} title="Chiku" />
          {item && <span className={`chiku-item chiku-item-${item}${act === 'pat-pocket' || act === 'close-book' ? ' away' : ''}`} aria-hidden="true"><ChikuPropArt prop={item} /></span>}
          {beat === 'take' && <span className="chiku-card-held" aria-hidden="true">{cardText}</span>}
        </span>
        {beat === 'ask' && <span className="chiku-think-bubble" aria-hidden="true">?</span>}
      </div>
      {beat === 'ask' && <><p className="chiku-say">{tried.length ? 'Got another card?' : scene.ask}</p>
        <div className="chiku-cards" role="group" aria-label="Your cards">{order.map(index => <button type="button" key={index} className={`chiku-card${tried.includes(index) ? ' tried' : ''}`} onClick={() => pick(index)}>{scene.cards[index]!.text}</button>)}</div></>}
      {caption && <p className="chiku-caption" key={beat}>{beat === 'guess' && <span className="chiku-question">{scene.newDay.question} </span>}{caption}</p>}
      {beat === 'done' && <div className="chiku-end">
        <p className="chiku-caption">{scene.truth.caption}</p>
        <p className="chiku-say">{matched ? 'Got it, because your card named the real cause.' : `My card said "${cardText}", so I guessed ${guess?.answer}. It went the other way. Got another card?`}</p>
        {matched ? <button type="button" onClick={onDone}>Done</button> : <div className="chiku-cards" role="group" aria-label="Your cards">{order.map(index => <button type="button" key={index} className={`chiku-card${tried.includes(index) ? ' tried' : ''}`} onClick={() => pick(index)}>{scene.cards[index]!.text}</button>)}</div>}
      </div>}
      {timed && <button type="button" className="text-button chiku-next" onClick={skipBeat}>Skip ahead</button>}
    </div>
    <button type="button" className="text-button chiku-skip" onClick={onDone}>Skip</button>
  </section>;
}
