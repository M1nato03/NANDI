import { useState } from 'react';
import { KUNAL_SCENE } from '../../core/learn/chiku';
import { ChikuStage } from './ChikuStage';

/** E2E build only (route learn/chiku-demo): the spec 30 stage with the Kunal fixture, so the stage can be tested before any signed-off scene ships. */
export function ChikuDemo() {
  const [played, setPlayed] = useState<string>('');
  const [done, setDone] = useState(false);
  return <section className="screen"><h1>Chiku demo</h1>
    {done ? <p role="status">Demo finished.</p> : <ChikuStage scene={KUNAL_SCENE} seed={new URLSearchParams(location.search).get('seed') ?? 'demo'} onPlayed={(card, matched) => setPlayed(`${card}:${matched}`)} onDone={() => setDone(true)} />}
    <p className="small" data-played={played}>{played ? 'Played' : 'Not played yet'}</p>
  </section>;
}
