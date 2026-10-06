import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { db } from '../data/db';
import { backupFileName, detectRestoreKind, exportBackup, importBackup, previewBackup, validateBackup, type BackupEnvelope } from '../data/backup';
import { getOrCreateDeviceId } from '../data/device';
import { importLegacy, mapLegacy, validateLegacy, type LegacyExport } from '../data/legacy-import';
import { dayKey } from '../core/time';
import { pickFile, shareOrDownload } from '../platform/files';
import { estimate, requestPersist } from '../platform/storage';
import { boardText, generateCheck, type GeneratorResult } from '../workers/generator';
import { getErrorRing, recordError, subscribeErrorRing } from './errorRing';
import './theme.css';

const tabs = ['Today', 'Tasks', 'Train', 'Mind', 'Ground'] as const;
type Tab = typeof tabs[number];
const phaseLine: Record<Tab, string> = {
  Today: 'Your next task and day plan arrive in Phase 1.',
  Tasks: 'Planning and focus sessions arrive in Phase 1.',
  Train: 'Your training ladder arrives in Phase 1.',
  Mind: 'The Daily Drop arrives in Phase 1.',
  Ground: 'Rank, stats and rewards arrive in Phase 1.',
};
function route(): string { return location.hash.replace(/^#\/?/, '').toLowerCase() || 'today'; }
function tabOf(path: string): Tab { return tabs.find(tab => tab.toLowerCase() === path.split('/')[0]) ?? 'Today'; }
function go(path: string): void { location.hash = `#${path}`; }
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }

type RestoreChoice = { kind: 'backup'; data: BackupEnvelope; counts: Record<string, number>; first: string | null; last: string | null; skipped: string[] }
  | { kind: 'legacy'; data: LegacyExport; counts: Record<string, number>; first: string | null; last: string | null; skipped: string[] };

function legacyPreview(data: LegacyExport): RestoreChoice {
  const rows = mapLegacy(data, { deviceId: 'preview', now: Date.now() });
  const counts = Object.fromEntries(Object.entries(rows).filter(([key]) => key !== 'skipped').map(([key, value]) => [key, value.length]));
  const days: string[] = [];
  for (const row of [...rows.cards, ...rows.deckProg, ...rows.puzzleRuns, ...rows.lessonProg, ...rows.plans]) {
    for (const [key, value] of Object.entries(row)) {
      if ((key === 'dayKey' || key.endsWith('DayKey') || key === 'due' || key === 'last') && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) days.push(value);
    }
  }
  days.sort();
  return { kind: 'legacy', data, counts, first: days[0] ?? null, last: days.at(-1) ?? null, skipped: rows.skipped };
}

function BackupScreen() {
  const [choice, setChoice] = useState<RestoreChoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [lastBackup, setLastBackup] = useState<number | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [usage, setUsage] = useState<StorageEstimate | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    const [row, storage, state] = await Promise.all([db.settings.get('lastBackupAt'), estimate(), navigator.storage?.persisted?.()]);
    setLastBackup(typeof row?.value === 'number' ? row.value : null);
    setUsage(storage); setPersisted(state ?? null);
    setCounts(Object.fromEntries(await Promise.all(db.tables.map(async table => [table.name, await table.count()]))));
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh().catch(error => { recordError('promise', error); setMessage('Storage details are unavailable right now.'); }); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function exportFile(): Promise<void> {
    setBusy(true); setMessage('');
    try {
      const now = Date.now();
      const envelope = await exportBackup(db, now);
      await shareOrDownload(new File([JSON.stringify(envelope)], backupFileName(now), { type: 'application/json' }));
      await refresh(); setMessage('Backup ready. Keep this file somewhere safe.');
    } catch (error) { recordError('promise', error); setMessage(`Backup could not finish: ${errorMessage(error)}`); }
    finally { setBusy(false); }
  }

  async function chooseFile(): Promise<void> {
    setChoice(null); setMessage('');
    try {
      const file = await pickFile(); if (!file) return;
      const parsed: unknown = JSON.parse(await file.text());
      const kind = detectRestoreKind(parsed);
      if (kind === 'backup') {
        const checked = validateBackup(parsed);
        if (!checked.success || !checked.envelope) throw new Error(checked.errors.join('; '));
        const preview = previewBackup(checked.envelope);
        setChoice({ kind, data: checked.envelope, counts: preview.counts, first: preview.earliestDayKey, last: preview.latestDayKey, skipped: [] });
      } else if (kind === 'legacy') {
        const checked = validateLegacy(parsed); if (!checked.success) throw new Error(checked.errors.join('; '));
        setChoice(legacyPreview(checked.data));
      } else throw new Error('This file is not a NANDI or legacy backup.');
    } catch (error) { setMessage(`Could not read that file: ${errorMessage(error)}`); }
  }

  async function confirmRestore(): Promise<void> {
    if (!choice) return;
    setBusy(true); setMessage('');
    try {
      if (choice.kind === 'backup') await importBackup(db, choice.data);
      else await importLegacy(db, choice.data, { deviceId: await getOrCreateDeviceId(db, Date.now()), now: Date.now() });
      setChoice(null); await refresh(); setMessage('Restore complete. Your data is ready.');
    } catch (error) { recordError('promise', error); setMessage(`Restore could not finish: ${errorMessage(error)}`); }
    finally { setBusy(false); }
  }

  return <section className="screen">
    <button className="text-button" onClick={() => go('ground')}>← Ground</button>
    <p className="eyebrow">Keep your work</p><h1>Backup</h1>
    <p>Save a copy you control. The file is plain text and contains your personal data.</p>
    <div className="card"><h2>Save a copy</h2><p>Last backup: {lastBackup === null ? 'Not yet' : new Date(lastBackup).toLocaleDateString()}</p><button disabled={busy} onClick={() => void exportFile()}>Export backup</button></div>
    <div className="card"><h2>Bring a copy back</h2><p>Choose a NANDI backup or a legacy export. You will see what is inside before restoring.</p><button className="secondary" disabled={busy} onClick={() => void chooseFile()}>Choose restore file</button></div>
    {choice && <div className="card preview" aria-label="Restore preview">
      <h2>Review restore</h2><p>{choice.kind === 'backup' ? 'NANDI backup' : 'Legacy export'} · {choice.first && choice.last ? `${choice.first} to ${choice.last}` : 'No dated rows'}</p>
      <ul className="count-list">{Object.entries(choice.counts).map(([name, count]) => <li key={name}><span>{name}</span><strong>{count}</strong></li>)}</ul>
      {choice.skipped.length > 0 && <p>Skipped keys: {choice.skipped.join(', ')}</p>}
      <p>{choice.kind === 'backup' ? 'This replaces current app data.' : 'This adds legacy data to this device.'}</p>
      <div className="actions"><button disabled={busy} onClick={() => void confirmRestore()}>Confirm restore</button><button className="secondary" onClick={() => setChoice(null)}>Cancel</button></div>
    </div>}
    <div className="card"><h2>Device storage</h2><p>Persistent storage: {persisted === null ? 'Unavailable' : persisted ? 'On' : 'Off'}</p>
      <p>Used: {usage?.usage === undefined ? 'Unavailable' : `${(usage.usage / 1048576).toFixed(1)} MB`} · Quota: {usage?.quota === undefined ? 'Unavailable' : `${(usage.quota / 1048576).toFixed(1)} MB`}</p>
      <button className="secondary" onClick={() => void requestPersist().then(refresh)}>Ask to keep data on this device</button></div>
    {counts && <p className="small">Current rows: {Object.values(counts).reduce((a, b) => a + b, 0)}</p>}
    {message && <p role="status">{message}</p>}
  </section>;
}

function GeneratorCheck() {
  const [main, setMain] = useState<{ result: GeneratorResult; ms: number } | null>(null);
  const [worker, setWorker] = useState<{ result: GeneratorResult; ms: number } | null>(null);
  const [problem, setProblem] = useState('');
  const [today] = useState(() => dayKey(Date.now()));
  useEffect(() => {
    const instance = new Worker(new URL('../workers/puzzle.worker.ts', import.meta.url), { type: 'module' });
    instance.onmessage = (event: MessageEvent<{ result?: GeneratorResult; ms?: number; error?: string }>) => {
      if (event.data.error) setProblem(event.data.error);
      else if (event.data.result && event.data.ms !== undefined) setWorker({ result: event.data.result, ms: event.data.ms });
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
  return <section className="screen"><button className="text-button" onClick={() => go('mind')}>← Mind</button>
    <p className="eyebrow">Browser check · {today}</p><h1>Generator check</h1><p>Same daily seeds, two places.</p>
    <div className="card"><h2>Main thread</h2><p>{main ? `${main.ms.toFixed(1)} ms` : 'Generating…'}</p></div>
    <div className="card"><h2>Worker</h2><p>{worker ? `${worker.ms.toFixed(1)} ms` : 'Generating…'}</p></div>
    <p role="status">{problem || (match === null ? 'Checking…' : match ? 'Match' : 'Results differ')}</p>
    {main && worker && <div className="generator-columns">{[main, worker].map((run, index) => <div key={index} aria-label={index ? 'Worker results' : 'Main thread results'}>
      <h2>{index ? 'Worker boards' : 'Main thread boards'}</h2>
      {run.result.boards.map(({ type, name, board }) => <article className="card" key={type}><h3>{name}</h3><pre>{board ? boardText(board) : 'Could not generate this board.'}</pre></article>)}
      <article className="card"><h3>Case of the day</h3><p>{run.result.case?.title ?? 'Could not generate the case.'}</p><p>{run.result.case?.setup}</p></article>
    </div>)}</div>}
  </section>;
}

function GroundHome() {
  const entries = useSyncExternalStore(subscribeErrorRing, getErrorRing);
  const [theme, setTheme] = useState(localStorage.getItem('nandi-theme') ?? 'system');
  const [motion, setMotion] = useState(localStorage.getItem('nandi-motion') ?? 'system');
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('nandi-theme', theme); }, [theme]);
  useEffect(() => { document.documentElement.dataset.motion = motion; localStorage.setItem('nandi-motion', motion); }, [motion]);
  return <><div className="hero"><p className="eyebrow">The Proving Ground</p><strong className="rank">#500</strong><p>Bench · start where you are</p></div>
    <p>{phaseLine.Ground}</p><button onClick={() => go('ground/backup')}>Backup and restore <span aria-hidden="true">↗</span></button>
    <div className="card"><h2>Settings</h2>
      <label>Theme <select value={theme} onChange={event => setTheme(event.target.value)}><option value="system">System</option><option value="dark">Dark</option><option value="light">Light</option></select></label>
      <label>Motion <select value={motion} onChange={event => setMotion(event.target.value)}><option value="system">System</option><option value="reduce">Reduced</option></select></label>
    </div>
    <div className="card"><h2>Error ring</h2><p>Recent errors stay on this device. {entries.length} of 50 saved.</p>
      {entries.length ? <ol className="errors">{[...entries].reverse().map((entry, index) => <li key={`${entry.at}-${index}`}><time>{new Date(entry.at).toLocaleString()}</time> · {entry.source}: {entry.message}</li>)}</ol> : <p>No errors recorded.</p>}</div>
  </>;
}

export default function App() {
  const [path, setPath] = useState(route);
  const [today] = useState(() => dayKey(Date.now()));
  useEffect(() => { const update = () => setPath(route()); window.addEventListener('hashchange', update); void requestPersist(); return () => window.removeEventListener('hashchange', update); }, []);
  const tab = tabOf(path);
  return <div className="app-shell"><header className="topbar"><h1 className="brand"><span aria-hidden="true" className="slash">/</span> NANDI</h1><span className="top-date">{today}</span></header>
    <main id="main" className="content">{path === 'ground/backup' ? <BackupScreen /> : path === 'mind/generator' ? <GeneratorCheck /> : <section className="screen">
      <p className="eyebrow">{tab === 'Ground' ? 'The Proving Ground' : 'Your space'}</p><h1>{tab}</h1>
      {tab === 'Ground' ? <GroundHome /> : <><p>{phaseLine[tab]}</p>{tab === 'Mind' && <button onClick={() => go('mind/generator')}>Generator check <span aria-hidden="true">↗</span></button>}</>}
    </section>}</main>
    <nav className="tabbar" aria-label="Main tabs">{tabs.map((item, index) => <a key={item} href={`#${item.toLowerCase()}`} aria-current={item === tab ? 'page' : undefined}><span aria-hidden="true" className="tab-symbol">{['◉', '▤', '△', '◇', '#'][index]}</span><span>{item}</span></a>)}</nav>
  </div>;
}
