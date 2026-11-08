import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

// rem-pass-2 debt 656f (b2): a number and "min" never split across lines at 200% text. Every visible "N min" in the UI
// joins them with a no-break space: `${n}\u00a0min` in a template, `{n}&nbsp;min` in JSX, or minutesLabel(n).
// This guard names every file and line that prints a number, a plain space and "min" (an attribute such as min={...}
// is not text and is not counted).
const PLAIN = /\}[ ]min\b(?!=)/;

it('no number and "min" are joined by a plain space anywhere in the UI', () => {
  const files: string[] = [];
  const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) walk(path); else if (/\.tsx?$/.test(name) && !/\.test\./.test(name)) files.push(path); } };
  walk('src/ui');
  const found = files.flatMap(path => readFileSync(path, 'utf8').split('\n').flatMap((line, index) => PLAIN.test(line) ? [`${path.replaceAll('\\', '/')}:${index + 1}`] : []));
  expect(found).toEqual([]);
});

it('the guard bites: a plain space in a template or in JSX text is caught, an attribute is not', () => {
  expect(PLAIN.test('`${count} min`')).toBe(true);
  expect(PLAIN.test('<p>{task.estimateMin} min</p>')).toBe(true);
  expect(PLAIN.test('`${count}\\u00a0min`')).toBe(false);
  expect(PLAIN.test('<p>{task.estimateMin}&nbsp;min</p>')).toBe(false);
  expect(PLAIN.test('<input aria-label={label} min={0} />')).toBe(false);
  expect(PLAIN.test('{count} minutes')).toBe(false);
});
