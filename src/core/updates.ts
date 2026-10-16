// version.json is tiny; check on open/resume at most every 30 minutes so a fresh release shows up the same evening.
export const CHECK_INTERVAL_MS = 30 * 60 * 1000;
export const SNOOZE_MS = 24 * 60 * 60 * 1000;

export type UpdateVersion = {
  versionCode: number;
  versionName: string;
  sha256: string;
  url: string;
  builtAt: string;
  commit: string;
  notes: string;
};

export function shouldCheckForUpdate(native: boolean, lastCheckedAt: number | null, now: number): boolean {
  return native && (lastCheckedAt === null || now - lastCheckedAt >= CHECK_INTERVAL_MS || now < lastCheckedAt);
}

export function isNewerVersion(remoteCode: number, installedCode: number): boolean {
  return Number.isSafeInteger(remoteCode) && Number.isSafeInteger(installedCode) && remoteCode > installedCode;
}

export function isUpdateSnoozed(remoteCode: number, snoozedCode: number | null, snoozedAt: number | null, now: number): boolean {
  return remoteCode === snoozedCode && snoozedAt !== null && now >= snoozedAt && now - snoozedAt < SNOOZE_MS;
}

export function visibleUpdate(native: boolean, remoteCode: number, installedCode: number,
  snoozedCode: number | null, snoozedAt: number | null, now: number): boolean {
  return native && isNewerVersion(remoteCode, installedCode) && !isUpdateSnoozed(remoteCode, snoozedCode, snoozedAt, now);
}
