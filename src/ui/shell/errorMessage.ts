// Postpone gate codes reach the screen through task actions; say them in plain words (Tasks audit 1).
const plain: Record<string, string> = {
  missing_date_time: 'Pick a date and time.',
  missing_first_step: 'Add a first step of 10 minutes or less.',
  first_step_too_long: 'Keep the first step short.',
  choice_sheet_required: 'This one has moved twice. Pick a choice in the move sheet.',
  reason_required: "This week's moves are used up. Pick a quick reason first.",
  real_reason_limit: 'Real-reason moves are used up for this week.',
  cant_undo: "Can't undo now.",
};
export function errorMessage(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return plain[text] ?? text;
}
