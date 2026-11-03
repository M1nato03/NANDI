import * as v from 'valibot';
import { checkAnswer, normalize, type NarrowCheck } from '../../core/skillPractice';

/**
 * Spec 43 (starter): the `skill-track` pack kind. A track is an ordered run of practice lessons; each lesson holds the
 * whole loop (worked example, change one part, at least two fresh cases, a three-point checklist) and points at its
 * entry in a rights register. Kept apart from `packSchema` so the older `track` kind and every bundled pack are untouched.
 */
const text = v.pipe(v.string(), v.minLength(1));
const strings = v.array(text);
const integer = v.pipe(v.number(), v.integer());
const semver = v.pipe(v.string(), v.regex(/^\d+\.\d+\.\d+$/));
const feedback = v.strictObject({ right: text, wrong: text });
const nearMiss = v.strictObject({ answer: text, feedback: text });
const textTests = v.strictObject({ accept: strings, reject: strings });

export const narrowCheckSchema = v.variant('kind', [
  v.strictObject({ kind: v.literal('choice'), options: v.pipe(strings, v.minLength(2)), accepted: v.pipe(strings, v.minLength(1)), nearMisses: v.optional(v.array(nearMiss)), feedback, tests: v.optional(textTests) }),
  v.strictObject({ kind: v.literal('phrase'), accepted: v.pipe(strings, v.minLength(1)), nearMisses: v.optional(v.array(nearMiss)), feedback, tests: v.optional(textTests) }),
  v.strictObject({ kind: v.literal('order'), parts: v.pipe(strings, v.minLength(2)), nearMisses: v.optional(v.array(v.strictObject({ answer: strings, feedback: text }))), feedback,
    tests: v.optional(v.strictObject({ accept: v.array(strings), reject: v.array(strings) })) }),
]);

const freshCase = v.strictObject({
  variantId: text, prompt: text,
  /** A narrow, machine-checked answer; without one the case is the learner's own words, a self-check against `checklist`. */
  check: v.optional(narrowCheckSchema),
});
export const skillLessonSchema = v.strictObject({
  lessonId: text, position: v.pipe(integer, v.minValue(1)), title: text,
  competencyIds: v.pipe(strings, v.minLength(1)), prerequisites: strings,
  estimatedMinutes: v.pipe(integer, v.minValue(1), v.maxValue(15)),
  scenario: text,
  worked: v.strictObject({ prompt: text, answer: text, why: v.pipe(strings, v.minLength(1)) }),
  change: v.strictObject({ prompt: text, check: narrowCheckSchema }),
  fresh: v.pipe(v.array(freshCase), v.minLength(2)),
  checklist: v.tuple([text, text, text]),
  useItToday: text,
  rightsRef: text,
});
export const skillTrackPackSchema = v.strictObject({
  id: text, version: semver, schema: integer, minAppVersion: semver, title: text, author: text,
  createdAt: v.pipe(v.string(), v.isoTimestamp()), changelog: v.optional(text),
  kind: v.literal('skill-track'),
  body: v.strictObject({
    trackId: text, title: text,
    status: v.picklist(['draft', 'release']),
    competencies: v.pipe(v.array(v.strictObject({ id: text, name: text })), v.minLength(1)),
    lessons: v.pipe(v.array(skillLessonSchema), v.minLength(1)),
    comparison: v.strictObject({ promptId: text, prompt: text, rubric: v.pipe(strings, v.minLength(1)) }),
  }),
});
export const rightsEntrySchema = v.strictObject({
  id: text, author: text, licence: v.optional(text), source: v.optional(text),
  originalOrAdapted: v.picklist(['original', 'adapted']), reviewedOn: v.optional(v.pipe(v.string(), v.isoDate())),
});
export type SkillTrackPack = v.InferOutput<typeof skillTrackPackSchema>;
export type SkillLesson = v.InferOutput<typeof skillLessonSchema>;
export type RightsEntry = v.InferOutput<typeof rightsEntrySchema>;

const PLACEHOLDER = /\b(TODO|TBD|FIXME|lorem|xxx+)\b|\.\.\./i;

/** Every piece of text in a value, for the placeholder check. */
function allText(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(allText);
  if (value && typeof value === 'object') return Object.values(value).flatMap(allText);
  return [];
}

