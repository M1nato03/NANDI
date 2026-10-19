import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPackFiles } from './pack-files';
import { validatePack } from '../src/data/packs/validate';

export async function validateAll(contentDir?: string, options: { allowUnchecked?: boolean } = {}): Promise<string[]> {
  const errors: string[] = [];
  const seen = new Set<string>();
  const arcIndexes = new Set<number>();
  for (const { path, value } of await loadPackFiles(contentDir)) {
    for (const error of validatePack(value, { ...options, editorial: true })) errors.push(`${path}: ${error}`);
    if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'string') {
      if (seen.has(value.id)) errors.push(`${path}: duplicate pack id ${value.id}`);
      seen.add(value.id);
    }
    if (value && typeof value === 'object' && 'kind' in value && value.kind === 'mystery-arc' && 'body' in value && value.body && typeof value.body === 'object' && 'arcIndex' in value.body && typeof value.body.arcIndex === 'number') {
      if (arcIndexes.has(value.body.arcIndex)) errors.push(`${path}: duplicate arc index ${value.body.arcIndex}`);
      arcIndexes.add(value.body.arcIndex);
    }
  }
  if (!contentDir && arcIndexes.size !== 4) errors.push('bundle needs four mystery arcs');
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const flags = process.argv.slice(2);
  if (flags.some(flag => flag !== '--allow-unchecked')) throw new Error(`Unknown flag: ${flags.find(flag => flag !== '--allow-unchecked')}`);
  validateAll(undefined, { allowUnchecked: flags.includes('--allow-unchecked') }).then((errors) => {
    if (errors.length) { errors.forEach((error) => console.error(error)); process.exitCode = 1; }
    else console.log('Packs valid.');
  }).catch((error: unknown) => { console.error(error); process.exitCode = 1; });
}
