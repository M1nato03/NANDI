/**
 * Spec 40 "Your first year" (the Babylon book game): the approved round-14 prototype's year, ported unchanged in
 * content and math (D:/nandi-proto/teachplay/index.round14.html). Pure and deterministic: every step takes a state
 * and returns a new one; there is no randomness anywhere. The UI lives in src/ui/bookGame; the state is saved in
 * Dexie's bookGameStates (version 7).
 */
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
export const CUSHION_TARGET = 42000;

export interface Goal { name: string; icon: string; amount: number }
export const GOALS: readonly Goal[] = [
  { name: 'A new laptop', icon: 'laptop', amount: 65000 },
  { name: 'Goa with friends', icon: 'palm', amount: 45000 },
  { name: 'Bike down-payment', icon: 'scooter', amount: 90000 },
];

/** Each month's cure (Clason's cure) and its one line. */
export const CURES: readonly (readonly [string, string])[] = [
  ['Pay yourself first', 'Keep a part of salary before the month runs away.'], ['Spend less than you earn', 'Tiny monthly charges add up.'],
  ['Guard your money', 'A big claim needs a real check.'], ['Guard your money', 'A job should not start with a fee.'],
  ['Make your money work', 'Give a small part a job, with no promises.'], ['Lend wisely', 'Know the person, the plan, and the date.'],
  ['Spend less than you earn', 'The small print is part of the price.'], ['Protect the unexpected', 'Your cushion is for days like this.'],
  ['Increase what you can earn', 'A useful skill can change later pay.'], ['Plan the big spends', 'Fun still gets a number.'],
  ['Earn more, save more', 'A raise is a chance to reset the split.'], ['Look back', 'The year is a trail of choices, not a grade.'],
];
export const CURE_NUMBERS = [1, 2, 4, 4, 3, 4, 2, 4, 7, 2, 7, 1] as const;
export const LAW_NUMBERS = [1, 0, 5, 5, 2, 3, 4, 0, 0, 0, 1, 0] as const;
export const PLAY_TITLES = ['Salary day', 'The quiet renewals', 'Tips channel', 'The internship email', 'Give a little a job', 'Rohan has a plan', 'That new phone', 'The laptop dies', 'A weekend course', 'Festival plans', 'The raise lands', 'Your year, in numbers'] as const;
export const RESULT_TITLES = ['You made a first split', 'Your bills got lighter', 'You saw the pitch', 'You checked the fee', 'A pot started growing', 'You chose on Rohan', 'You read the small print', 'The cushion had a job', 'A skill for later', 'The festival had a number', 'You reset the split', 'Your year'] as const;

