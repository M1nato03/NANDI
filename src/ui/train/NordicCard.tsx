import { useState } from 'react';

const checks = ['I have a resistance band', 'I have a secure ankle hold (a partner, or a heavy sofa that will not move)', 'I have a mat or folded towel for my knees'] as const;

/** Spec 17: the Nordic ready card. "I'm ready" waits for all three ticks; neither button earns XP or writes a ledger fact. */
export function NordicCard({ busy, answer }: { busy: boolean; answer: (choice: 'ready' | 'not-now') => void }) {
  const [ticked, setTicked] = useState<boolean[]>(() => checks.map(() => false));
  return <section className="card" aria-label="Ready for a harder hamstring move?"><h2>Ready for a harder hamstring move?</h2>
    <p>The next step is a Nordic curl. You kneel, someone or something holds your ankles, and you lower your body forward slowly. It is hard, so we start with a band to help and only a small range.</p>
    <div className="train-checks nordic-checks">{checks.map((text, i) => <label key={text}><input type="checkbox" checked={ticked[i]} onChange={event => setTicked(old => old.map((value, j) => j === i ? event.target.checked : value))} /><span>{text}</span></label>)}</div>
    <div className="actions"><button type="button" disabled={busy || !ticked.every(Boolean)} onClick={() => answer('ready')}>I'm ready</button><button type="button" className="secondary" disabled={busy} onClick={() => answer('not-now')}>Not now</button></div>
  </section>;
}
