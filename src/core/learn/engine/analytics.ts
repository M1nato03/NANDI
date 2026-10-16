import type { Confidence } from './model';

export type RetentionDay = 7 | 30;
export interface AnswerFact {
  conceptId: string;
  answeredAt: number;
  correct: boolean;
  confidence: Confidence;
  kind: 'practice' | 'retention';
  retentionDay?: RetentionDay;
}
export interface EngineFactsState { facts: readonly AnswerFact[] }

export function retentionSummary(state: EngineFactsState, now: number) {
  const result = { checked7: 0, recalled7: 0, checked30: 0, recalled30: 0 };
  const seen = new Set<string>();
  for (const fact of state.facts) {
    if (fact.kind !== 'retention' || fact.answeredAt > now || !fact.retentionDay) continue;
    const key = `${fact.conceptId}:${fact.retentionDay}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (fact.retentionDay === 7) {
      result.checked7++;
      if (fact.correct) result.recalled7++;
    } else {
      result.checked30++;
      if (fact.correct) result.recalled30++;
    }
  }
  return result;
}

export function calibration(state: EngineFactsState) {
  let confidentAnswers = 0;
  let confidentCorrect = 0;
  let unsureAnswers = 0;
  let unsureCorrect = 0;
  for (const fact of state.facts) {
    if (fact.confidence === 'certain') {
      confidentAnswers++;
      if (fact.correct) confidentCorrect++;
    } else if (fact.confidence === 'guess') {
      unsureAnswers++;
      if (fact.correct) unsureCorrect++;
    }
  }
  return {
    confidentAnswers,
    confidentCorrectRate: confidentAnswers ? confidentCorrect / confidentAnswers : 0,
    unsureCorrectRate: unsureAnswers ? unsureCorrect / unsureAnswers : 0,
  };
}
