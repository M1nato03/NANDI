/**
 * Spec 30, Teach Chiku, one card. Chiku asks about the lesson's idea, the learner hands over one of three cards, and
 * Chiku acts out what that card predicts on a new day, then the scene replays what really happened. Each scene is
 * data from the topic pack; the stage has one Chiku, one prop from a fixed library and one act from a fixed set.
 */
export const CHIKU_PROPS = ['bus', 'train', 'phone', 'book', 'clock', 'bed', 'plate', 'cup', 'laptop', 'coin', 'shop', 'tree', 'rain', 'sun', 'door', 'bag', 'bat', 'weight', 'notebook', 'alarm', 'fan', 'road', 'crowd', 'mirror'] as const;
export const CHIKU_ACTS = ['pull-phone', 'pat-pocket', 'open-book', 'close-book', 'eat', 'skip', 'sleep', 'wake', 'pay', 'walk-away'] as const;
export type ChikuProp = (typeof CHIKU_PROPS)[number];
export type ChikuAct = (typeof CHIKU_ACTS)[number];
export type ChikuCard = { text: string; correct?: boolean; misconceptionId?: string };
export type ChikuGuess = { answer: 'yes' | 'no'; why: string; act: ChikuAct };
export type ChikuScene = {
  ask: string;
  cards: ChikuCard[];
  newDay: { caption: string; prop: ChikuProp; question: string };
  /** One guess per card, in the cards' order. */
  guesses: ChikuGuess[];
  truth: { answer: 'yes' | 'no'; caption: string; act: ChikuAct };
  /** The idea's claims the right card and what happened trace to. */
  claimIds: string[];
};

/** The content lint for a scene: every field present, 3 cards with one right card, acts and props from the lists. */
export function chikuProblems(scene: ChikuScene, misconceptionIds: readonly string[]): string[] {
  const problems: string[] = [];
  const filled = (text: unknown) => typeof text === 'string' && text.trim().length > 0;
  if (!filled(scene.ask)) problems.push('ask is empty');
  if (scene.cards.length !== 3) problems.push('needs exactly 3 cards');
  if (scene.cards.filter(card => card.correct).length !== 1) problems.push('needs exactly one right card');
  for (const card of scene.cards) {
    if (!filled(card.text)) problems.push('a card has no text');
    if (!card.correct && (!card.misconceptionId || !misconceptionIds.includes(card.misconceptionId))) problems.push(`card "${card.text}" must name one of the idea's misconceptions`);
  }
  if (!filled(scene.newDay?.caption) || !filled(scene.newDay?.question)) problems.push('newDay needs a caption and a question');
  if (!(CHIKU_PROPS as readonly string[]).includes(scene.newDay?.prop)) problems.push(`prop "${scene.newDay?.prop}" is not in the library`);
  if (scene.guesses.length !== scene.cards.length) problems.push('needs one guess per card');
  for (const guess of [...scene.guesses, scene.truth]) {
    if (!(CHIKU_ACTS as readonly string[]).includes(guess?.act)) problems.push(`act "${guess?.act}" is not in the set`);
    if (guess?.answer !== 'yes' && guess?.answer !== 'no') problems.push('an answer must be yes or no');
  }
  for (const guess of scene.guesses) if (!filled(guess.why)) problems.push('a guess has no reason');
  if (!filled(scene.truth?.caption)) problems.push('truth needs a caption');
  const right = scene.cards.findIndex(card => card.correct);
  if (right >= 0 && scene.guesses[right] && scene.guesses[right]!.answer !== scene.truth.answer) problems.push("the right card's guess must match what happened");
  return problems;
}

/** The order the three cards are shown in: seeded by the idea and day, so the right card's place moves. */
export function chikuOrder(seedText: string, count = 3): number[] {
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) { hash ^= seedText.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) { hash = Math.imul(hash ^ (hash >>> 13), 1274126177); const j = (hash >>> 0) % (i + 1); [order[i], order[j]] = [order[j]!, order[i]!]; }
  return order;
}

/** Whether Chiku's guess from a card matches what really happened. */
export const chikuMatches = (scene: ChikuScene, card: number) => scene.guesses[card]?.answer === scene.truth.answer;

/** The test fixture from the spec (Kunal and the train); real scenes come from the signed-off packs. */
export const KUNAL_SCENE: ChikuScene = {
  ask: 'Kunal opens his flashcard app every time his train pulls out of the station. Why does he open it? Give me one card.',
  cards: [
    { text: 'The train leaving the station', correct: true },
    { text: 'Wanting to revise', misconceptionId: 'habits-m1' },
    { text: 'Having free time', misconceptionId: 'habits-m2' },
  ],
  newDay: { caption: "New day: Kunal's train is cancelled, so he takes the bus.", prop: 'bus', question: 'Will he open the app on the bus?' },
  guesses: [
    { answer: 'no', why: 'Your card says the train makes him open it. No train today, so no app.', act: 'pat-pocket' },
    { answer: 'yes', why: 'Your card says wanting to revise makes him open it. He still wants to.', act: 'pull-phone' },
    { answer: 'yes', why: 'Your card says free time makes him open it. He has free time on the bus too.', act: 'pull-phone' },
  ],
  truth: { answer: 'no', caption: 'What happened: on the bus, Kunal forgot the app.', act: 'pat-pocket' },
  claimIds: ['habits-c1'],
};
