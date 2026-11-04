import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RECONCILE_KINDS } from '../src/core/reconcileKinds';

// Spec 52: the finish feedback's bulk guard leaves out exactly what reconcile writes on its own.
describe('reconcile kinds', () => {
  it('names exactly the kinds reconcileGamify adds, and not the gold review a person writes', () => {
    const source = readFileSync('src/data/repos/gamify.ts', 'utf8');
    const added = new Set([...source.matchAll(/await add\('([a-z-]+)'/g)].map(match => match[1]));
    expect([...added].sort()).toEqual([...RECONCILE_KINDS].sort());
    expect(RECONCILE_KINDS.has('gold-review')).toBe(false);
    expect(RECONCILE_KINDS.has('gold-attempt')).toBe(false);
  });
});
