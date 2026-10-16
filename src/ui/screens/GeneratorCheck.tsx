import { useEffect, useState } from 'react';
import { dayKey } from '../../core/time';
import { boardText, generateCheck, type GeneratorResult } from '../../workers/generator';
import { recordError } from '../errorRing';
import { errorMessage } from '../shell/errorMessage';

interface PathSpeed { count: number; p50: number; p95: number; max: number; budgetMs: number }

export function GeneratorCheck() {
  const [main, setMain] = useState<{ result: GeneratorResult; ms: number } | null>(null);
  const [worker, setWorker] = useState<{ result: GeneratorResult; ms: number } | null>(null);
  const [pathSpeed, setPathSpeed] = useState<PathSpeed | null>(null);
  const [problem, setProblem] = useState('');
  const [today] = useState(() => dayKey(Date.now()));
  useEffect(() => {
    const instance = new Worker(new URL('../../workers/puzzle.worker.ts', import.meta.url), { type: 'module' });
    instance.onmessage = (event: MessageEvent<{ result?: GeneratorResult; ms?: number; pathSpeed?: PathSpeed; error?: string }>) => {
      if (event.data.error) setProblem(event.data.error);
      else if (event.data.result && event.data.ms !== undefined) setWorker({ result: event.data.result, ms: event.data.ms });
      else if (event.data.pathSpeed) setPathSpeed(event.data.pathSpeed);
    };
    instance.onerror = event => { setProblem(event.message); recordError('window', event.message); };
    instance.postMessage(today);
    const timer = window.setTimeout(() => {
      try { const start = performance.now(); const result = generateCheck(today); setMain({ result, ms: performance.now() - start }); }
      catch (error) { setProblem(errorMessage(error)); recordError('window', error); }
    }, 0);
    return () => { window.clearTimeout(timer); instance.terminate(); };
  }, [today]);
  const match = main && worker ? JSON.stringify(main.result) === JSON.stringify(worker.result) : null;
  return <section className="screen">
    <p className="eyebrow">Browser check · {today}</p><h1>Generator check</h1><p>Same daily seeds, two places.</p>
    <div className="card"><h2>Main thread</h2><p>{main ? `${main.ms.toFixed(1)} ms` : 'Generating…'}</p></div>
    <div className="card"><h2>Worker</h2><p>{worker ? `${worker.ms.toFixed(1)} ms` : 'Generating…'}</p></div>
    <p role="status">{problem || (match === null ? 'Checking…' : match ? 'Match' : 'Results differ')}</p>
    <div className="card"><h2>Number Path (hard) speed</h2>
      {pathSpeed ? <><p>{pathSpeed.count} boards · fixed seeds · Web Worker</p>
        <p>p50: {pathSpeed.p50.toFixed(1)} ms</p>
        <p>p95: {pathSpeed.p95.toFixed(1)} ms · {pathSpeed.budgetMs} ms budget · {pathSpeed.p95 <= pathSpeed.budgetMs ? 'within budget' : 'over budget'}</p>
        <p>max: {pathSpeed.max.toFixed(1)} ms</p></> : <p>Generating 20 boards…</p>}
    </div>
    {main && worker && <div className="generator-columns">{[main, worker].map((run, index) => <div key={index} aria-label={index ? 'Worker results' : 'Main thread results'}>
      <h2>{index ? 'Worker boards' : 'Main thread boards'}</h2>
      {run.result.boards.map(({ type, name, board }) => <article className="card" key={type}><h3>{name}</h3><pre>{board ? boardText(board) : 'Could not generate this board.'}</pre></article>)}
      <article className="card"><h3>Case of the day</h3><p>{run.result.case?.title ?? 'Could not generate the case.'}</p><p>{run.result.case?.setup}</p></article>
    </div>)}</div>}
  </section>;
}
