import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { dayKey } from '../../core/time';
import { finishedSeasons, resultFacts, resultWords, seasonLine, seasonResult, type SeasonResult } from '../../core/economy/seasonResult';
import { useModalFocus } from '../shell/useModalFocus';
import { go } from '../shell/router';
import { Cast } from '../cast/Cast';

/** The result's words on a sheet: the season, a headline by tier, its real facts and a fresh start. */
function ResultSheet({ result, today }: { result: SeasonResult; today: string }) {
  // No goal profile exists yet (spec 42), so the facts carry no goal phrase.
  const words = resultWords(result, today, false);
  return <>
    <div className="level-top"><p className="eyebrow">{words.eyebrow}</p><span className="level-mark">{result.tier}</span></div>
    <h2>{words.headline}</h2>
    <p className="season-result-facts">{words.facts}</p>
    <p className="level-note">{words.closing}</p>
  </>;
}
const FRIENDS = ['Mor', 'Chiku', 'Nandi', 'Kapi', 'Kachhua'] as const;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce';

/**
 * Spec 47c: the season result page, once, on the first ordinary open after a season ends. It is a notebook sheet like
 * the level page: Continue and Skip both close it, and "See your useful days" opens the record. Nothing waits on it:
 * XP, Shards and the new season go on whether it is read or skipped.
 */
export function SeasonResultPage({ result, close }: { result: SeasonResult; close: () => void }) {
  const dialog = useModalFocus<HTMLDivElement>(close);
  const today = dayKey(Date.now()); // eslint-disable-line react-hooks/purity
  // Focus starts on the sheet itself, so its words are read first and a phone open draws no ring on Continue.
  const holdFocus = (node: HTMLDivElement | null) => { if (node && !node.contains(document.activeElement)) node.focus({ preventScroll: true }); dialog(node); };
  return <div ref={holdFocus} tabIndex={-1} className="economy-reveal level-page season-result" role="dialog" aria-modal="true" aria-label={`Season ${result.index + 1} result`}>
    <section className={`level-sheet paper${reducedMotion() ? ' is-still' : ''}`}>
      <ResultSheet result={result} today={today} />
      {/* All five friends, as on the level page: the season was everyone's. */}
      <div className="level-scene season-result-scene" aria-hidden="true"><div className="level-friends">{FRIENDS.map((name, index) => <span key={name} style={{ animationDelay: `${index * 90}ms` }}><Cast name={name} pose={name === 'Kachhua' ? 'idle' : 'cheer'} size={40} /></span>)}</div></div>
      <button type="button" onClick={close}>Continue</button>
      <div className="season-result-more"><button type="button" className="text-button" onClick={() => { close(); go('yatra/days'); }}>See your useful days</button><button type="button" className="text-button" onClick={close}>Skip</button></div>
    </section>
  </div>;
}

/** Spec 47c: every finished season, newest first, as one compact row: the season, its tier stamp, its facts. */
export function PastResults() {
  const source = useLiveQuery(async () => ({ facts: await db.ledger.toArray(), settings: await db.settings.toArray() }), []);
  const today = dayKey(Date.now()); // eslint-disable-line react-hooks/purity
  if (!source) return <section className="screen" role="status">Opening past results…</section>;
  const seasons = finishedSeasons(today).reverse();
  return <section className="screen season-results"><p className="eyebrow">Your record</p><h1>Past seasons</h1>
    {seasons.length ? <ol className="season-result-rows">{seasons.map(season => {
      const result = seasonResult(source.facts, source.settings, season);
      return <li key={season.start} className="card season-result-row" aria-label={`Season ${season.index + 1}`}>
        <div className="season-result-row-top"><h2>{seasonLine(result)}</h2><span className="level-mark">{result.tier}</span></div>
        <p>{resultFacts(result)}</p>
      </li>;
    })}</ol> : <p>A season's result is kept here once it ends.</p>}
  </section>;
}
