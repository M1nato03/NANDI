/**
 * Spec 26 B2: full-moon nights, worked out offline (Meeus, Astronomical Algorithms ch. 49, main periodic terms; a few
 * minutes of error). A full-moon night is the local night (04:00 boundary) whose middle, local midnight, is nearest
 * the full moon, so each full moon gives exactly one silver night.
 */
const rad = Math.PI / 180;

/** The full moon instant (ms since epoch) for lunation k (k is a whole number; 0 is near 21 Jan 2000). */
export function fullMoonAt(k: number): number {
  const kk = k + 0.5;
  const T = kk / 1236.85;
  const jde = 2451550.09766 + 29.530588861 * kk + 0.00015437 * T * T - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  const M = (2.5534 + 29.1053567 * kk - 0.0000014 * T * T - 0.00000011 * T ** 3) * rad;
  const Mp = (201.5643 + 385.81693528 * kk + 0.0107582 * T * T + 0.00001238 * T ** 3 - 0.000000058 * T ** 4) * rad;
  const F = (160.7108 + 390.67050284 * kk - 0.0016118 * T * T - 0.00000227 * T ** 3 + 0.000000011 * T ** 4) * rad;
  const O = (124.7746 - 1.56375588 * kk + 0.0020672 * T * T + 0.00000215 * T ** 3) * rad;
  const correction = -0.40614 * Math.sin(Mp) + 0.17302 * E * Math.sin(M) + 0.01614 * Math.sin(2 * Mp) + 0.01043 * Math.sin(2 * F)
    + 0.00734 * E * Math.sin(Mp - M) - 0.00515 * E * Math.sin(Mp + M) + 0.00209 * E * E * Math.sin(2 * M) - 0.00111 * Math.sin(Mp - 2 * F)
    - 0.00057 * Math.sin(Mp + 2 * F) + 0.00056 * E * Math.sin(2 * Mp + M) - 0.00042 * Math.sin(3 * Mp) + 0.00042 * E * Math.sin(M + 2 * F)
    + 0.00038 * E * Math.sin(M - 2 * F) - 0.00024 * E * Math.sin(2 * Mp - M) - 0.00017 * Math.sin(O);
  // Dynamical time is about a minute ahead of UTC in these years; that is well inside the night's 12-hour margin.
  return (jde + correction - 2440587.5) * 86_400_000;
}

/** Local midnight that ends the night of `nightDate` (YYYY-MM-DD): the middle of that night. */
const nightMiddle = (nightDate: string) => {
  const [year, month, day] = nightDate.split('-').map(Number);
  return new Date(year!, month! - 1, day! + 1, 0, 0, 0, 0).getTime();
};

/** Whether this local night is the full-moon night. */
export function isFullMoonNight(nightDate: string): boolean {
  const middle = nightMiddle(nightDate);
  const k = Math.round((middle / 86_400_000 + 2440587.5 - 2451550.09766) / 29.530588861 - 0.5);
  return [k - 1, k, k + 1].some(lunation => Math.abs(fullMoonAt(lunation) - middle) < 12 * 3_600_000);
}
