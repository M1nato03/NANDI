import { useState } from 'react';
import { haveliTiles, placeTile, type HaveliIdea, type HaveliTile } from '../../core/moti/haveli';
import { Moti, type Pose } from '../cast/Cast';

/**
 * Spec 26 A1, Moti's haveli: a room per topic, a diya per finished idea. Review is a rebuild: put the takeaway back
 * together from three pieces in order; a decoy is one of the idea's real misconceptions, and tapping it shows the fix
 * and sends it back. Nothing ever dims: once lit, a diya stays lit for good, and an idea due again gets a small
 * separate "Ready for a visit" mark instead (Codex B item 114). At the daily cap the haveli is quiet.
 */
type Moment = 'open' | 'nod' | 'hmm' | 'carry' | 'rest';
const POSE: Record<Moment, Pose> = { open: 'idle', nod: 'cheer', hmm: 'think', carry: 'cheer', rest: 'rest' };

export function Haveli({ ideas, lit, everLit, cap, day, onRebuilt, onLeave }: { ideas: HaveliIdea[]; lit: string[]; everLit: string[]; cap: number; day: string; onRebuilt: (idea: HaveliIdea) => Promise<void>; onLeave: () => void }) {
  const [active, setActive] = useState<HaveliIdea | null>(null);
  const [placed, setPlaced] = useState(0);
  const [fix, setFix] = useState('');
  const [moment, setMoment] = useState<{ kind: Moment; at: number }>({ kind: 'open', at: 0 });
  const [justLit, setJustLit] = useState<string[]>([]);
  const react = (kind: Moment) => setMoment(current => ({ kind, at: current.at + 1 }));
  const litNow = new Set([...lit, ...justLit]);
  const litEver = new Set([...everLit, ...justLit]);
  const open = ideas.filter(idea => !litNow.has(idea.id));
  const quiet = litNow.size >= cap || open.length === 0;
  const rooms = [...new Set(ideas.map(idea => idea.topicId))].map(topicId => ({ topicId, title: ideas.find(idea => idea.topicId === topicId)!.topicTitle, ideas: ideas.filter(idea => idea.topicId === topicId) }));
  const start = (idea: HaveliIdea) => { setActive(idea); setPlaced(0); setFix(''); };
  const tap = async (tile: HaveliTile) => {
    if (!active) return;
    const next = placeTile(placed, tile);
    if (next.out === 'decoy') { setFix(next.fix ?? ''); react('hmm'); return; }
    setFix('');
    if (next.out === 'later') return;
    setPlaced(next.placed);
    react('nod');
    if (next.placed === active.recall.pieces.length) {
      await onRebuilt(active);
      setJustLit(current => [...current, active.id]);
      react('carry');
      setActive(null);
    }
  };
  const tiles = active ? haveliTiles(active, `${day}:${active.id}`) : [];
  const shownMoment: Moment = !active && quiet ? 'rest' : moment.kind;
  return <section className="screen haveli" aria-label="Moti's haveli">
    <div className="haveli-head"><span className={`moti-friend moti-${shownMoment}`} key={`${shownMoment}-${moment.at}`} data-moment={shownMoment}><Moti pose={POSE[shownMoment]} size={64} title="Moti" /></span><div><p className="eyebrow">Moti's haveli</p><h1>{active ? 'Put the idea back together' : quiet ? 'The haveli is quiet for today.' : 'Light a diya'}</h1></div></div>
    {active ? <>
      <p className="small">{active.title} · {active.topicTitle}</p>
      <ol className="haveli-slots" aria-label="Your rebuild">{active.recall.pieces.map((piece, index) => <li key={index} className={index < placed ? 'filled' : ''}>{index < placed ? piece : '…'}</li>)}</ol>
      {/* The fix sits right under the rebuild, above the pieces, so it is on screen at 360 px. */}
      {fix && <p className="haveli-fix" role="status">Hmm. {fix}</p>}
      <div className="haveli-tiles" role="group" aria-label="Pieces">{tiles.map((tile, index) => tile.kind === 'piece' && tile.index < placed ? null : <button type="button" key={index} className="haveli-tile" onClick={() => void tap(tile)}>{tile.text}</button>)}</div>
      <button type="button" className="text-button" onClick={() => setActive(null)}>Back to the rooms</button>
    </> : <>
      {rooms.map(room => <section key={room.topicId} className={`haveli-room${room.ideas.some(idea => justLit.includes(idea.id)) ? ' glow' : ''}`} aria-label={`${room.title} room`}><h2>{room.title}</h2><ul>{room.ideas.map(idea => <li key={idea.id}>{litNow.has(idea.id) ? <span className="haveli-diya lit" aria-label={`${idea.title}: lit, visited today`}><span className="haveli-flame" aria-hidden="true" />{idea.title}</span>
        : litEver.has(idea.id) ? <button type="button" className="haveli-diya lit" aria-label={`${idea.title}: lit, ready for a visit`} disabled={quiet} onClick={() => start(idea)}><span className="haveli-flame" aria-hidden="true" />{idea.title}{!quiet && <span className="haveli-ready">Ready for a visit</span>}</button>
        : <button type="button" className="haveli-diya" disabled={quiet} onClick={() => start(idea)}>{idea.title}</button>}</li>)}</ul></section>)}
      {quiet && <p className="small" role="status">Moti rests in the courtyard. More tomorrow.</p>}
      <button type="button" className="secondary" onClick={onLeave}>Close</button>
    </>}
  </section>;
}
