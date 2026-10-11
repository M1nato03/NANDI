import { useEffect, useState } from 'react';
import { dayKey } from '../../core/time';
import { requestPersist } from '../../platform/storage';
import { Backup } from '../screens/Backup';
import { GeneratorCheck } from '../screens/GeneratorCheck';
import { Today } from '../screens/Today';
import { Tasks } from '../screens/Tasks';
import { Planner } from '../screens/Planner';
import { Train } from '../screens/Train';
import { Mind } from '../screens/Mind';
import { Ground } from '../screens/Ground';
import { route, tabOf } from './router';
import { TabBar } from './TabBar';
import { useAppearance } from './useAppearance';
import { UpdateBar } from './UpdateBar';
import { db } from '../../data/db';
import { reconcileSolvedBoards } from '../../data/repos/puzzleRuns';
import { recordError } from '../errorRing';

export function AppShell() {
  const [path, setPath] = useState(route);
  const [today] = useState(() => dayKey(Date.now()));
  const appearance = useAppearance();
  useEffect(() => { const update = () => setPath(route()); window.addEventListener('hashchange', update); void requestPersist(); return () => window.removeEventListener('hashchange', update); }, []);
  useEffect(() => { void reconcileSolvedBoards(db).catch(error => recordError('window', error)); }, []);
  const tab = tabOf(path);
  return <div className="app-shell">
    <UpdateBar />
    <header className="topbar"><h1 className="brand"><span aria-hidden="true" className="slash">/</span> NANDI</h1><span className="top-date">{today}</span></header>
    <main id="main" className="content">{path === 'ground/backup' ? <Backup onRestored={appearance.reload} /> : path === 'mind/generator' ? <GeneratorCheck /> : path === 'tasks/plan' ? <Planner mode="plan" /> : path === 'tasks/shutdown' ? <Planner mode="shutdown" /> : path === 'tasks/review' ? <Planner mode="review" /> :
      tab === 'Today' ? <Today /> : tab === 'Tasks' ? <Tasks /> : tab === 'Train' ? <Train /> : tab === 'Mind' ? <Mind /> :
      <section className="screen"><p className="eyebrow">The Proving Ground</p><h1>Ground</h1><Ground {...appearance} /></section>}</main>
    <TabBar current={tab} />
  </div>;
}
