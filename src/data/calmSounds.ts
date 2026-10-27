import Dexie, { type Table } from 'dexie';

/**
 * Spec 35 "Your sound": audio files the user adds for Calm. They live in their own small database, apart from the
 * app's data, so a backup, export or restore never touches them (they are large, and they stay on this phone).
 */
export type CalmSoundRow = { id: string; name: string; type: string; size: number; blob: Blob; addedAt: number };

export const MAX_USER_SOUNDS = 3;
export const MAX_SOUND_BYTES = 50 * 1024 * 1024;

class CalmSoundDb extends Dexie {
  sounds!: Table<CalmSoundRow, string>;
  constructor(name = 'nandi-calm-sounds') {
    super(name);
    this.version(1).stores({ sounds: 'id, addedAt' });
  }
}

export const calmSoundDb = new CalmSoundDb();

export type AddSoundResult = { ok: true; row: CalmSoundRow } | { ok: false; reason: string };

/** The name shown in the sound row: the file name without its extension, kept short. */
export const soundName = (fileName: string) => (fileName.replace(/\.[a-z0-9]{1,5}$/i, '').trim() || 'My sound').slice(0, 24);

/** Checks the limits, then that this WebView can play the file, before storing it. */
export async function addUserSound(file: File, now: number, canPlay: (blob: Blob) => Promise<boolean> = playable): Promise<AddSoundResult> {
  if (file.size > MAX_SOUND_BYTES) return { ok: false, reason: 'This file is over 50 MB.' };
  if (await calmSoundDb.sounds.count() >= MAX_USER_SOUNDS) return { ok: false, reason: 'You can keep 3 sounds. Remove one to add another.' };
  if (!await canPlay(file)) return { ok: false, reason: "NANDI can't play this file." };
  const row: CalmSoundRow = { id: `s${now.toString(36)}`, name: soundName(file.name), type: file.type, size: file.size, blob: file, addedAt: now };
  await calmSoundDb.sounds.put(row);
  return { ok: true, row };
}

export const renameUserSound = (id: string, name: string) => calmSoundDb.sounds.update(id, { name: name.trim().slice(0, 24) || 'My sound' });
export const removeUserSound = (id: string) => calmSoundDb.sounds.delete(id);

/** Reads the file's header only (never decodes the whole file into memory). */
function playable(blob: Blob): Promise<boolean> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    const done = (ok: boolean) => { window.clearTimeout(timer); audio.removeAttribute('src'); audio.load(); URL.revokeObjectURL(url); resolve(ok); };
    const timer = window.setTimeout(() => done(false), 10_000);
    audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', () => done(true), { once: true });
    audio.addEventListener('error', () => done(false), { once: true });
    audio.src = url;
  });
}