export type Tag = 'red' | 'green' | 'grey';
export interface Scenario { kind: string; icon: string; message: string; signs: string; experts: readonly (readonly [string, string])[]; bad: string; good: string }
/** The four "spot the signs" months. A phrase is {text|tag|red/green/grey}. */
export const SCENARIOS: Readonly<Record<number, Scenario>> = {
  2: { kind: 'Tips channel · 48K members', icon: '↗', message: 'Screenshots show {+212% this week|No proof|red}. Join VIP for {₹2,999|Price alone|grey} to get {sure-shot calls|Too good|red}. {Only 20 seats left|Pressure|red}.', signs: 'No proof · Too good · Pressure',
    experts: [['Registered investment adviser', 'A registered adviser cannot promise a fixed win. Screenshots are not evidence.'], ['Friend who forwarded it', 'I just saw the post too.'], ['The channel admin', 'They are selling the VIP seats.']],
    bad: 'VIP fee went. The screenshots still prove nothing.', good: 'You kept the fee and skipped the pressure.' },
  3: { kind: 'Internship inbox', icon: '✉', message: 'Selected for a {work-from-home role|Not a sign alone|grey} at {₹15,000 a month|Amount alone|grey}. Pay a {₹1,999 refundable kit fee|Pay to join|red} to confirm {by tonight|Pressure|red}.', signs: 'Pay to join · Pressure',
    experts: [['Company careers page', 'There is no listing there, and a role should not require a joining fee.'], ['The sender', 'They wrote the fee request.'], ['A friend in another field', 'They cannot verify this opening.']],
    bad: 'The kit fee went. The internship did not appear.', good: 'You kept the fee and checked the actual opening.' },
  5: { kind: 'Rohan · college friend', icon: '◉', message: 'I have {40 delivered orders|Track record|green} and an {order list|Has a plan|green}. Can I borrow {₹4,000|Amount alone|grey} for sneaker stock? I wrote that I will repay ₹4,300 {by the 15th|Written date|green}.', signs: 'Track record · Has a plan · Written date',
    experts: [['Rohan and his order list', 'The delivered orders and repayment date are written down. Still lend only what fits.'], ['A random follower', 'I just like the photos.'], ['The tips channel', 'They do not know his business.']],
    bad: '', good: 'Rohan repaid ₹4,300 in July, then remembered you for a paid gig.' },
  6: { kind: 'Phone checkout', icon: '▣', message: 'New phone, {₹79,999|Price alone|grey}. The banner says {no-cost EMI|Read full cost|grey}, but checkout adds a {₹1,499 fee|Hidden fee|red}, a {pre-ticked ₹199 plan|Add-on|red}, and {12 monthly payments|Long promise|red}.', signs: 'Hidden fee · Add-on · Long promise',
    experts: [['Full payment schedule', 'The fee, add-on and 12 payments are real costs.'], ['The banner', 'It only shows the headline price.'], ['A friend who likes phones', 'They have not seen this checkout.']],
    bad: 'The phone is yours; the payments come with it.', good: 'You can still want it. Waiting keeps the plan flexible.' },
};
export const SIGN_MONTHS = [2, 3, 5, 6] as const;
export const SUBS: readonly (readonly [string, number])[] = [['OTT app #1', 599], ['OTT app #2', 799], ['Gym you have not used', 499], ['Food app pass', 603]];
export const SPLIT = [{ total: 0, mine: 0, cushion: 0 }, { total: 2500, mine: 1250, cushion: 1250 }, { total: 5000, mine: 2500, cushion: 2500 }, { total: 7500, mine: 2500, cushion: 5000 }] as const;
export const FESTIVAL_CHOICES = [0, 2500, 5000, 8000] as const;

export type Pot = 'mine' | 'cushion' | 'growing';
export interface LedgerEntry { month: number; pot: Pot | 'debt'; delta: number; label: string }
export interface HistoryPoint { mine: number; cushion: number; growing: number; debt: number; net: number }
export type Phase = 'teach' | 'play' | 'result' | 'end';
/** A month's result, saved once when it ends, so the month reopens read-only exactly as it was. */
export interface MonthResult { text: string; stamp: string; lesson: string; habit: string; before: number; after: number; moves: LedgerEntry[] }
export interface ArkadState {
  month: number; phase: Phase; goal: number | null;
  pots: Record<Pot, number>; debt: number; split: number; pendingSplit: number;
  credited: boolean[]; found: Record<number, boolean>; subs: boolean[];
  invested: boolean; skippedGrowthPotential: boolean; lent: boolean; phone: boolean; course: boolean; festival: number;
  history: (HistoryPoint | null)[]; ledger: LedgerEntry[]; last: LedgerEntry[];
  lastText: string; lastStamp: string; lastHabit: string; lastLesson: string; lastBefore: number; lastAfter: number;
  results: Record<number, MonthResult>;
}

export const fresh = (): ArkadState => ({
  month: 0, phase: 'teach', goal: null, pots: { mine: 0, cushion: 0, growing: 0 }, debt: 0, split: 2, pendingSplit: 2,
  credited: Array(12).fill(false), found: {}, subs: [false, false, false, false], invested: false, skippedGrowthPotential: false,
  lent: false, phone: false, course: false, festival: 2500, history: [], ledger: [], last: [],
  lastText: '', lastStamp: '', lastHabit: '', lastLesson: '', lastBefore: 0, lastAfter: 0, results: {},
});

