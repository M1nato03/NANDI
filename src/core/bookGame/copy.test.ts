import { describe, expect, it } from 'vitest';
import { applyAction, CURES, enterMonth, fresh, SCENARIOS, type Action, type ArkadState } from './arkad';

// b2 (12 Nov): "Try next" lines and lessons are generic habits only: never a product, app, bank, brand, fund, a
// return figure, or "you should invest". The words below must not appear in any line the game can show as advice.
const BANNED = /\b(bank|banks|fund|funds|mutual|sip|stocks?|shares?|crypto|returns?|interest rate|guaranteed|you should invest|buy now)\b|\d+(\.\d+)?\s?%/i;

function lessonsAndHabits(): string[] {
  const out = new Set<string>();
  const actions: Action[] = ['split-commit', 'feb-commit', 'yes', 'no', 'invest', 'keep', 'repair', 'course', 'skip', 'festival-commit', 'dec-commit'];
  for (let m = 0; m < 12; m++) for (const action of actions) {
    let s: ArkadState = fresh();
    s.pots = { mine: 20000, cushion: m === 7 ? 0 : 20000, growing: 0 };
    s = enterMonth(s, m);
    const done = applyAction(s, action);
    out.add(done.lastLesson); out.add(done.lastHabit);
  }
  return [...out].filter(Boolean);
}

describe('spec 40 copy: advice stays generic habits', () => {
  it('no lesson or "Try next" line names a product, bank, fund, return figure or says to invest', () => {
    const lines = lessonsAndHabits();
    expect(lines.length).toBeGreaterThan(8);
    for (const line of lines) expect(line, line).not.toMatch(BANNED);
  });
  it('the cure lines and the sign months\' expert answers stay clear of the same words', () => {
    for (const [, line] of CURES) expect(line).not.toMatch(BANNED);
    for (const d of Object.values(SCENARIOS)) for (const [, answer] of d.experts) expect(answer, answer).not.toMatch(/\b(bank|fund|sip|crypto|returns?)\b|you should invest/i);
  });
});
