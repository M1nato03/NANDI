import { expect, it } from 'vitest';
import { findCopyIssues } from './copy-lint';

it('finds discouraged product phrases without regard to case', () => {
  expect(findCopyIssues('Addiction, FAIL, Lost, You Should, streak broken.')).toEqual([
    { line: 1, phrase: 'Addiction' }, { line: 1, phrase: 'FAIL' }, { line: 1, phrase: 'Lost' },
    { line: 1, phrase: 'You Should' }, { line: 1, phrase: 'streak broken' },
  ]);
  expect(findCopyIssues('failure? Failed.')).toHaveLength(2);
});
