import type { Trail } from '../../core/yatra/trail';
import { trailErrors } from '../../core/yatra/trail';

/**
 * Spec 34: the trails that ship, in walking order (Hampta Pass first). A file that breaks the trail rules is left out
 * rather than half drawn; the pack check in CI fails on it first.
 */
const files = import.meta.glob('../../../content/yatra/*.json', { eager: true, import: 'default' });
// Spec 575 (D3, D4): a fixed order with no picker; trail k+1 starts where trail k's walking ended (core/yatra/journey).
export const ORDER = ['hampta-pass', 'tarsar-marsar', 'sandakphu'];
export const shipped = Object.values(files).filter((value): value is Trail => !!value && typeof value === 'object' && trailErrors(value as Trail).length === 0)
  .sort((a, b) => (ORDER.indexOf(a.id) + 1 || 99) - (ORDER.indexOf(b.id) + 1 || 99));

const E2E_TRAIL = 'nandi.e2eTrail';
/** Spec 575 (must 13): a list of fixture trails, walked in the order given. */
const E2E_TRAILS = 'nandi.e2eTrails';
/** Test builds only: fixture trails a test puts in sessionStorage (the shipped app reads only content/yatra). */
function testTrails(): Trail[] | undefined {
  if (import.meta.env.VITE_E2E !== '1') return undefined;
  try {
    const list = sessionStorage.getItem(E2E_TRAILS);
    if (list) return JSON.parse(list) as Trail[];
    const one = sessionStorage.getItem(E2E_TRAIL);
    return one ? [JSON.parse(one) as Trail] : undefined;
  } catch { return undefined; }
}

/** Spec 575: every trail, in walking order (the one on screen is derived from the walk, see deriveJourney). */
export function journeyTrails(): readonly Trail[] {
  return testTrails() ?? shipped;
}
