import { describe, expect, it } from 'vitest';
import { chooseQuestionMode } from './questionMode';

// Large text (b2, 7 Nov): the page scrolls only when the question can't fit the fitted middle.
describe('chooseQuestionMode', () => {
  it('keeps the fitted layout when the middle shows everything', () => {
    expect(chooseQuestionMode({ fitted: true, middleClient: 520, middleScroll: 520 })).toBe('fit');
  });
  it('treats a 1 px rounding overflow as a fit (the E12 "fits" test)', () => {
    expect(chooseQuestionMode({ fitted: true, middleClient: 520, middleScroll: 521 })).toBe('fit');
  });
  it('turns to page scroll when the middle holds more than it shows', () => {
    expect(chooseQuestionMode({ fitted: true, middleClient: 520, middleScroll: 522 })).toBe('page');
    expect(chooseQuestionMode({ fitted: true, middleClient: 300, middleScroll: 1400 })).toBe('page');
  });
  it('leaves a screen too short for the fitted layout alone (its middle already has its natural height)', () => {
    expect(chooseQuestionMode({ fitted: false, middleClient: 200, middleScroll: 900 })).toBe('fit');
  });
});
