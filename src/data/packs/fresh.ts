import type { Pack } from './schemas';

/**
 * Spec 16, fresh practice: inside a step every question should use the idea in a new way.
 * These are the rules the validator can check (R1-R7); R8 and R9 stay in the content review.
 */
export const PRACTICE_JOBS = ['reverse', 'misconception', 'transfer', 'combine', 'edge', 'recall'] as const;

const STOP = new Set(['about', 'after', 'again', 'also', 'because', 'been', 'before', 'being', 'both', 'does', 'each', 'even', 'from', 'have', 'into', 'just', 'less', 'like', 'more', 'most', 'much', 'only', 'other', 'over', 'same', 'some', 'such', 'than', 'that', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 'what', 'when', 'where', 'which', 'while', 'will', 'with', 'would', 'your', 'very', 'make', 'makes', 'made']);
const ABSOLUTE = /\b(?:always|never|only|all|nothing|exactly|every)\b/gi;
const REASON = /\b(?:because|so|which means|that is why|this is why|since)\b/i;
const AUTHORITY = /\b(?:says|said|according to|recommends?|the guide)\b/i;
const AUTHORITY_NAMES = /\b(?:WHO|CDC|NHS)\b/;
const FREE_NUMBERS = new Set(['0', '1', '2', '10', '100']);

