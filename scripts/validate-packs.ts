import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isTrailFile, loadPackFiles } from './pack-files';
import { validatePack } from '../src/data/packs/validate';
import { trailErrors, type Trail } from '../src/core/yatra/trail';

export async function validateAll(contentDir?: string, options: { allowUnchecked?: boolean } = {}): Promise<string[]> {
  const errors: string[] = [];
  const seen = new Set<string>();
  const arcIndexes = new Set<number>();
  const learnIds = new Map<string, string>();
  for (const { path, value } of await loadPackFiles(contentDir)) {
    // Spec 34: a Yatra trail is not a pack; it has its own rules (6-10 places, every postcard sourced).
    if (isTrailFile(path)) {
      for (const error of trailErrors(value as Trail)) errors.push(`${path}: ${error}`);
      continue;
    }
    for (const error of validatePack(value, { ...options, editorial: true })) errors.push(`${path}: ${error}`);
    if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'string') {
      if (seen.has(value.id)) errors.push(`${path}: duplicate pack id ${value.id}`);
      seen.add(value.id);
    }
    // Concept, step and item ids are looked up across every topic, so one id in two packs hides one of them (batch 3 c).
    if (value && typeof value === 'object' && 'kind' in value && value.kind === 'topic' && 'body' in value) {
      const modules = (value.body as { modules?: { concepts?: { id: string; steps?: { id: string }[]; items?: { id: string }[] }[] }[] }).modules ?? [];
      errors.push(...repeatedTextErrors(path, modules.flatMap(module => module.concepts ?? [])));
      for (const concept of modules.flatMap(module => module.concepts ?? [])) {
        for (const [kind, id] of [['concept', concept.id] as const, ...(concept.steps ?? []).map(step => ['step', step.id] as const), ...(concept.items ?? []).map(item => ['item', item.id] as const)]) {
          const owner = learnIds.get(`${kind}:${id}`);
          if (owner && owner !== path) errors.push(`${path}: ${kind} id ${id} is also in ${owner}`);
          learnIds.set(`${kind}:${id}`, path);
        }
      }
    }
    if (value && typeof value === 'object' && 'kind' in value && value.kind === 'mystery-arc' && 'body' in value && value.body && typeof value.body === 'object' && 'arcIndex' in value.body && typeof value.body.arcIndex === 'number') {
      if (arcIndexes.has(value.body.arcIndex)) errors.push(`${path}: duplicate arc index ${value.body.arcIndex}`);
      arcIndexes.add(value.body.arcIndex);
    }
  }
  if (!contentDir && arcIndexes.size !== 4) errors.push('bundle needs four mystery arcs');
  return errors;
}

const text = (value: unknown): value is string => typeof value === 'string';
/**
 * Spec 51: ideas in one pack filled from one template (How to Win Friends had 12 with the same recall, first step and
 * Chiku game). Within a pack, no two concepts may share all three recall pieces, the first step's title AND takeaway, a
 * recall decoy's text, a Chiku card, the Chiku new-day question or a Chiku guess's why. Exact strings, no trimming or
 * case folding; a repeat inside one concept and a repeat across packs are fine. Instruction labels ("Tap the better
 * line.") are not checked. Malformed fields are skipped here: the shape check reports them.
 */
export function repeatedTextErrors(path: string, concepts: readonly unknown[]): string[] {
  const errors: string[] = [];
  const seen = { recall: new Map<string, string[]>(), first: new Map<string, string[]>(), decoy: new Map<string, string[]>(), card: new Map<string, string[]>(), question: new Map<string, string[]>(), why: new Map<string, string[]>() };
  const check = (map: Map<string, string[]>, key: string, id: string, name: string, suffix = '') => {
    for (const earlier of map.get(key) ?? []) if (earlier !== id) errors.push(`${path}: ${name} shared by ${earlier} and ${id}${suffix}`);
    if (!(map.get(key) ?? []).includes(id)) map.set(key, [...(map.get(key) ?? []), id]);
  };
  for (const raw of concepts) {
    if (!raw || typeof raw !== 'object') continue;
    const concept = raw as { id?: unknown; recall?: { pieces?: unknown; decoys?: unknown }; steps?: unknown; chiku?: { cards?: unknown; newDay?: { question?: unknown }; guesses?: unknown } };
    if (!text(concept.id)) continue;
    const id = concept.id;
    const pieces = concept.recall?.pieces;
    if (Array.isArray(pieces) && pieces.length && pieces.every(text)) check(seen.recall, JSON.stringify(pieces), id, 'duplicate recall pieces');
    const first = Array.isArray(concept.steps) ? concept.steps[0] as { title?: unknown; takeaway?: unknown } | undefined : undefined;
    if (first && text(first.title) && text(first.takeaway)) check(seen.first, JSON.stringify([first.title, first.takeaway]), id, 'duplicate first-step title and takeaway');
    const decoys = concept.recall?.decoys;
    const decoyTexts = new Set(Array.isArray(decoys) ? decoys.map(decoy => (decoy as { text?: unknown } | null)?.text).filter(text) : []);
    for (const decoy of decoyTexts) check(seen.decoy, decoy, id, 'duplicate recall decoy text', `: ${decoy}`);
    const texts = (list: unknown, field: string) => new Set(Array.isArray(list) ? list.map(entry => (entry as Record<string, unknown> | null)?.[field]).filter(text) : []);
    for (const card of texts(concept.chiku?.cards, 'text')) check(seen.card, card, id, 'duplicate Chiku card', `: ${card}`);
    const question = concept.chiku?.newDay?.question;
    if (text(question)) check(seen.question, question, id, 'duplicate Chiku question', `: ${question}`);
    for (const why of texts(concept.chiku?.guesses, 'why')) check(seen.why, why, id, 'duplicate Chiku guess why', `: ${why}`);
  }
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
