/** The local planning day changes at 04:00. */
export function dayKey(at: Date | number): string {
  const local = new Date(at instanceof Date ? at.getTime() : at);
  if (Number.isNaN(local.getTime())) {
    throw new RangeError('Invalid date');
  }

  if (local.getHours() < 4) {
    local.setDate(local.getDate() - 1);
  }

  const year = String(local.getFullYear()).padStart(4, '0');
  const month = String(local.getMonth() + 1).padStart(2, '0');
  const date = String(local.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

/** A lights-out check-in between 04:00 and noon belongs to the night just gone, not to the new planning day. */
export function lightsOutNightKey(at: number): string {
  const hour = new Date(at).getHours();
  return dayKey(hour >= 4 && hour < 12 ? at - 12 * 3_600_000 : at);
}
