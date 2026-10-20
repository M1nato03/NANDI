import { RULES } from '../../core/rules.config';

export function FinishMoment({ line, gain = 0, shownXp = 0, reduced }: { line: string; gain?: number; shownXp?: number; reduced: boolean }) {
  return <div className={`economy-toast finish-moment${reduced ? '' : ' finish-bloom'}`} role="status"><span className="finish-check" aria-hidden="true">✓</span><span>{gain > 0 && <>+{shownXp} XP · </>}{line}</span></div>;
}

export function DoneForToday({ close, reduced }: { close: () => void; reduced: boolean }) {
  return <div className="economy-reveal" role="dialog" aria-modal="true" aria-label="Done for today"><div className={`economy-reveal-card done-for-today${reduced ? '' : ' finish-bloom'}`} style={{ '--finish-duration': `${RULES.juice.mesoMs[1]}ms` } as React.CSSProperties}><span className="finish-check" aria-hidden="true">✓</span><h2>Done for today.</h2><p>The rest of the day is yours.</p><button type="button" onClick={close}>Close</button></div></div>;
}
