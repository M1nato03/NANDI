/**
 * K3 (Sat): Calm's tapped choices count at once while their save catches up. A pending choice goes as soon as the saved
 * value matches it, so a later change from elsewhere (a restore, another view) is never masked by an old tap.
 */
export function settlePending<T extends object>(pending: Partial<T>, stored: T): Partial<T> {
  const keep = Object.entries(pending).filter(([key, value]) => stored[key as keyof T] !== value);
  return keep.length === Object.keys(pending).length ? pending : Object.fromEntries(keep) as Partial<T>;
}
