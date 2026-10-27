import { Cast, type CastName } from '../cast/Cast';
import { go } from '../shell/router';
import './yatra.css';

/** Spec 34: Yatra's three corners. Each friend keeps its own corner; the trek and the sky come in slice 3. */
const CORNERS: { id: 'train' | 'mind' | 'calm'; friend: CastName; title: string; caption: string; area: string }[] = [
  { id: 'train', friend: 'Nandi', title: 'Train', caption: 'With Nandi', area: 'train' },
  { id: 'mind', friend: 'Kapi', title: 'Mind', caption: 'Puzzles and cases', area: 'mind' },
  { id: 'calm', friend: 'Kachhua', title: 'Calm', caption: 'Breathe with Kachhua', area: 'night' },
];

export function Yatra() {
  return <section className="screen yatra-screen">
    <p className="eyebrow">Move, think, breathe</p><h1>Yatra</h1>
    <p className="yatra-line">Pick a corner. A few good minutes with a friend.</p>
    <ul className="yatra-corners" aria-label="Corners">{CORNERS.map(corner => <li key={corner.id}>
      <button type="button" className="card yatra-corner" data-area={corner.area} aria-label={`${corner.title}: ${corner.caption}`} onClick={() => go(`yatra/${corner.id}`)}>
        <Cast name={corner.friend} pose="idle" size={72} />
        <span className="yatra-corner-text"><strong>{corner.title}</strong><span>{corner.caption}</span></span>
      </button>
    </li>)}</ul>
  </section>;
}
