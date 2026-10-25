import { describe, it } from 'vitest';
import { audit } from './audit.test-helper';
import { generateRoute, routeEndpoint, solveRoute } from './route';

describe('route', () => {
  it('checks 300 seeds', () => {
    audit('route', generateRoute, solveRoute, (c, solution) =>
      JSON.stringify(routeEndpoint(solution)) === JSON.stringify((c as ReturnType<typeof generateRoute>).answer),
      (_, solution) => JSON.stringify(routeEndpoint(solution)));
  }, 120_000);
});
