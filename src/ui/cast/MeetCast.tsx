import { Cast, castNames, poses } from './Cast';

export function MeetCast() {
  return <section className="screen meet-cast"><p className="eyebrow">About this app</p><h1>Meet the cast</h1>
    <p>Six friends for learning, moving and resting.</p>
    {castNames.map(name => <section className="card cast-gallery-row" key={name} aria-label={name}><h2>{name}</h2><div className="cast-gallery-poses">
      {poses.map(pose => <div key={pose} className="cast-gallery-pose"><Cast name={name} pose={pose} size={72} title={`${name} ${pose}`} /><span>{pose}</span></div>)}
    </div></section>)}
  </section>;
}