export const net = (s: ArkadState) => s.pots.mine + s.pots.cushion + s.pots.growing - s.debt;
export const goalSaved = (s: ArkadState) => Math.max(0, s.pots.mine + s.pots.growing - s.debt);
export const fmt = (n: number) => `${n < 0 ? '−' : ''}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`;
const clone = (s: ArkadState): ArkadState => structuredClone(s);
const freed = (s: ArkadState) => s.subs.reduce((n, v, i) => n + (v ? SUBS[i]![1] : 0), 0);

// The prototype's money moves, on a working copy.
function move(s: ArkadState, pot: Pot, delta: number, label: string) {
  if (!delta) return;
  s.pots[pot] += delta;
  s.ledger.push({ month: s.month, pot, delta, label });
  s.last.push({ month: s.month, pot, delta, label });
}
function depositCushion(s: ArkadState, amount: number, label: string) {
  const room = Math.max(0, CUSHION_TARGET - s.pots.cushion), kept = Math.min(amount, room);
  move(s, 'cushion', kept, label);
  move(s, 'mine', amount - kept, 'Cushion is full, so the rest went to Mine');
}
function debtMove(s: ArkadState, amount: number, label: string) {
  if (!amount) return;
  s.debt += amount;
  s.ledger.push({ month: s.month, pot: 'debt', delta: amount, label });
  s.last.push({ month: s.month, pot: 'debt', delta: amount, label });
}
function charge(s: ArkadState, amount: number, label: string, priority: readonly Pot[] = ['mine', 'cushion']) {
  let left = amount;
  for (const pot of priority) { const n = Math.min(left, s.pots[pot]); move(s, pot, -n, label); left -= n; }
  if (left) debtMove(s, left, label === 'Laptop repair, paid from Cushion' ? 'Unpaid repair bill' : `${label} unpaid`);
}
function finish(s: ArkadState, text: string, stamp: string, lesson: string, habit: string): ArkadState {
  s.lastAfter = net(s); s.lastText = text; s.lastStamp = stamp; s.lastLesson = lesson; s.lastHabit = habit;
  s.history[s.month] = { mine: s.pots.mine, cushion: s.pots.cushion, growing: s.pots.growing, debt: s.debt, net: net(s) };
  s.results = { ...(s.results ?? {}), [s.month]: { text, stamp, lesson, habit, before: s.lastBefore, after: s.lastAfter, moves: [...s.last] } };
  s.phase = 'result';
  return s;
}

/** Opens month `m`: salary and every carry-over land once (credited), never twice on a re-entry. */
export function enterMonth(state: ArkadState, m: number): ArkadState {
  const s = clone(state);
  s.month = m; s.phase = 'play'; s.found = {}; s.last = []; s.lastBefore = net(s);
  if (m === 10 && !s.credited[m] && s.invested) move(s, 'growing', 40, 'Example growth (Growing pot)');
  if (!s.credited[m] && m !== 10) {
    s.credited[m] = true;
    if (m > 0) {
      const sp = SPLIT[s.split]!;
      move(s, 'mine', sp.mine, 'Salary: kept in Mine');
      depositCushion(s, sp.cushion, 'Salary: added to Cushion');
      if (m === 11 && s.course && s.split > 0) move(s, 'mine', 3000, 'Course raise, extra salary');
      if (m >= 2) depositCushion(s, freed(s), 'Subscriptions stayed off');
      if (m >= 5 && s.invested) move(s, 'growing', 40, 'Example growth (Growing pot)');
      if (m === 6 && s.lent) move(s, 'mine', 4300, 'Rohan repaid on the 15th');
      if (m === 9 && s.lent) move(s, 'mine', 1000, "Rohan’s paid gig");
      if (m >= 7 && s.phone) charge(s, 6667, `Phone EMI ${MONTHS[m]}`);
    }
  }
  return s;
}

export type Action = 'split-commit' | 'feb-commit' | 'festival-commit' | 'dec-commit' | 'yes' | 'no' | 'invest' | 'keep' | 'repair' | 'course' | 'skip';

