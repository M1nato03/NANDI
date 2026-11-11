import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

// rem-pass-2 debt 656f (b2): a number and "min" never split across lines at 200% text. Every visible "N min" in the UI
// joins them with a no-break space: `${n}\u00a0min` in a template, `{n}&nbsp;min` in JSX, or minutesLabel(n).
// This guard names every file and line that prints a number, a plain space and "min" (an attribute such as min={...}
// is not text and is not counted).
// b2 11 Nov (stage 3: "about 10 / minutes" split on Train): any number or interpolation and its unit (min, minutes,
// days, nights, hours, seconds, weeks, kg, km, XP), in src/ui and src/core, comments aside.
const PLAIN = /(\}|\b\d+(?:\.\d+)?)[ ](?:min|mins|minutes|days?|hours?|hrs?|seconds?|secs?|weeks?|nights?|kg|km|XP)(?![=\w])(?!\s+[A-Za-z-]+[=/>])/;
const COMMENT = /^\s*(\/\/|\*|\/\*|\{\/\*)/;

it('no number and its unit are joined by a plain space anywhere in the UI', () => {
  const files: string[] = [];
  const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) walk(path); else if (/\.tsx?$/.test(name) && !/\.test\./.test(name)) files.push(path); } };
  walk('src/ui');
  walk('src/core');
  const found = files.flatMap(path => readFileSync(path, 'utf8').split('\n').flatMap((line, index) => PLAIN.test(line) && !COMMENT.test(line) ? [`${path.replaceAll('\\', '/')}:${index + 1}`] : []));
  expect(found).toEqual([]);
});

it('the guard bites: a plain space in a template or in JSX text is caught, an attribute is not', () => {
  expect(PLAIN.test('`${count} min`')).toBe(true);
  expect(PLAIN.test('<p>{task.estimateMin} min</p>')).toBe(true);
  expect(PLAIN.test('`${count}\\u00a0min`')).toBe(false);
  expect(PLAIN.test('<p>{task.estimateMin}&nbsp;min</p>')).toBe(false);
  expect(PLAIN.test('<input aria-label={label} min={0} />')).toBe(false);
  expect(PLAIN.test('<p className="small">A rank check · about 10 minutes</p>')).toBe(true);
  expect(PLAIN.test('`Plan up to ${n} days at a time.`')).toBe(true);
  expect(PLAIN.test('<Haveli cap={1} day={today} />')).toBe(false);
  // A boolean JSX attribute named like a unit is not text (Calm: <TrekScene trek={t} night brighten={s} />).
  expect(PLAIN.test('<TrekScene trek={yatra.trek} night brighten={stars} />')).toBe(false);
  expect(PLAIN.test('{count} training days')).toBe(false);
});
