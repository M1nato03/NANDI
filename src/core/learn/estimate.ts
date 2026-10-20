/**
 * Drag-to-guess for estimate questions (audit 10-21). The scale is wide enough that the answer is never
 * obvious, and the answer sits at a different place on it for each question so the middle gives nothing away.
 */
export interface EstimateAnswer { value: number; min: number; max: number; unit: string }
export interface EstimateItem { id: string; answer: EstimateAnswer; options: { id: string; feedback: string; correct: boolean }[] }
export interface SliderScale { lo: number; hi: number; step: number; start: number }

const decimals = (n: number) => { const text = String(n); return text.includes('.') ? text.split('.')[1]!.length : 0; };
const hash = (text: string) => [...text].reduce((sum, char) => (Math.imul(sum, 31) + char.charCodeAt(0)) >>> 0, 7);
const roundTo = (n: number, step: number) => Number((Math.round(n / step) * step).toFixed(Math.max(0, decimals(step))));

export function sliderScale(item: EstimateItem): SliderScale {
  const { value, min, max, unit } = item.answer;
  const half = Math.max(value - min, max - value, 1e-6);
  const step = Math.max(10 ** -decimals(value), 10 ** Math.floor(Math.log10(half / 2)));
  const width = Math.max(20 * half, 0.6 * Math.abs(value), 10 * step);
  // The answer lands somewhere between 20% and 80% along the scale, fixed per question.
  const at = 0.2 + (hash(item.id) % 61) / 100;
  let lo = value - at * width;
  // Counts, sizes and shares cannot go below zero; temperatures can.
  const floor = value >= 0 && !/degrees/.test(unit) ? 0 : -Infinity;
  if (lo < floor) lo = floor;
  let hi = lo + width;
  if (/percent/.test(unit) && hi > 100) { hi = 100; lo = Math.max(0, Math.min(lo, hi - width)); }
  lo = roundTo(Math.floor(lo / step) * step, step);
  hi = roundTo(Math.ceil(hi / step) * step, step);
  // Start in the middle, unless the middle is already right: then start a quarter of the way along.
  const inBand = (n: number) => n >= min && n <= max;
  const start = [0.5, 0.25, 0.75].map(at => roundTo(lo + at * (hi - lo), step)).find(n => !inBand(n)) ?? lo;
  return { lo, hi, step, start };
}

export function formatEstimate(n: number, unit: string): string {
  const number = Math.abs(n) >= 10_000 || (Math.abs(n) >= 1000 && !/year/.test(unit)) ? n.toLocaleString('en-IN') : String(n);
  if (/^percent$/.test(unit)) return `${number}%`;
  if (/^rupees$/.test(unit)) return n < 0 ? `−₹${String(-n)}` : `₹${number}`;
  if (/^year CE$/.test(unit)) return `${number} CE`;
  return `${number} ${unit}`;
}

/** The explanation uses the right option's words; a miss also says where the answer was. */
export function estimateFeedback(item: EstimateItem, guess: number, correct: boolean): { optionId?: string; text: string } {
  const right = item.options.find(option => option.correct);
  const reason = right?.feedback ?? '';
  if (correct) return { optionId: right?.id, text: reason || 'That fits.' };
  return { optionId: undefined, text: `You said ${formatEstimate(guess, item.answer.unit)}. The answer is about ${formatEstimate(item.answer.value, item.answer.unit)}. ${reason}`.trim() };
}
