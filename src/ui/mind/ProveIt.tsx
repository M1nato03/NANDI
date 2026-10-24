import { useMemo, useState } from 'react';
import type { MysteryCase } from '../../core/mysteries';
import { checkProof, shortestProof, stillAllows } from '../../core/mysteries/proof';
import { saveCaseProof } from '../../data/repos/mysteries';
import { db } from '../../data/db';
import type { PuzzleRunRow } from '../../data/types';
import { recordError } from '../errorRing';

/**
 * Spec 24 Prove it (cj5-mind §7.2): one optional card after a right accusation. Tap the clues that prove it, then
 * Check. Tries are unlimited, nothing is lost, Skip is always there, and it pays 0 XP. The phone checks the pick by
 * logic; a pick that falls short shows a case those clues still allow.
 */
export function ProveIt({ mystery, run }: { mystery: MysteryCase; run: PuzzleRunRow }) {
  const shortest = useMemo(() => shortestProof(mystery), [mystery]);
  const [picked, setPicked] = useState<number[]>([]);
  const [note, setNote] = useState('');
  const [skipped, setSkipped] = useState(false);
  const [another, setAnother] = useState(false);
  const [proof, setProof] = useState(run.proof);
  if (skipped && !proof) return null;
  const toggle = (index: number) => { setNote(''); setPicked(current => current.includes(index) ? current.filter(value => value !== index) : [...current, index]); };
  const check = () => {
    const result = checkProof(mystery, picked);
    if (!result.proves) { setNote(stillAllows(mystery, result.still)); return; }
    setNote('');
    void saveCaseProof(db, run.id, picked).then(saved => setProof(saved?.proof ?? [...picked].sort((a, b) => a - b))).catch(error => recordError('window', error));
  };
  const clueText = (index: number) => mystery.clues[index]?.text ?? `Clue ${index + 1}`;
  const same = !!proof && proof.length === shortest.length && proof.every((value, index) => value === shortest[index]);
  return <section className="case-prove" aria-label="Prove it">
    <h3>Prove it</h3>
    {proof ? <>
      <p className="mind-stamp">Proof stamp · {proof.length} {proof.length === 1 ? 'clue' : 'clues'}</p>
      {another ? <div className="case-prove-another">
        {same ? <p>Yours is one of the shortest proofs.</p> : <><p>Another proof, {shortest.length} {shortest.length === 1 ? 'clue' : 'clues'}:</p><ul>{shortest.map(index => <li key={index}>{clueText(index)}</li>)}</ul></>}
      </div> : <button type="button" className="text-button" onClick={() => setAnother(true)}>Another proof</button>}
    </> : <>
      <p>Which clues prove it? Tap the ones you need, then check.</p>
      <ul className="case-prove-clues">{mystery.clues.map((_, index) => <li key={index}>
        <button type="button" className="case-prove-clue" aria-pressed={picked.includes(index)} onClick={() => toggle(index)}>{clueText(index)}</button>
      </li>)}</ul>
      <div className="mind-actions">
        <button type="button" disabled={!picked.length} onClick={check}>Check</button>
        <button type="button" className="text-button" onClick={() => setSkipped(true)}>Skip</button>
      </div>
      {note && <p role="status">{note}</p>}
    </>}
  </section>;
}
