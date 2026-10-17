import * as v from 'valibot';
import { packSchema, type TopicPack } from './schemas';

const files = import.meta.glob('../../../content/**/*.json', { import: 'default' });
const parsedPacks = (await Promise.all(Object.values(files).map(load => load()))).flatMap((pack) => {
  const result = v.safeParse(packSchema, pack);
  return result.success ? [result.output] : [];
});
export const bundledPacks = parsedPacks.filter((pack) => pack.kind !== 'topic');
export const bundledTopicPacks = parsedPacks.filter((pack): pack is TopicPack => pack.kind === 'topic');
