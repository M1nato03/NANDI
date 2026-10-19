import { expect, it } from 'vitest';
import { learningFigures, type AnswerFact } from './analytics';

const now = Date.UTC(2026, 9, 19);
const answer = (conceptId: string, correct: boolean, confidence: AnswerFact['confidence'] = 'certain'): AnswerFact =>
  ({ conceptId, answeredAt: now - 1, correct, confidence, kind: 'practice' });

it('keeps both figures empty until there are enough facts', () => {
  expect(learningFigures({ facts: [] }, now)).toEqual({ recall30: null, sureAccuracy: null });
  expect(learningFigures({ facts: [answer('a', true)] }, now)).toEqual({ recall30: null, sureAccuracy: null });
});

it('shows 30-day recall and sure accuracy from saved answers', () => {
  const sure = Array.from({ length: 20 }, (_, index) => answer(`sure-${index}`, index < 18));
  const retention: AnswerFact[] = [answer('r1', true), answer('r2', false)].map(fact => ({ ...fact, kind: 'retention', retentionDay: 30 }));
  expect(learningFigures({ facts: [...sure, ...retention] }, now)).toEqual({ recall30: 50, sureAccuracy: 86 });
});
