import { RULES } from '../rules.config';

export const LESSON_STEPS = ['guess', 'reveal', 'source', 'story', 'transfer', 'why', 'plan', 'done'] as const;
export type Confidence = 'sure' | 'think' | 'guess';
export function confidencePercent(value: Confidence): number { return value === 'sure' ? 90 : value === 'think' ? 65 : 35; }

export function addDays(day: string, count: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}
export function shuffleOptions(length: number, random: () => number = Math.random): number[] {
  const order = Array.from({ length }, (_, index) => index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(random() * (i + 1)));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}
export function isCorrect(order: number[], picked: number | null, answer: number): boolean {
  return picked !== null && order[picked] === answer;
}
export function canStartLesson(done: { course: string; day: string }[], course: string, day: string, review: boolean): boolean {
  return review || done.filter(row => row.course === course && row.day === day).length < RULES.mind.lessonsPerCoursePerDay;
}
export function duePlan(made: string, today: string, fired: string | null | undefined): boolean {
  return !fired && made < today && made >= addDays(today, -3);
}
export function cardAfterAnswer<T extends { box?: number; due: string; reviews?: number; last?: string }>(card: T, correct: boolean, today: string): T {
  const box = correct ? Math.min((card.box ?? 0) + 1, RULES.mind.cardBoxIntervalsDays.length - 1) : 0;
  return { ...card, box, due: addDays(today, RULES.mind.cardBoxIntervalsDays[box]!), last: today, reviews: (card.reviews ?? 0) + 1 };
}
export function itemAfterAnswer<T extends { b?: number; due: string; n?: number; c?: number; last?: string }>(item: T, correct: boolean, today: string, type: string): T {
  const b = type === 'mystery' ? 99 : correct ? Math.min((item.b ?? 0) + 1, RULES.mind.itemIntervalsDays.length - 1) : 0;
  const due = type === 'mystery' ? '9999-12-31' : addDays(today, correct ? RULES.mind.itemIntervalsDays[b]! : type === 'teaser' ? RULES.mind.itemRetryDays.teaser : RULES.mind.itemRetryDays.default);
  return { ...item, b, due, n: (item.n ?? 0) + 1, c: (item.c ?? 0) + Number(correct), last: today };
}
export function nextRating(value: number, answered: number, difficulty: number, score: number): number {
  const expected = 1 / (1 + 10 ** ((difficulty - value) / 400));
  const k = answered < RULES.mind.eloK.earlyAnswers ? RULES.mind.eloK.early : RULES.mind.eloK.later;
  return Math.max(RULES.mind.eloClamp[0], Math.min(RULES.mind.eloClamp[1], Math.round(value + k * (score - expected))));
}
export function mindXp(input: { lessons: number; cards: number; boards: number; mysteries?: number; sideBoards?: number; night: boolean; practice?: boolean }): number {
  if (input.night || input.practice) return 0;
  return Math.min(RULES.mind.dailyCap,
    Math.min(input.lessons, RULES.mind.lessonsPaidPerDay) * RULES.mind.lessonXp +
    Math.min(input.cards, RULES.mind.cardsMaxPerDay) * RULES.mind.cardXp +
    Math.min(input.boards, 1) * RULES.mind.dropBoardXp +
    Math.min(input.mysteries ?? 0, 1) * RULES.mind.mysteryXp +
    Math.min(input.sideBoards ?? 0, RULES.mind.sideBoardsMaxPerDay) * RULES.mind.sideBoardXp);
}
