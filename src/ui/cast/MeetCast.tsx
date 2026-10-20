import { Cast, castNames, poses } from './Cast';
import { AREAS } from '../../core/courtyard/courtyard';

export function MeetCast() {
  return <section className="screen meet-cast"><p className="eyebrow">About this app</p><h1>Meet the cast</h1>
    <p>Six friends share your courtyard. Each one looks after one part of your day and grows with the days you practise it.</p>
    {castNames.map(name => <section className="card cast-gallery-row" key={name} aria-label={name}><h2>{name} · {AREAS.find(area => area.friend === name)?.label}</h2><div className="cast-gallery-poses">
      {poses.map(pose => <div key={pose} className="cast-gallery-pose"><Cast name={name} pose={pose} size={72} title={`${name} ${pose}`} /><span>{pose}</span></div>)}
    </div></section>)}
  </section>;
}
