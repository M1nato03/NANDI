import { trackWrite } from '../core/pendingWrites';
import { db } from '../data/db';
import { getOrCreateDeviceId } from '../data/device';
import { Capacitor } from '@capacitor/core';

export interface ServiceWorkerState {
  needRefresh: boolean;
  offlineReady: boolean;
}

let state: ServiceWorkerState = { needRefresh: false, offlineReady: false };
let started = false;
let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;
const listeners = new Set<() => void>();

function setState(next: Partial<ServiceWorkerState>) {
  state = { ...state, ...next };
  listeners.forEach(listener => listener());
}

export function getServiceWorkerState(): ServiceWorkerState { return state; }

export function subscribeToServiceWorker(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function dismissOfflineReady(): void { setState({ offlineReady: false }); }

async function markOfflineReady(): Promise<void> {
  const key = 'offlineReadyShown';
  if ((await db.settings.get(key))?.value === true) return;
  await trackWrite(async () => {
    const now = Date.now();
    const deviceId = await getOrCreateDeviceId(db, now);
    await db.settings.put({ key, value: true, updatedAt: now, deleted: 0, deviceId });
  });
  setState({ offlineReady: true });
}

export function registerServiceWorker(): void {
  if (Capacitor.isNativePlatform() || started || !(import.meta.env.PROD || import.meta.env.VITE_E2E === '1')) return;
  started = true;
  void import('virtual:pwa-register').then(({ registerSW }) => {
    updateSW = registerSW({
      immediate: true,
      onNeedRefresh: () => setState({ needRefresh: true }),
      onOfflineReady: () => { void markOfflineReady().catch(error => console.error('Could not save offline-ready state', error)); },
    });
  });
}

export async function applyServiceWorkerUpdate(): Promise<void> {
  await updateSW?.(true);
}
