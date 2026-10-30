/**
 * Bug hunt 30 Oct (jenil-87): one rule for whether a finished session counts, used by the week's beats, Consistency,
 * History and "Last session", the trek, the night deck and the week in words. It needs at least one working set:
 * 0 sets is no effort (spec 36). A safety stop with a set logged still counts. A row from before the set count was
 * stored falls back to whether the session paid. Works on a session row or a session fact's inputs.
 */
export function sessionCounts(row: { status?: unknown; workingSets?: unknown; xp?: unknown }): boolean {
  if (row.status === 'active' || row.status === 'skipped') return false;
  return typeof row.workingSets === 'number' ? row.workingSets > 0 : Number(row.xp ?? 0) > 0;
}
