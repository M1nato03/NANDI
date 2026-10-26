import { useState } from 'react';
import { Cast, castNames, poses, type CastName, type FriendMoment, type Pose } from './Cast';
import { AREAS } from '../../core/courtyard/courtyard';

// Spec 31: tapping a pose card plays that pose's natural moment.
const NATURAL: Record<Pose, FriendMoment> = { idle: 'blink', cheer: 'hop', think: 'tilt', rest: 'settle' };

function PoseCard({ name, pose }: { name: CastName; pose: Pose }) {
  const [taps, setTaps] = useState(0);
  return <button type="button" className="cast-gallery-pose" aria-label={`${name} ${pose}: play`} onClick={() => setTaps(count => count + 1)}>
    <Cast name={name} pose={pose} size={72} title={`${name} ${pose}`} moment={NATURAL[pose]} at={taps} /><span>{pose}</span>
  </button>;
}

export function MeetCast() {
  return <section className="screen meet-cast"><p className="eyebrow">About this app</p><h1>Meet the cast</h1>
    <p>Six friends share your courtyard. Each one looks after one part of your day and grows with the days you practise it.</p>
    {castNames.map(name => <section className="card cast-gallery-row" key={name} aria-label={name}><h2>{name} · {AREAS.find(area => area.friend === name)?.label}</h2><div className="cast-gallery-poses">
      {poses.map(pose => <PoseCard key={pose} name={name} pose={pose} />)}
    </div></section>)}
  </section>;
}
