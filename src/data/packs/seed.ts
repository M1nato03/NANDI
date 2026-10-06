import * as v from 'valibot';
import { packSchema } from './schemas';

const files = import.meta.glob('../../../content/**/*.json', { eager: true, import: 'default' });
export const bundledPacks = Object.values(files).map((pack) => v.parse(packSchema, pack));
