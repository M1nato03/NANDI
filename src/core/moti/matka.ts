/**
 * Spec 26 A2, Moti's matka (cj8-matka-tarazu §4). First guesses are sealed when they are made (M1-M2, on the
 * append-only learn facts). On Sundays Moti asks for three of them back, picked from facts 5-21 days old, then
 * cracks the matka: sealed, remembered, answer. The copy blames "the mind" in general, never the person. Answering
 * pays a flat amount whatever the result; "Not sure" is a full answer; never after bedtime.
 */
export const MATKA = { itemsPerWeek: 3, minAgeDays: 5, maxAgeDays: 21 } as const;
export type MatkaLevel = 0 | 1 | 2;
/**
 * `sealedText` is the sealed hook pick's own words and `optionTexts` the hook's options in their order then, both
 * stored with it, so neither the reveal nor the options asked can be changed by a newer pack.
 */
export type MatkaItem = { factId: string; level: MatkaLevel; stepId?: string; itemId?: string; sealed: boolean | string | number; sealedText?: string; optionTexts?: string[]; answer?: number; dayKey: string };
type Fact = { id: string; kind: string; refId: string; dayKey: string; deleted?: number; inputs: Record<string, unknown> };

const days = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
const hash = (text: string) => { let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return h >>> 0; };

/** What a sealed fact can be asked about: Matka 2 (an estimate's number), Matka 1 (the hook's first pick), Matka 0 (whether the hook landed). */
export function matkaItem(fact: Fact): MatkaItem | undefined {
  if (fact.deleted) return undefined;
  if (fact.kind === 'learn-answer' && typeof fact.inputs.guess === 'number' && typeof fact.inputs.answerValue === 'number')
    return { factId: fact.id, level: 2, itemId: String(fact.inputs.itemId ?? ''), sealed: fact.inputs.guess, answer: fact.inputs.answerValue, dayKey: fact.dayKey };
  if (fact.kind === 'learn-lesson' && typeof fact.inputs.hookPick === 'string') return { factId: fact.id, level: 1, stepId: fact.refId, sealed: fact.inputs.hookPick, ...(typeof fact.inputs.hookPickText === 'string' ? { sealedText: fact.inputs.hookPickText } : {}), ...(Array.isArray(fact.inputs.hookOptionTexts) && fact.inputs.hookOptionTexts.every(text => typeof text === 'string') ? { optionTexts: fact.inputs.hookOptionTexts as string[] } : {}), dayKey: fact.dayKey };
  if (fact.kind === 'learn-lesson' && typeof fact.inputs.hookCorrect === 'boolean') return { factId: fact.id, level: 0, stepId: fact.refId, sealed: fact.inputs.hookCorrect, dayKey: fact.dayKey };
  return undefined;
}

/**
 * The week's items: Sundays only; from facts 5-21 days old; picked by a hash of the week and the fact, so the pick is
 * the same all day and does not depend on whether the guess was right. `askable` drops items the screen cannot ask
 * fairly (a Matka 1 item whose options a pack update mostly removed) before the three are picked.
 */
export function matkaPicks(facts: readonly Fact[], day: string, week: string, sunday: boolean, askable: (item: MatkaItem) => boolean = () => true): MatkaItem[] {
  if (!sunday) return [];
  return facts.map(matkaItem).filter((item): item is MatkaItem => !!item && askable(item))
    .filter(item => { const age = days(item.dayKey, day); return age >= MATKA.minAgeDays && age <= MATKA.maxAgeDays; })
    .sort((a, b) => hash(`${week}.${a.factId}`) - hash(`${week}.${b.factId}`) || a.factId.localeCompare(b.factId))
    .slice(0, MATKA.itemsPerWeek);
}

/** Matka 2: how far memory moved toward the answer (stored once, never scored). */
export function matkaShift(sealed: number, recalled: number, answer: number): number {
  const gapSealed = Math.abs(sealed - answer), gapRecalled = Math.abs(recalled - answer);
  return gapSealed > 0 ? (gapSealed - gapRecalled) / gapSealed : 0;
}

/**
 * Matka 1's options, in the order they had when the guess was sealed: each one still in today's pack keeps its id,
 * the sealed pick returns at its own place even if the pack dropped or reworded it, and other dropped options stay
 * out. Fewer than two of the original options left in the pack means the item is not asked (undefined).
 */
export function sealedOptions(item: MatkaItem, current: readonly { id: string; text: string }[]): { id: string; text: string }[] | undefined {
  if (!item.optionTexts || item.sealedText === undefined) return current.some(option => option.id === item.sealed) ? current.map(option => ({ id: option.id, text: option.text })) : undefined;
  if (item.optionTexts.filter(text => current.some(option => option.text === text)).length < 2) return undefined;
  return item.optionTexts.flatMap(text => {
    const now = current.find(option => option.text === text);
    if (now) return [{ id: now.id, text }];
    return text === item.sealedText ? [{ id: `sealed:${String(item.sealed)}`, text }] : [];
  });
}

export const MATKA_ASK = ['Moti sealed this in the matka before your lesson.', 'What was your first guess?'] as const;
export const MATKA_STOP = 'Matka closed for this week. See you next Sunday.';
export const MATKA_FOOTER = 'Hindsight bias: Fischhoff 1975; Fischhoff & Beyth 1975.';

/** The reveal copy, exactly as cj8 wrote it. `recalled` is a number (Matka 2), an option id (1), 'landed'/'missed' (0), or 'unsure'. */
export function matkaReveal(item: MatkaItem, recalled: number | string, show: { value: (v: number) => string; option?: (id: string) => string }): string[] {
  const sealedText = item.level === 2 ? show.value(item.sealed as number) : item.level === 1 ? item.sealedText ?? show.option?.(item.sealed as string) ?? String(item.sealed) : item.sealed ? 'your first guess landed' : 'your first guess missed';
  if (recalled === 'unsure') return [`Fair answer. Sealed: ${sealedText}. Answers this week: done.`];
  if (item.level === 2) {
    const line = `Sealed: ${show.value(item.sealed as number)}. You remembered: ${show.value(recalled as number)}. Answer: ${show.value(item.answer!)}.`;
    return matkaShift(item.sealed as number, recalled as number, item.answer!) > 0
      ? [line, "Your memory slid toward the answer. That's hindsight bias: once we know how it ended, it feels like we knew.", "Many people show it and don't notice. That's why Moti seals the guess first."]
      : [line, 'Spot on. Hindsight often nudges memory toward the answer without us noticing. The sealed guess is how we check.'];
  }
  // Matka 1 matches by the sealed words when it has them (a pack update may rename an option id or reword it).
  const matches = item.level === 1 ? (item.sealedText !== undefined ? show.option?.(recalled as string) === item.sealedText : recalled === item.sealed) : (recalled === 'landed') === item.sealed;
  if (matches) return ["Matches the seal. Hindsight can still nudge memory on other ideas; that's why Moti keeps the matka."];
  // cj8 has no line for "recalled missed, sealed landed"; this one says the seal plainly (sent to the idea engine to confirm).
  if (item.level === 0 && item.sealed === true) return ['Sealed: your first guess landed.', "Memory can drift either way. That's why Moti keeps the matka."];
  const lead = item.level === 1 ? `Sealed: your first pick was ${sealedText}.` : 'Sealed: your first guess missed.';
  return [lead, "After learning an idea, it's easy to feel you knew it already. That's hindsight bias. The lesson still did its job."];
}
