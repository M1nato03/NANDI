import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { AUTO_BACKUP_FOLDER, autoBackupFilesToPrune } from '../core/autoBackup';

export interface ShareOptions { title?: string; dialogTitle?: string; /** A closed native sheet means nothing was sent (the file stays in Documents). */ cancelledIfClosed?: boolean }
/** Shares a backup from a user gesture, downloading it when file sharing is unavailable. */
export async function shareOrDownload(file: File, text?: string, options: ShareOptions = {}): Promise<'shared' | 'downloaded' | 'cancelled'> {
  if (Capacitor.isNativePlatform()) {
    const image = file.type === 'image/png';
    const data = image ? await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    }) : await file.text();
    const saved = await Filesystem.writeFile({ path: file.name, data, directory: Directory.Documents, ...(!image ? { encoding: Encoding.UTF8 } : {}) });
    try {
      await Share.share({ title: options.title ?? (image ? text ? 'NANDI Mind' : 'What my week became' : 'NANDI backup'), ...(text ? { text } : {}), files: [saved.uri], dialogTitle: options.dialogTitle ?? (image ? text ? 'Share my solve' : 'Share my week' : 'Save a copy of your NANDI backup') });
      return 'shared';
    } catch (error) {
      if (error !== null && typeof error === 'object' && 'message' in error && String(error.message).toLowerCase().includes('cancel')) return options.cancelledIfClosed ? 'cancelled' : 'downloaded';
      throw error;
    }
  }
  if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function'
    && navigator.canShare({ files: [file] }) && typeof navigator.share === 'function') {
    try {
      await navigator.share({ files: [file], text });
      return 'shared';
    } catch (error) {
      if (error !== null && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return 'cancelled';
      // Some browsers accept the file in canShare but reject the share request.
    }
  }
  if (text && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); } catch { /* The downloaded tile still carries the same details. */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.style.display = 'none';
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  return 'downloaded';
}

/** Saves a backup before an Android update without opening a share sheet. */
export async function saveBackupToDocuments(file: File): Promise<string> {
  if (!Capacitor.isNativePlatform()) throw new Error('Device storage is unavailable.');
  await Filesystem.writeFile({ path: file.name, data: await file.text(), directory: Directory.Documents, encoding: Encoding.UTF8 });
  return `Documents/${file.name}`;
}

/** Stores daily backups in their own Documents folder, isolated from manual and update copies. */
export async function saveAutoBackup(file: File): Promise<number> {
  if (!Capacitor.isNativePlatform()) throw new Error('Device storage is unavailable.');
  try {
    await Filesystem.mkdir({ path: AUTO_BACKUP_FOLDER, directory: Directory.Documents, recursive: true });
  } catch (error) {
    // Capacitor rejects mkdir when the folder already exists, even with recursive: true.
    if (!isFilesystemError(error, 'OS-PLUG-FILE-0010', /already exists/i)) throw error;
  }
  await Filesystem.writeFile({ path: `${AUTO_BACKUP_FOLDER}/${file.name}`, data: await file.text(), directory: Directory.Documents, encoding: Encoding.UTF8 });
  const entries = await Filesystem.readdir({ path: AUTO_BACKUP_FOLDER, directory: Directory.Documents });
  const names = entries.files.filter(entry => entry.type === 'file').map(entry => entry.name);
  const prune = autoBackupFilesToPrune(names);
  for (const name of prune) {
    await Filesystem.deleteFile({ path: `${AUTO_BACKUP_FOLDER}/${name}`, directory: Directory.Documents });
  }
  return names.filter(name => /^nandi-auto-\d{4}-\d{2}-\d{2}\.json$/.test(name)).length - prune.length;
}

export async function listAutoBackups(): Promise<string[]> {
  if (!Capacitor.isNativePlatform()) return [];
  try {
    const entries = await Filesystem.readdir({ path: AUTO_BACKUP_FOLDER, directory: Directory.Documents });
    return entries.files.filter(entry => entry.type === 'file' && /^nandi-auto-\d{4}-\d{2}-\d{2}\.json$/.test(entry.name)).map(entry => entry.name);
  } catch (error) {
    // A fresh install has no auto folder yet. Other filesystem errors must be visible.
    if (isFilesystemError(error, 'OS-PLUG-FILE-0008', /not exist|does not exist|not found/i)) return [];
    throw error;
  }
}

function isFilesystemError(error: unknown, code: string, message: RegExp): boolean {
  return typeof error === 'object' && error !== null
    && (('code' in error && error.code === code)
      || ('message' in error && typeof error.message === 'string' && message.test(error.message)));
}

/** Returns null when the user closes the picker without selecting a file. */
export function pickFile(): Promise<File | null> {
  // The Android WebView file chooser uses Android's system document picker.
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    document.body.append(input);
    let settled = false;
    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(file);
    };
    input.addEventListener('change', () => finish(input.files?.[0] ?? null), { once: true });
    input.addEventListener('cancel', () => finish(null), { once: true });
    input.click();
  });
}

/** Shares a short message that carries its own link (WhatsApp and friends); falls back to copying it. */
export async function shareLink(text: string): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  try {
    if (Capacitor.isNativePlatform()) { await Share.share({ title: 'NANDI challenge', text, dialogTitle: 'Challenge a friend' }); return 'shared'; }
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') { await navigator.share({ title: 'NANDI challenge', text }); return 'shared'; }
  } catch (error) {
    if (error !== null && typeof error === 'object' && (('name' in error && error.name === 'AbortError') || ('message' in error && String(error.message).toLowerCase().includes('cancel')))) return 'cancelled';
  }
  try { await navigator.clipboard.writeText(text); return 'copied'; } catch { return 'failed'; }
}
