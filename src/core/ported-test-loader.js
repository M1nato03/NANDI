// Vitest defines a CommonJS 'module' shim, so a direct import trips the legacy
// module.exports line; the browser has no 'module'. The app import path is
// proven in the browser by the Generator check e2e (step 9).
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

export function loadPortedGenerator(url, name) {
  const source = readFileSync(url, 'utf8');
  const suffix = `\nexport default ${name};\n`;
  if (!source.endsWith(suffix)) throw new Error(`Missing ${name} ES module export`);
  const sandbox = { module: { exports: {} } };
  runInNewContext(source.slice(0, -suffix.length), sandbox);
  return sandbox.module.exports;
}
