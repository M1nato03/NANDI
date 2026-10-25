/**
 * Spec 26 A2, Moti's matka (cj8-matka-tarazu §4). First guesses are sealed when they are made (M1-M2, on the
 * append-only learn facts). On Sundays Moti asks for three of them back, picked from facts 5-21 days old, then
 * cracks the matka: sealed, remembered, answer. The copy blames "the mind" in general, never the person. Answering
 * pays a flat amount whatever the result; "Not sure" is a full answer; never after bedtime.
 */
export const MATKA = { itemsPerWeek: 3, minAgeDays: 5, maxAgeDays: 21 } as const;
export type MatkaLevel = 0 | 1 | 2;
export type MatkaItem = { factId: string; level: MatkaLevel; stepId?: string; itemId?: string; sealed: boolean | string | number; answer?: number; dayKey: string };
type Fact = { id: string; kind: string; refId: string; dayKey: string; deleted?: number; inputs: Record<string, unknown> };

const days = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
const hash = (text: string) => { let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return h >>> 0; };

/** What a sealed fact can be asked about: Matka 2 (an estimate's number), Matka 1 (the hook's first pick), Matka 0 (whether the hook landed). */
export function matkaItem(fact: Fact): MatkaItem | undefined {
  if (fact.deleted) return undefined;
  if (fact.kind === 'learn-answer' && typeof fact.inputs.guess === 'number' && typeof fact.inputs.answerValue === 'number')
    return { factId: fact.id, level: 2, itemId: String(fact.inputs.itemId ?? ''), sealed: fact.inputs.guess, answer: fact.inputs.answerValue, dayKey: fact.dayKey };
  if (fact.kind === 'learn-lesson' && typeof fact.inputs.hookPick === 'string') return { factId: fact.id, level: 1, stepId: fact.refId, sealed: fact.inputs.hookPick, dayKey: fact.dayKey };
  if (fact.kind === 'learn-lesson' && typeof fact.inputs.hookCorrect === 'boolean') return { factId: fact.id, level: 0, stepId: fact.refId, sealed: fact.inputs.hookCorrect, dayKey: fact.dayKey };
  return undefined;
}

/**
 * The week's items: Sundays only; from facts 5-21 days old; picked by a hash of the week and the fact, so the pick is
 * the same all day and does not depend on whether the guess was right.
 */
export function matkaPicks(facts: readonly Fact[], day: string, week: string, sunday: boolean): MatkaItem[] {
  if (!sunday) return [];
  return facts.map(matkaItem).filter((item): item is MatkaItem => !!item)
    .filter(item => { const age = days(item.dayKey, day); return age >= MATKA.minAgeDays && age <= MATKA.maxAgeDays; })
    .sort((a, b) => hash(`${week}.${a.factId}`) - hash(`${week}.${b.factId}`) || a.factId.localeCompare(b.factId))
    .slice(0, MATKA.itemsPerWeek);
}

/** Matka 2: how far memory moved toward the answer (stored once, never scored). */
export function matkaShift(sealed: number, recalled: number, answer: number): number {
  const gapSealed = Math.abs(sealed - answer), gapRecalled = Math.abs(recalled - answer);
  return gapSealed > 0 ? (gapSealed - gapRecalled) / gapSealed : 0;
}

export const MATKA_ASK = ['Moti sealed this in the matka before your lesson.', 'What was your first guess?'] as const;
export const MATKA_STOP = 'Matka closed for this week. See you next Sunday.';
export const MATKA_FOOTER = 'Hindsight bias: Fischhoff 1975; Fischhoff & Beyth 1975.';

/** The reveal copy, exactly as cj8 wrote it. `recalled` is a number (Matka 2), an option id (1), 'landed'/'missed' (0), or 'unsure'. */
export function matkaReveal(item: MatkaItem, recalled: number | string, show: { value: (v: number) => string; option?: (id: string) => string }): string[] {
  const sealedText = item.level === 2 ? show.value(item.sealed as number) : item.level === 1 ? show.option?.(item.sealed as string) ?? String(item.sealed) : item.sealed ? 'your first guess landed' : 'your first guess missed';
  if (recalled === 'unsure') return [`Fair answer. Sealed: ${sealedText}. Answers this week: done.`];
  if (item.level === 2) {
    const line = `Sealed: ${show.value(item.sealed as number)}. You remembered: ${show.value(recalled as number)}. Answer: ${show.value(item.answer!)}.`;
    return matkaShift(item.sealed as number, recalled as number, item.answer!) > 0
      ? [line, "Your memory slid toward the answer. That's hindsight bias: once we know how it ended, it feels like we knew.", "Many people show it and don't notice. That's why Moti seals the guess first."]
      : [line, 'Spot on. Hindsight often nudges memory toward the answer without us noticing. The sealed guess is how we check.'];
  }
  const matches = item.level === 1 ? recalled === item.sealed : (recalled === 'landed') === item.sealed;
  if (matches) return ["Matches the seal. Hindsight can still nudge memory on other ideas; that's why Moti keeps the matka."];
  // cj8 has no line for "recalled missed, sealed landed"; this one says the seal plainly (sent to the idea engine to confirm).
  if (item.level === 0 && item.sealed === true) return ['Sealed: your first guess landed.', "Memory can drift either way. That's why Moti keeps the matka."];
  const lead = item.level === 1 ? `Sealed: your first pick was ${sealedText}.` : 'Sealed: your first guess missed.';
  return [lead, "After learning an idea, it's easy to feel you knew it already. That's hindsight bias. The lesson still did its job."];
}
