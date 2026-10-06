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
