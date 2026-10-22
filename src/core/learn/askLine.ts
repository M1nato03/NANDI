import { dayKey } from '../time/dayKey';

/**
 * Spec 19 E: "Ask someone" after a lesson. Each idea may carry an editor-written `askLine`: one question that
 * makes sense alone and does not give the answer away. Hooks are never reused for this (most state the answer).
 */
export const ASK_LINE_MAX = 140;
const APP = 'nandi.nandi11.workers.dev';

type AskConcept = {
  id: string;
  title: string;
  askLine?: string;
  items: readonly { options: readonly { text: string; correct: boolean }[] }[];
};

const plain = (value: string) => ` ${value.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;

/**
 * A simple, honest check, not a guarantee: the line is at most 140 characters, ends with "?", and does not contain,
 * word for word, the text of any right option of the idea's items, or the idea's key term (its title).
 * Editors still read every line; this catches the plain give-aways.
 */
export function askLineProblems(concept: AskConcept): string[] {
  const line = concept.askLine;
  if (line === undefined) return [];
  const problems: string[] = [];
  if (!line.trim()) problems.push('askLine is empty');
  if (line.length > ASK_LINE_MAX) problems.push(`askLine is longer than ${ASK_LINE_MAX} characters`);
  if (!line.trimEnd().endsWith('?')) problems.push('askLine must end with "?"');
  const text = plain(line);
  if (plain(concept.title).trim() && text.includes(plain(concept.title))) problems.push(`askLine names the key term "${concept.title}"`);
  const answers = new Set(concept.items.flatMap(item => item.options.filter(option => option.correct).map(option => option.text)));
  for (const answer of answers) if (plain(answer).trim() && text.includes(plain(answer))) problems.push(`askLine contains the right answer "${answer}"`);
  return problems;
}

/** The message the person sends. Plain link with no tracking. */
export function askMessage(askLine: string): string {
  return `Quick one: ${askLine} Guess, then ask me. I learned it on NANDI today. ${APP}`;
}

/**
 * The first idea of this finish screen that was met today (first answered today, or taught in this drop) and has
 * an askLine. None → no button.
 */
export function askLineFor(touched: readonly Pick<AskConcept, 'id' | 'askLine'>[], states: readonly { id: string; firstLearnedAt?: number; deleted?: number }[], now: number, taughtIds: readonly string[] = []): string | undefined {
  const today = dayKey(now);
  const metToday = (id: string) => taughtIds.includes(id) || states.some(row => row.id === id && !row.deleted && row.firstLearnedAt !== undefined && dayKey(row.firstLearnedAt) === today);
  return touched.find(concept => concept.askLine && metToday(concept.id))?.askLine;
}
