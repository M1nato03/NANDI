import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { dayKey } from '../../core/time';
import { finishedSeasons, resultWords, seasonResult, type SeasonResult } from '../../core/economy/seasonResult';
import { useModalFocus } from '../shell/useModalFocus';
import { go } from '../shell/router';
import { Cast } from '../cast/Cast';

/** The result's words on a sheet: the season, a headline by tier, its real facts and a fresh start. Shared by the page and the list. */
export function ResultSheet({ result, today, headingLevel = 2 }: { result: SeasonResult; today: string; headingLevel?: 1 | 2 }) {
  const words = resultWords(result, today);
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return <>
    <div className="level-top"><p className="eyebrow">{words.eyebrow}</p><span className="level-mark" aria-hidden="true">{result.tier}</span></div>
    <Heading>{words.headline}</Heading>
    <p className="season-result-facts">{words.facts}</p>
    <p className="level-note">{words.closing}</p>
  </>;
}

/**
 * Spec 47c: the season result page, once, on the first ordinary open after a season ends. It is a notebook sheet like
 * the level page: Continue and Skip both close it, and "See your useful days" opens the record. Nothing waits on it:
 * XP, Shards and the new season go on whether it is read or skipped.
 */
export function SeasonResultPage({ result, close }: { result: SeasonResult; close: () => void }) {
  const dialog = useModalFocus<HTMLDivElement>(close);
  const today = dayKey(Date.now()); // eslint-disable-line react-hooks/purity
  return <div ref={dialog} tabIndex={-1} className="economy-reveal level-page season-result" role="dialog" aria-modal="true" aria-label={`Season ${result.index + 1} result`}>
    <section className="level-sheet paper">
      <ResultSheet result={result} today={today} />
      <div className="season-result-friends" aria-hidden="true"><Cast name="Nandi" pose="idle" size={46} /><Cast name="Kachhua" pose="idle" size={46} /></div>
      <button type="button" onClick={close}>Continue</button>
      <div className="season-result-more"><button type="button" className="text-button" onClick={() => { close(); go('yatra/days'); }}>See your useful days</button><button type="button" className="text-button" onClick={close}>Skip</button></div>
    </section>
  </div>;
}

/** Spec 47c: every finished season's result, newest first, to read again by choice (from the record). */
export function PastResults() {
  const source = useLiveQuery(async () => ({ facts: await db.ledger.toArray(), settings: await db.settings.toArray() }), []);
  const today = dayKey(Date.now()); // eslint-disable-line react-hooks/purity
  if (!source) return <section className="screen" role="status">Opening past results…</section>;
  const seasons = finishedSeasons(today).reverse();
  return <section className="screen season-results"><p className="eyebrow">Your record</p><h1>Past seasons</h1>
    {seasons.length ? seasons.map(season => <article key={season.start} className="level-sheet paper season-result-card" aria-label={`Season ${season.index + 1}`}>
      <ResultSheet result={seasonResult(source.facts, source.settings, season)} today={today} />
    </article>) : <p>A season's result is kept here once it ends.</p>}
  </section>;
}
