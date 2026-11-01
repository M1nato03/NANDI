import { useState } from 'react';
import { KUNAL_SCENE, type ChikuScene } from '../../core/learn/chiku';
import { bundledTopicPacks } from '../../data/packs/seed';
import { ChikuStage } from './ChikuStage';

/**
 * E2E build only (route learn/chiku-demo): the spec 30 stage with the Kunal fixture, so the stage can be tested before
 * any signed-off scene ships. `?concept=<id>` plays that idea's own scene from the bundled packs instead (spec 51
 * review shots of each book idea's game).
 */
export function ChikuDemo() {
  const [played, setPlayed] = useState<string>('');
  const [done, setDone] = useState(false);
  const params = new URLSearchParams(location.search);
  const conceptId = params.get('concept');
  const scene: ChikuScene | null = !conceptId ? KUNAL_SCENE
    : (bundledTopicPacks.flatMap(pack => pack.body.modules.flatMap(module => module.concepts)).find(item => item.id === conceptId)?.chiku as ChikuScene | undefined) ?? null;
  return <section className="screen"><h1>Chiku demo</h1>
    {done ? <p role="status">Demo finished.</p>
      : scene ? <ChikuStage scene={scene} seed={params.get('seed') ?? 'demo'} onPlayed={(card, matched) => setPlayed(`${card}:${matched}`)} onDone={() => setDone(true)} />
        : <p role="status">No such idea.</p>}
    <p className="small" data-played={played}>{played ? 'Played' : 'Not played yet'}</p>
  </section>;
}
