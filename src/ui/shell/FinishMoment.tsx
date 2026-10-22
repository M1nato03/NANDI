import { RULES } from '../../core/rules.config';
import { Cast, Nandi } from '../cast/Cast';
import { finishCast } from '../cast/placement';
import type { FinishActivity } from './finish';
import { useModalFocus } from './useModalFocus';

export function FinishMoment({ line, gain = 0, shownXp = 0, reduced, activity = 'task' }: { line: string; gain?: number; shownXp?: number; reduced: boolean; activity?: FinishActivity }) {
  return <div className={`economy-toast finish-moment${reduced ? '' : ' finish-bloom'}`} role="status"><Cast {...finishCast[activity]} size={38} /><span>{gain > 0 && <>+{shownXp} XP · </>}{line}</span></div>;
}

export function DoneForToday({ close, reduced, suggestion }: { close: () => void; reduced: boolean; suggestion?: string | null }) {
  const dialog = useModalFocus<HTMLDivElement>(close);
  return <div ref={dialog} tabIndex={-1} className="economy-reveal" role="dialog" aria-modal="true" aria-label="Done for today"><div className={`economy-reveal-card done-for-today${reduced ? '' : ' finish-bloom'}`} style={{ '--finish-duration': `${RULES.juice.mesoMs[1]}ms` } as React.CSSProperties}><Nandi pose="rest" size={80} /><h2>Done for today.</h2><p>The rest of the day is yours.</p>{suggestion && <p className="done-suggestion">Something you enjoy: {suggestion}.</p>}<button type="button" onClick={close}>Close</button></div></div>;
}
