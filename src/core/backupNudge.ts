export const backupWeekOf = (day: string) => { const date = new Date(`${day}T12:00:00Z`); date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7); return date.toISOString().slice(0, 10); };

/** Once a week, after the first week of use: send a copy of the backup somewhere safe (audit 10-21). */
export function shouldNudgeBackup(today: string, firstDay: string | undefined, lastBackupAt: number | undefined, dismissedWeek: string | undefined, now: number): boolean {
  if (!firstDay || Date.parse(`${today}T12:00:00Z`) - Date.parse(`${firstDay}T12:00:00Z`) < 7 * 86_400_000) return false;
  if (dismissedWeek === backupWeekOf(today)) return false;
  return lastBackupAt === undefined || now - lastBackupAt >= 7 * 86_400_000;
}

