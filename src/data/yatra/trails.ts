import type { Trail } from '../../core/yatra/trail';
import { trailErrors } from '../../core/yatra/trail';

/**
 * Spec 34: the trails that ship, in walking order (Hampta Pass first). A file that breaks the trail rules is left out
 * rather than half drawn; the pack check in CI fails on it first.
 */
const files = import.meta.glob('../../../content/yatra/*.json', { eager: true, import: 'default' });
const ORDER = ['hampta-pass', 'kumano-kodo', 'camino-last-100', 'milford-track'];
const shipped = Object.values(files).filter((value): value is Trail => !!value && typeof value === 'object' && trailErrors(value as Trail).length === 0)
  .sort((a, b) => (ORDER.indexOf(a.id) + 1 || 99) - (ORDER.indexOf(b.id) + 1 || 99));

const E2E_TRAIL = 'nandi.e2eTrail';
/** Test builds only: a fixture trail a test puts in sessionStorage (the shipped app reads only content/yatra). */
function testTrail(): Trail | undefined {
  if (import.meta.env.VITE_E2E !== '1') return undefined;
  try { const value = sessionStorage.getItem(E2E_TRAIL); return value ? JSON.parse(value) as Trail : undefined; } catch { return undefined; }
}

/** The trail being walked: the first one (later trails open in Phase 3). */
export function currentTrail(): Trail | undefined {
  return testTrail() ?? shipped[0];
}