/** The month's one move, as the prototype's applyAction; it ends the month (phase 'result'). */
export function applyAction(state: ArkadState, action: Action): ArkadState {
  const s = clone(state);
  const m = s.month;
  if (m === 0 || m === 10) {
    s.split = s.pendingSplit;
    const sp = SPLIT[s.split]!;
    move(s, 'mine', sp.mine, 'Salary: kept in Mine');
    depositCushion(s, sp.cushion, 'Salary: added to Cushion');
    if (m === 10 && s.course && s.split > 0) move(s, 'mine', 3000, 'Course raise, extra salary');
    s.credited[m] = true;
    return finish(s, m === 10 ? `${s.course ? 'The course paid off: ₹3,000 extra salary this month. ' : ''}Your new split leaves ${fmt(sp.total)} with you.` : `You kept ${fmt(sp.total)} before the month got busy. The rest went to rent, food, travel, phone, and going out.`,
      'SPLIT SET', 'Pay yourself first.', 'Set an auto-transfer for an amount that fits.');
  }
  if (m === 1) {
    const f = freed(s);
    depositCushion(s, f, 'Cancelled subscriptions');
    return finish(s, `${f ? `${fmt(f)} stayed in Cushion this month, and the same charges stay off later.` : 'You kept the subscriptions for now. You can still review them later.'} ${s.pots.cushion >= 10000 ? 'Because you built a ₹10,000 cushion by February, a later surprise has somewhere to land.' : ''}`,
      'BILLS CHECKED', 'Spend less than you earn.', 'Check the renewals after salary day.');
  }
  if ((SIGN_MONTHS as readonly number[]).includes(m)) {
    const yes = action === 'yes';
    if (m === 2 && yes) charge(s, 2999, 'Tips channel VIP fee');
    if (m === 3 && yes) charge(s, 1999, 'Internship kit fee');
    if (m === 5 && yes) {
      if (s.pots.mine >= 4000) { move(s, 'mine', -4000, 'Lent to Rohan'); s.lent = true; }
      else return finish(s, 'You wanted to help, but ₹4,000 was not free in Mine. Nothing left your pots.', 'NOT THIS TIME', 'Lend only what fits.', 'Ask for the plan and repayment date.');
    }
    if (m === 6 && yes) { s.phone = true; charge(s, 1698, 'Phone fee and first add-on'); }
    const d = SCENARIOS[m]!;
    const text = m === 5 ? (yes ? 'Rohan has the stock. His written July repayment is on the calendar.' : 'Rohan found another way to buy stock. You kept your pot.') : yes ? d.bad : d.good;
    return finish(s, text, yes ? (m === 5 ? 'PLAN CHECKED' : m === 6 ? 'PHONE BOUGHT' : 'SCAM SIGNS') : (m === 5 ? 'KEPT MINE' : 'SIGNS SPOTTED'),
      m === 5 ? 'Lend when you know how they can repay.' : m === 6 ? 'Spend less than you earn.' : 'Guard your money from loss.',
      m === 5 ? 'Put the amount and date in writing.' : m === 6 ? 'Read every fee and pre-ticked add-on.' : m === 3 ? 'Search the company name with “fee scam”.' : 'Mute channels promising sure-shot calls.');
  }
  if (m === 4) {
    if (action === 'invest') { const n = Math.min(3000, s.pots.mine); move(s, 'mine', -n, 'Moved to Growing'); move(s, 'growing', n, 'First growth choice'); s.invested = n > 0; }
    if (action !== 'invest' && s.pots.mine >= 3000) s.skippedGrowthPotential = true;
    return finish(s, s.invested ? '₹3,000 moved to Growing. Here it adds ₹40 a month: fictional example growth, not a promise.' : 'You kept the money in Mine. Growing stays empty.',
      'CHOICE MADE', 'Make your money work, with care.', 'Check what a product does before using it.');
  }
  if (m === 7) {
    if (s.pots.cushion >= 10000) {
      move(s, 'cushion', -10000, 'Laptop repair, paid from Cushion');
      return finish(s, 'Because you built a ₹10,000 Cushion, the laptop repair is covered. Mine and this month’s pay are untouched.', 'COVERED', 'Protect against the unexpected.', 'Keep a repair cushion separate from daily spending.');
    }
    charge(s, 12000, 'Laptop repair, paid from Cushion', ['cushion', 'mine']);
    return finish(s, 'The repair needed ₹12,000 including a ₹2,000 rush cost. Your pots paid what they could; any rest became unpaid.', 'TOUGH MONTH', 'Protect against the unexpected.', 'A small cushion is a start, even before a full target.');
  }
  if (m === 8) {
    if (action === 'course') { charge(s, 3000, 'Weekend course'); s.course = true; }
    return finish(s, s.course ? 'You paid for the course. In November it unlocks a ₹3,000 monthly raise in this story.' : 'You skipped it this time. Your salary stays the same in November.', 'SKILL CHOICE', 'Increase your ability to earn.', 'Pick training with a clear skill you can use.');
  }
  if (m === 9) {
    charge(s, s.festival, 'Festival budget spent');
    return finish(s, `You spent ${fmt(s.festival)} on the festival plan. ${s.lent ? 'Rohan’s ₹1,000 gig helped before the sale began.' : 'You kept the number you picked.'}`, 'BUDGET SET', 'Plan the spend before it arrives.', 'Set one gift number before browsing.');
  }
  // December.
  // a9: a result paragraph is ≤3 lines at 360, so the approved lines are trimmed with their meaning kept.
  return finish(s, `${s.course ? 'The course lifted November and December pay. ' : 'Your pots tell the year. '}${s.invested ? 'Growing added ₹280, a fictional example.' : s.skippedGrowthPotential ? 'Keeping May’s ₹3,000 in Mine meant ₹280 less (fictional example).' : ''}`,
    'YEAR COMPLETE', 'Keep a part, guard it, and help it grow.', 'Carry one habit into next month.');
}

