import type { Appearance } from '../shell/useAppearance';
import { go } from '../shell/router';
import { Ground } from './Ground';
import { Progress } from './Progress';

export function You(appearance: Appearance) {
  return <section className="screen you-screen"><p className="eyebrow">Your space</p><h1>You</h1>
    <div className="you-links">
      <button type="button" className="card you-link" onClick={() => go('plan')}><span className="pill">Direction</span><strong>Plan</strong><span>Your day, chores, tasks and focus</span></button>
      <button type="button" className="card you-link" onClick={() => go('you/train')}><span className="pill">Movement</span><strong>Train</strong><span>Program, session, recovery and history</span></button>
      <button type="button" className="card you-link" onClick={() => go('you/mind')}><span className="pill">Clarity</span><strong>Mind</strong><span>Meditation, puzzles and daily cases</span></button>
      <button type="button" className="card you-link" onClick={() => go('you/learn')}><span className="pill">Curiosity</span><strong>Learn</strong><span>Choose a track, lessons and reviews</span></button>
    </div>
    <Progress />
    <Ground {...appearance} />
  </section>;
}
