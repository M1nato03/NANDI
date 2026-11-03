import * as v from 'valibot';
import { packSchema, type TopicPack } from './schemas';
import { skillTrackPackSchema } from './skillTrack';

const files = import.meta.glob('../../../content/**/*.json', { import: 'default' });
const loaded = await Promise.all(Object.values(files).map(load => load()));
const parsedPacks = loaded.flatMap((pack) => {
  const result = v.safeParse(packSchema, pack);
  return result.success ? [result.output] : [];
});
export const bundledPacks = parsedPacks.filter((pack) => pack.kind !== 'topic');
export const bundledTopicPacks = parsedPacks.filter((pack): pack is TopicPack => pack.kind === 'topic');
/** Spec 43: skill tracks a learner can open. A draft never surfaces; none is bundled yet, so nothing shows. */
export const bundledSkillTracks = loaded.flatMap((pack) => {
  const result = v.safeParse(skillTrackPackSchema, pack);
  return result.success && result.output.body.status === 'release' ? [result.output] : [];
});
