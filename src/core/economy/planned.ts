import type { LedgerRow } from '../../data/types';

/** One definition of a planned task, shared by the Hat-trick, the "Finish a planned task" quest and the "Plans kept" badge. */
export const isPlannedDone = (row: LedgerRow) => row.mode === 'tasks' && row.kind === 'done' && (row.inputs.planned === true
  || row.inputs.wasPlanned === true || row.inputs.hadTimeSlot === true || row.inputs.must === true || row.inputs.isFirstDay === true || row.inputs.scheduledStart != null);