/** Content words: 4+ letters, not a stop word, with a plain plural folded. */
export function contentWords(value: string): Set<string> {
  const found = value.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  return new Set(found.filter(word => !STOP.has(word)).map(word => word.length > 4 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word));
}
const numbers = (value: string) => new Set((value.replace(/(\d),(\d)/g, '$1$2').match(/\d+(?:\.\d+)?/g) ?? []).filter(number => !FREE_NUMBERS.has(number)));
/** Capitalised words that are not the first word of a sentence: names and places in a story frame. */
const names = (value: string) => new Set(value.split(/[.!?]["”’']?\s+|\s["“‘']|^["“‘']/).flatMap(sentence => (sentence.match(/[A-Za-z]+/g) ?? []).slice(1).filter(word => /^[A-Z][a-z]{2,}$/.test(word))));
// Places, days and sky words are shared setting, not a story frame (R2 is about named people).
const COMMON_NAMES = new Set(['India', 'Indian', 'Indians', 'Delhi', 'Mumbai', 'Chennai', 'Kolkata', 'Bengaluru', 'Earth', 'Moon', 'Sun', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']);
const shares = (a: Set<string>, b: Set<string>) => [...a].filter(word => b.has(word));

interface Question { where: string; options: { text: string; correct: boolean }[] }

export function freshPracticeErrors(pack: Pack): string[] {
  if (pack.kind !== 'topic') return [];
  const errors: string[] = [];
  const questions: Question[] = [];
  for (const module of pack.body.modules) for (const concept of module.concepts) {
    if (!concept.steps) continue;
    const titleWords = contentWords(concept.title);
    let recalls = 0;
    concept.steps.forEach((step, stepIndex) => {
      const at = `${concept.id}.step.${step.id}`;
      // R7: a teach card gives the reason and keeps the authority in the source panel.
      if (!REASON.test(step.teach)) errors.push(`${at}: teach card needs a reason link (because, so, which means, since)`);
      if (AUTHORITY.test(step.teach) || AUTHORITY_NAMES.test(step.teach)) errors.push(`${at}: teach card leans on an authority; keep the source in the sources`);
      // R6: a hint points; it never shares a content word with the right answer.
      step.guided.forEach((guided, index) => {
        const right = guided.options.find(option => option.correct);
        const overlap = right ? shares(contentWords(guided.hint), contentWords(right.text)) : [];
        if (overlap.length) errors.push(`${at}.guided.${index}: hint gives the answer away ("${overlap.join('", "')}")`);
        questions.push({ where: `${at}.guided.${index}`, options: guided.options });
      });
      questions.push({ where: `${at}.hook`, options: step.hook.options });
      const lesson = [step.hook.stem, ...step.hook.options.map(option => option.text), ...step.example.parts, ...step.guided.flatMap(guided => [guided.stem, ...guided.options.map(option => option.text)])].join(' ');
      const lessonNumbers = numbers(lesson);
      // The idea's own people and places (named in its teaching or claims) are the subject, not a reused story frame.
      const capitals = (value: string) => value.match(/\b[A-Z][a-z]{2,}\b/g) ?? [];
      const known = new Set([step.teach, step.takeaway, concept.title, concept.rule, concept.hook, ...concept.claims.map(claim => claim.text)].flatMap(capitals));
      const lessonNames = new Set([...names(lesson)].filter(name => !known.has(name) && !COMMON_NAMES.has(name)));
      const jobs = new Set<string>();
      for (const item of concept.items.filter(candidate => candidate.step === step.id)) {
        const text = [item.stem, ...item.options.map(option => option.text)].join(' ');
        // R1: each practice item does its own job; recall at most once per idea and never in step 1.
        if (!item.job) errors.push(`${item.id}: needs a practice job (${PRACTICE_JOBS.join(', ')})`);
        else {
          if (jobs.has(item.job)) errors.push(`${item.id}: job ${item.job} repeats in ${step.id}`);
          jobs.add(item.job);
          if (item.job === 'recall') { recalls += 1; if (stepIndex === 0) errors.push(`${item.id}: no plain recall in the first step`); }
        }
        // R2: no number or named person carried over from this step's lesson.
        const reusedNumbers = [...numbers(text)].filter(number => lessonNumbers.has(number));
        if (reusedNumbers.length) errors.push(`${item.id}: reuses ${reusedNumbers.join(', ')} from its step's lesson`);
        const reusedNames = [...names(item.stem)].filter(name => lessonNames.has(name));
        if (reusedNames.length) errors.push(`${item.id}: reuses ${reusedNames.join(', ')} from its step's lesson`);
        // R3: a match item has 3-4 pairs, and no pair's two sides share a word.
        if (item.type === 'match') {
          const byId = new Map(item.options.map(option => [option.id, option.text]));
          const pairs = new Map<string, [string, string]>();
          for (const pair of item.answer) pairs.set([pair.left, pair.right].sort().join('|'), [pair.left, pair.right]);
          if (pairs.size < 3 || pairs.size > 4) errors.push(`${item.id}: a match needs 3-4 pairs (has ${pairs.size})`);
          for (const [left, right] of pairs.values()) {
            const overlap = shares(contentWords(byId.get(left) ?? ''), contentWords(byId.get(right) ?? ''));
            if (overlap.length) errors.push(`${item.id}: pair ${left}-${right} shares "${overlap.join('", "')}"`);
          }
        }
        // R4: a fill-the-step never asks for the idea's own name.
        if (item.type === 'fill-the-step') {
          const right = item.options.find(option => option.correct);
          if (right && shares(contentWords(right.text), titleWords).length) errors.push(`${item.id}: fill-the-step answer repeats the idea's title`);
        }
        if (item.type !== 'order' && item.type !== 'match' && item.type !== 'estimate') questions.push({ where: item.id, options: item.options });
      }
    });
    if (recalls > 1) errors.push(`${concept.id}: at most one plain recall item per idea`);
  }
  if (!questions.length) return errors;
  // R5: across the topic, the right answer must not stand out by length or by careful wording.
  const longest = questions.filter(question => {
    const right = question.options.find(option => option.correct);
    return right && question.options.every(option => option === right || option.text.length < right.text.length);
  }).length;
  if (longest / questions.length > 0.4) errors.push(`topic: the right answer is the longest option in ${Math.round(100 * longest / questions.length)}% of questions (at most 40%)`);
  const rate = (correct: boolean) => {
    const texts = questions.flatMap(question => question.options.filter(option => option.correct === correct).map(option => option.text));
    return { hits: texts.reduce((sum, value) => sum + (value.match(ABSOLUTE)?.length ?? 0), 0), count: texts.length };
  };
  const wrong = rate(false), right = rate(true);
  if (wrong.hits > 2 && wrong.hits / wrong.count > 1.5 * (right.hits / right.count)) errors.push(`topic: absolute words (always, never, only, every...) sit mostly in wrong options (${wrong.hits} in ${wrong.count} wrong vs ${right.hits} in ${right.count} right)`);
  return errors;
}
