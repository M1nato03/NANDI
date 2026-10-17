import { dayKey } from './time/dayKey';

export const AUTO_BACKUP_FOLDER = 'NANDI/auto';
export const AUTO_BACKUP_KEEP = 7;

export function autoBackupFileName(key: string): string {
  return `nandi-auto-${key}.json`;
}

export function autoBackupDue(now: number, lastSavedDay: string | null, enabled: boolean, pending: number): boolean {
  return enabled && pending === 0 && new Date(now).getHours() >= 4 && lastSavedDay !== dayKey(now);
}

/** Only exact automatic-backup names are eligible for deletion. */
export function autoBackupFilesToPrune(names: readonly string[], keep = AUTO_BACKUP_KEEP): string[] {
  const auto = names.filter(name => /^nandi-auto-\d{4}-\d{2}-\d{2}\.json$/.test(name)).sort().reverse();
  return auto.slice(keep);
}

export function nextFailureStreak(previousDay: string | null, previousStreak: number, today: string): number {
  if (previousDay === today) return Math.max(1, previousStreak);
  const yesterday = new Date(`${today}T12:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  return previousDay === dayKey(yesterday) ? previousStreak + 1 : 1;
}
