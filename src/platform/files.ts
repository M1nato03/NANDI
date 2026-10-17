import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/** Shares a backup from a user gesture, downloading it when file sharing is unavailable. */
export async function shareOrDownload(file: File): Promise<'shared' | 'downloaded' | 'cancelled'> {
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
      await Share.share({ title: image ? 'What my week became' : 'NANDI backup', files: [saved.uri], dialogTitle: image ? 'Share my week' : 'Save a copy of your NANDI backup' });
      return 'shared';
    } catch (error) {
      if (error !== null && typeof error === 'object' && 'message' in error && String(error.message).toLowerCase().includes('cancel')) return 'downloaded';
      throw error;
    }
  }
  if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function'
    && navigator.canShare({ files: [file] }) && typeof navigator.share === 'function') {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (error) {
      if (error !== null && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return 'cancelled';
      // Some browsers accept the file in canShare but reject the share request.
    }
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
