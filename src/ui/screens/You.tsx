import type { Appearance } from '../shell/useAppearance';
import { go } from '../shell/router';
import { Ground } from './Ground';
import { NightPlanSetting } from './NightPlanSetting';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { readNightPlan } from '../../core/nightPlan';
import { WeeklyRecap } from './WeeklyRecap';
import { nightPauseAvailable } from '../../platform/nightPause';

export function You(appearance: Appearance) {
  const settings = useLiveQuery(() => db.settings.toArray(), []) ?? [];
  return <section className="screen you-screen"><p className="eyebrow">Your space</p><h1>You</h1>
    {!readNightPlan(settings) && <NightPlanSetting firstRun />}
    <div className="you-links"><button type="button" className="card you-link" onClick={() => go('you/train')}><span className="pill">Strength</span><strong>Train</strong><span>Program, session, history and metrics</span></button>
      <button type="button" className="card you-link" onClick={() => go('you/mind')}><span className="pill">Practice</span><strong>Mind & learning</strong><span>Boards, cases, reviews and tracks</span></button></div>
    {nightPauseAvailable() && <button type="button" className="card you-link" onClick={() => go('you/night')}><span className="pill">Night</span><strong>Night plan and pause</strong><span>Your bedtime plan and optional app pause</span></button>}
    <section className="card recap-slot"><WeeklyRecap /></section>
    <section className="card mastery-slot"><span className="pill">Coming into focus</span><h2>Mastery map</h2><p>Your teaching journey will live here.</p></section>
    <Ground {...appearance} />
  </section>;
}
