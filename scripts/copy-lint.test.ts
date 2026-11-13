import { expect, it } from 'vitest';
import { findCopyIssues, findLossWords, findStraightApostrophes } from './copy-lint';

it('finds discouraged product phrases without regard to case', () => {
  expect(findCopyIssues('Addiction, FAIL, Lost, You Should, streak broken.')).toEqual([
    { line: 1, phrase: 'Addiction' }, { line: 1, phrase: 'FAIL' }, { line: 1, phrase: 'Lost' },
    { line: 1, phrase: 'You Should' }, { line: 1, phrase: 'streak broken' },
  ]);
  expect(findCopyIssues('failure? Failed.')).toHaveLength(2);
});

it('finds brain-training claims (spec 24, cj5-mind §3.3)', () => {
  expect(findCopyIssues('Brain training that makes you smarter and can boost your IQ.').map(hit => hit.phrase)).toEqual(['Brain training', 'makes you smarter', 'boost your IQ']);
  expect(findCopyIssues('Train your mind for a calm day.')).toEqual([]);
});

it('a9 13 Nov (w10 #7): UI copy uses the curly apostrophe', () => {
  expect(findStraightApostrophes("That's today's.\nKapi’s fine.\nIt's").map(hit => [hit.line, hit.phrase])).toEqual([
    [1, "straight apostrophe: That's"], [1, "straight apostrophe: today's"], [3, "straight apostrophe: It's"],
  ]);
  expect(findStraightApostrophes("That’s all. 'quoted' words")).toEqual([]);
});

it('b2 13 Nov (A2): "streak" and "missed" are loss words in app copy, except the named uses', () => {
  expect(findLossWords('Keep your streak. Missed a day?', 'src/ui/screens/Today.tsx').map(hit => hit.phrase)).toEqual(['loss word: streak', 'loss word: Missed']);
  expect(findLossWords('Missed', 'src\\ui\\learn\\Matka.tsx')).toEqual([]);
  expect(findLossWords('Missed', 'src/ui/screens/Today.tsx')).toHaveLength(1);
  expect(findLossWords('Days off never take anything away.', 'src/ui/courtyard/Courtyard.tsx')).toEqual([]);
});
