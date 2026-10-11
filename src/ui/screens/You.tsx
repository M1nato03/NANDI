import type { Appearance } from '../shell/useAppearance';
import { go } from '../shell/router';
import { Ground } from './Ground';

export function You(appearance: Appearance) {
  return <section className="screen you-screen"><p className="eyebrow">Your space</p><h1>You</h1>
    <div className="you-links"><button type="button" className="card you-link" onClick={() => go('you/train')}><span className="pill">Strength</span><strong>Train</strong><span>Program, session, history and metrics</span></button>
      <button type="button" className="card you-link" onClick={() => go('you/mind')}><span className="pill">Practice</span><strong>Mind & learning</strong><span>Boards, cases, reviews and tracks</span></button></div>
    <section className="card mastery-slot"><span className="pill">Coming into focus</span><h2>Mastery map</h2><p>Your teaching journey will live here.</p></section>
    <Ground {...appearance} />
  </section>;
}