/** How many phrases of each tag the player has found in a sign month. */
export function signCounts(month: number, found: Record<number, boolean>): Record<Tag, number> {
  const out: Record<Tag, number> = { red: 0, green: 0, grey: 0 };
  phrases(month).forEach((phrase, i) => { if (found[i]) out[phrase.tag] += 1; });
  return out;
}
/** A sign month's message split into plain text and tappable phrases, in order. */
export interface Phrase { text: string; label: string; tag: Tag }
export function messageParts(month: number): (string | Phrase)[] {
  const d = SCENARIOS[month];
  if (!d) return [];
  const out: (string | Phrase)[] = [];
  let last = 0;
  for (const match of d.message.matchAll(/\{([^|]+)\|([^|]+)\|(red|green|grey)\}/g)) {
    if (match.index! > last) out.push(d.message.slice(last, match.index));
    out.push({ text: match[1]!, label: match[2]!, tag: match[3] as Tag });
    last = match.index! + match[0].length;
  }
  if (last < d.message.length) out.push(d.message.slice(last));
  return out;
}
export const phrases = (month: number): Phrase[] => messageParts(month).filter((part): part is Phrase => typeof part !== 'string');
/** Spec 40 §4 (flag off by default): every warning found (and in Jun every good sign). */
export function allSignsFound(month: number, found: Record<number, boolean>): boolean {
  return phrases(month).every((phrase, i) => phrase.tag === 'grey' || (phrase.tag === 'green' && month !== 5) || !!found[i]);
}

