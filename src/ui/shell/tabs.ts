export const tabs = ['Today', 'Tasks', 'Train', 'Mind', 'Ground'] as const;
export type Tab = typeof tabs[number];

export const phaseLine: Record<Tab, string> = {
  Today: 'Your next task and day plan arrive in Phase 1.',
  Tasks: 'Planning and focus sessions arrive in Phase 1.',
  Train: 'Your training ladder arrives in Phase 1.',
  Mind: 'The Daily Drop arrives in Phase 1.',
  Ground: 'Rank, stats and rewards arrive in Phase 1.',
};
