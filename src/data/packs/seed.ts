import * as v from 'valibot';
import { packSchema, type TopicPack } from './schemas';

const files = import.meta.glob('../../../content/**/*.json', { eager: true, import: 'default' });
const parsedPacks = Object.values(files).flatMap((pack) => {
  const result = v.safeParse(packSchema, pack);
  return result.success ? [result.output] : [];
});
export const bundledPacks = parsedPacks.filter((pack) => pack.kind !== 'topic');
export const bundledTopicPacks = parsedPacks.filter((pack): pack is TopicPack => pack.kind === 'topic');