export type Path = 'careful' | 'yes' | 'nothing' | 'skip-growth';
/** The year-end comparisons: the whole year replayed on one of four fixed paths (the prototype's simulate). */
export function simulate(path: Path): number {
  const s = fresh();
  s.goal = 0; s.split = path === 'nothing' ? 0 : 3;
  for (let m = 0; m < 12; m++) {
    s.month = m; s.last = [];
    const sp = SPLIT[s.split]!;
    if (m === 0 || m === 10) {
      move(s, 'mine', sp.mine, 'Salary'); depositCushion(s, sp.cushion, 'Salary');
      if (m === 10 && s.course && s.split > 0) move(s, 'mine', 3000, 'Course raise');
      if (m === 10 && s.invested) move(s, 'growing', 40, 'Growth');
    } else {
      move(s, 'mine', sp.mine, 'Salary'); depositCushion(s, sp.cushion, 'Salary');
      if (m === 11 && s.course && s.split > 0) move(s, 'mine', 3000, 'Course raise');
      if (m >= 2) depositCushion(s, freed(s), 'Freed');
      if (m >= 5 && s.invested) move(s, 'growing', 40, 'Growth');
      if (m === 6 && s.lent) move(s, 'mine', 4300, 'Repay');
      if (m === 9 && s.lent) move(s, 'mine', 1000, 'Gig');
      if (m >= 7 && s.phone) charge(s, 6667, 'Phone EMI');
    }
    if (m === 1 && (path === 'careful' || path === 'skip-growth')) { s.subs = [true, true, true, true]; depositCushion(s, 2500, 'Cancelled'); }
    if (m === 2 && path === 'yes') charge(s, 2999, 'Tips');
    if (m === 3 && path === 'yes') charge(s, 1999, 'Fee');
    if (m === 4 && path !== 'nothing' && path !== 'skip-growth') { move(s, 'mine', -3000, 'Growing move'); move(s, 'growing', 3000, 'Growing move'); s.invested = true; }
    if (m === 5 && path !== 'nothing' && s.pots.mine >= 4000) { move(s, 'mine', -4000, 'Loan'); s.lent = true; }
    if (m === 6 && path === 'yes') { s.phone = true; charge(s, 1698, 'Phone fee'); }
    if (m === 7) { if (s.pots.cushion >= 10000) move(s, 'cushion', -10000, 'Repair'); else charge(s, 12000, 'Repair', ['cushion', 'mine']); }
    if (m === 8 && path !== 'nothing') { charge(s, 3000, 'Course'); s.course = true; }
    if (m === 9 && path !== 'nothing') charge(s, path === 'yes' ? 8000 : 2500, 'Festival');
  }
  return net(s);
}

export function bestMove(s: ArkadState): [string, string] {
  const options = [s.course && ['Taking the course', 'It changed November pay.'], s.subs.some(Boolean) && ['Cancelling renewals', 'Small charges stopped repeating.'],
    s.invested && ['Starting Growing', 'A small pot had time to work.'], s.lent && ['Lending with a plan', 'Rohan repaid and offered a gig.'],
    s.pots.cushion >= 10000 && ['Building Cushion', 'The laptop repair had a home.']].filter(Boolean) as [string, string][];
  return options[0] ?? ['Keeping part of pay', 'You gave your first salary a direction.'];
}
export function tryDifferent(s: ArkadState): string {
  if (s.phone) return 'Read the full phone cost before checkout.';
  if (s.debt > 0) return 'Build the cushion toward three months of rent and food.';
  if (!s.invested) return 'Explore what Growing could do, at your own pace.';
  if (!s.course) return 'Look for a course tied to a real work skill.';
  return 'Keep reviewing the split as life changes.';
}

const OLD_LABELS: Readonly<Record<string, string>> = {
  'Salary split to Mine': 'Salary: kept in Mine', 'Salary split to Cushion': 'Salary: added to Cushion', 'Cushion target reached · to Mine': 'Cushion is full, so the rest went to Mine',
  'Fictional example growth': 'Example growth (Growing pot)', 'Course raise · salary': 'Course raise, extra salary', 'Rohan paid gig': "Rohan’s paid gig",
  'Cancelled subscriptions · February': 'Cancelled subscriptions', 'Laptop repair covered': 'Laptop repair, paid from Cushion', 'Rushed laptop repair': 'Laptop repair, paid from Cushion',
  'Rushed laptop repair · unpaid': 'Unpaid repair bill', 'Festival budget': 'Festival budget spent',
};
/** Ledger rows grouped by label and sign (debt shown as a minus), as the prototype's ledgerRows. */
export function ledgerRows(entries: readonly LedgerEntry[], withMonth = false): { month: number; label: string; value: number }[] {
  const rows: { month: number; label: string; value: number }[] = [];
  const byKey = new Map<string, { month: number; label: string; value: number }>();
  for (const entry of entries) {
    const label = OLD_LABELS[entry.label] ?? entry.label, value = entry.pot === 'debt' ? -entry.delta : entry.delta;
    const key = `${withMonth ? `${entry.month}|` : ''}${label}|${Math.sign(value)}`;
    let row = byKey.get(key);
    if (!row) { row = { month: entry.month, label, value: 0 }; byKey.set(key, row); rows.push(row); }
    row.value += value;
  }
  return rows;
}