/** The rules a check must keep: answers that exist, near misses that are not right, and hidden tests that hold. */
function checkErrors(where: string, check: NarrowCheck, release: boolean): string[] {
  const errors: string[] = [];
  if (check.kind === 'choice') {
    if (new Set(check.options.map(normalize)).size !== check.options.length) errors.push(`${where}: duplicate options`);
    for (const accepted of check.accepted) if (!check.options.some(option => normalize(option) === normalize(accepted))) errors.push(`${where}: accepted answer is not an option: ${accepted}`);
    for (const miss of check.nearMisses ?? []) if (!check.options.some(option => normalize(option) === normalize(miss.answer))) errors.push(`${where}: near miss is not an option: ${miss.answer}`);
  }
  if (check.kind === 'phrase' && check.accepted.some(accepted => !normalize(accepted))) errors.push(`${where}: empty accepted answer`);
  if (check.kind === 'order' && new Set(check.parts.map(normalize)).size !== check.parts.length) errors.push(`${where}: duplicate parts`);
  for (const miss of check.nearMisses ?? []) if (checkAnswer(check, miss.answer).result === 'right') errors.push(`${where}: a near miss is also accepted`);
  for (const answer of check.tests?.accept ?? []) if (checkAnswer(check, answer).result !== 'right') errors.push(`${where}: hidden test should be accepted: ${String(answer)}`);
  for (const answer of check.tests?.reject ?? []) if (checkAnswer(check, answer).result === 'right') errors.push(`${where}: hidden test should be rejected: ${String(answer)}`);
  if (release && (!check.tests || !check.tests.accept.length || !check.tests.reject.length)) errors.push(`${where}: a release check needs hidden tests that accept and reject`);
  return errors;
}

/**
 * Every structural rule for a skill track, against its rights register. Each message names the lesson or item. A
 * `release` pack also needs hidden answer tests on every check and a complete rights entry (licence and review date)
 * for every lesson; a practitioner's review is not a gate (Jenil, 31 Oct).
 */
export function validateSkillTrack(input: unknown, rights: readonly RightsEntry[] | null): string[] {
  const parsed = v.safeParse(skillTrackPackSchema, input);
  if (!parsed.success) return parsed.issues.map(issue => `${v.getDotPath(issue) ?? 'pack'}: ${issue.message}`);
  const pack = parsed.output;
  const { lessons, competencies, status } = pack.body;
  const release = status === 'release';
  const errors: string[] = [];
  if (!pack.id.startsWith('skill-track.')) errors.push('id must match kind');
  const positions = lessons.map(lesson => lesson.position).sort((a, b) => a - b);
  if (positions.some((position, i) => position !== i + 1)) errors.push(`lesson positions must run 1 to ${lessons.length} with no gap or repeat`);
  const lessonIds = new Set<string>(), variantIds = new Set<string>();
  const byId = new Map(lessons.map(lesson => [lesson.lessonId, lesson]));
  const known = new Set(competencies.map(item => item.id));
  const used = new Map<string, number>();
  // Null when validatePack runs alone: the rights are then checked by validate-packs, which loads the register.
  const register = rights && new Map(rights.map(entry => [entry.id, entry]));
  for (const placeholder of allText(pack.body).filter(value => PLACEHOLDER.test(value))) errors.push(`placeholder text: ${placeholder}`);
  for (const lesson of lessons) {
    const where = lesson.lessonId;
    if (lessonIds.has(where)) errors.push(`${where}: duplicate lesson id`);
    lessonIds.add(where);
    for (const id of lesson.competencyIds) { if (!known.has(id)) errors.push(`${where}: unknown competency ${id}`); used.set(id, (used.get(id) ?? 0) + 1); }
    for (const id of lesson.prerequisites) {
      const before = byId.get(id);
      if (!before) errors.push(`${where}: prerequisite ${id} does not exist`);
      else if (before.position >= lesson.position) errors.push(`${where}: prerequisite ${id} must come earlier`);
    }
    errors.push(...checkErrors(`${where} change`, lesson.change.check as NarrowCheck, release));
    const prompts = new Set<string>();
    for (const fresh of lesson.fresh) {
      const at = `${where} ${fresh.variantId}`;
      if (variantIds.has(fresh.variantId)) errors.push(`${at}: duplicate variant id`);
      variantIds.add(fresh.variantId);
      if (prompts.has(normalize(fresh.prompt))) errors.push(`${at}: repeats another fresh case`);
      prompts.add(normalize(fresh.prompt));
      if (normalize(fresh.prompt) === normalize(lesson.worked.prompt)) errors.push(`${at}: repeats the worked example`);
      if (fresh.check) {
        errors.push(...checkErrors(at, fresh.check as NarrowCheck, release));
        if (checkAnswer(fresh.check as NarrowCheck, lesson.worked.answer).result === 'right') errors.push(`${at}: the worked answer would pass; a fresh case needs its own answer`);
      }
    }
    if (lesson.fresh.length < 2) errors.push(`${where}: needs two fresh cases`);
    const entry = register?.get(lesson.rightsRef);
    if (register && !entry) errors.push(`${where}: rights entry ${lesson.rightsRef} is missing`);
    else if (entry && release && (!entry.licence || !entry.reviewedOn)) errors.push(`${where}: rights entry ${entry.id} is incomplete for release`);
  }
  // A competency is introduced and then practised again: at least two lessons, once a track has two.
  for (const item of competencies) if ((used.get(item.id) ?? 0) < Math.min(2, lessons.length)) errors.push(`competency ${item.id} is not practised in two lessons`);
  return errors;
}
