import { db } from '../data/db';
import { getOrCreateDeviceId } from '../data/device';

export interface ErrorEntry { at: number; source: 'react' | 'window' | 'promise'; message: string; stack?: string }

export function appendError(ring: readonly ErrorEntry[], entry: ErrorEntry): ErrorEntry[] {
  return [...ring, entry].slice(-50);
}

let ring: ErrorEntry[] = [];
const listeners = new Set<() => void>();
let writing = Promise.resolve();

export function getErrorRing(): ErrorEntry[] { return ring; }
export function subscribeErrorRing(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function setRing(value: ErrorEntry[]): void {
  ring = value;
  for (const listener of listeners) listener();
}

export function recordError(source: ErrorEntry['source'], reason: unknown): void {
  const error = reason instanceof Error ? reason : null;
  const entry: ErrorEntry = {
    at: Date.now(), source,
    message: error?.message ?? String(reason),
    ...(error?.stack ? { stack: error.stack } : {}),
  };
  setRing(appendError(ring, entry));
  const snapshot = ring;
  writing = writing.then(async () => {
    const now = Date.now();
    const deviceId = await getOrCreateDeviceId(db, now);
    await db.settings.put({ key: 'errorRing', value: snapshot, updatedAt: now, deleted: 0, deviceId });
  }).catch(() => { /* Keep the in-memory ring available if storage fails. */ });
}

export async function loadErrorRing(): Promise<void> {
  try {
    const saved = (await db.settings.get('errorRing'))?.value;
    if (Array.isArray(saved)) {
      const valid = saved.filter((entry): entry is ErrorEntry =>
        typeof entry === 'object' && entry !== null && typeof entry.message === 'string');
      const fresh = new Set(ring.map(entry => `${entry.at}:${entry.source}:${entry.message}`));
      setRing([...valid.filter(entry => !fresh.has(`${entry.at}:${entry.source}:${entry.message}`)), ...ring].slice(-50));
    }
  } catch { /* The recovery screen still works without storage. */ }
}

export function installErrorListeners(): () => void {
  const onError = (event: ErrorEvent) => recordError('window', event.error ?? event.message);
  const onRejection = (event: PromiseRejectionEvent) => recordError('promise', event.reason);
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
}
