import { db } from '../../data/db';
import { answerOffer } from '../../data/repos/picks';
import { PAUSE_OFFER_KEY } from '../../core/pauseOffer';
import { recordError } from '../errorRing';
import { go } from '../shell/router';
import { useModalFocus } from '../shell/useModalFocus';
import './pause.css';

/** Spec 52 D: the one-time offer after the first finish. "Set it up" opens the existing setup; "Not now" is final. */
export function PauseOffer({ close }: { close: () => void }) {
  const answer = (value: 'set-up' | 'not-now') => { void answerOffer(db, PAUSE_OFFER_KEY, value, Date.now()).catch(error => recordError('promise', error)); close(); };
  const dialog = useModalFocus<HTMLElement>(() => answer('not-now'));
  return <div className="sheet-backdrop" onClick={() => answer('not-now')}>
    <section ref={dialog} tabIndex={-1} className="task-sheet pause-offer" role="dialog" aria-modal="true" aria-labelledby="pause-offer-line" onClick={event => event.stopPropagation()}>
      <p id="pause-offer-line" className="pause-offer-line">Want NANDI to catch you when you open Instagram or YouTube?</p>
      <div className="pause-offer-actions">
        <button type="button" onClick={() => { answer('set-up'); go('plan/pause'); }}>Set it up</button>
        <button type="button" className="text-button" onClick={() => answer('not-now')}>Not now</button>
      </div>
    </section>
  </div>;
}
