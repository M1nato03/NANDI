import { Capacitor, registerPlugin } from '@capacitor/core';
import { readJournal, type CalmEvent } from '../core/calm/spans';

/**
 * Spec 38: the native Calm player (Android). It takes a sound, a length and a bell plan, so other flows can use it too.
 * On the web there is none, and Calm plays in the page as before ("Keep NANDI open").
 */
export interface CalmPlan { sitId: string; lengthMs: number | null; intervalMin: number; startBell: boolean; soundVolume: number; bellVolume: number; asset?: string; fileBase64?: string; title?: string }
export interface CalmStatus { sitId: string; status: '' | 'playing' | 'paused' | 'ended' | 'stopped'; startedAt: number; lengthMs: number | null; pausedFor: string; journal: CalmEvent[] }
type Plugin = {
  start(options: CalmPlan): Promise<void>;
  status(): Promise<{ sitId: string; status: string; startedAt: number; lengthMs: number; pausedFor: string; journal: unknown }>;
  pause(): Promise<void>; resume(): Promise<void>; stop(): Promise<void>;
  clear(options: { sitId: string }): Promise<void>;
};
const native = registerPlugin<Plugin>('CalmPlayback');

/**
 * End-to-end tests stand in for the phone's player (never set in the app itself): sessionStorage 'nandi.e2eCalm'
 * holds the sit and its journal, and a test can add a dated event (a call, the lock screen's Pause) to it.
 */
const E2E = 'nandi.e2eCalm';
type Fake = { on: true; sit?: Omit<CalmStatus, 'journal'> & { journal: CalmEvent[] } };
function fake(): Fake | null { try { const raw = sessionStorage.getItem(E2E); return raw ? JSON.parse(raw) as Fake : null; } catch { return null; } }
function saveFake(next: Fake) { try { sessionStorage.setItem(E2E, JSON.stringify(next)); } catch { /* storage is optional */ } }
function fakeEvent(type: CalmEvent['type'], status: CalmStatus['status'], reason?: string) {
  const test = fake();
  if (!test?.sit) return;
  test.sit.journal.push({ type, at: Date.now(), ...(reason ? { reason } : {}) });
  test.sit.status = status;
  saveFake(test);
}

export const calmPlaybackAvailable = () => fake() !== null || (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android');

export async function startCalmPlayback(plan: CalmPlan): Promise<void> {
  const test = fake();
  if (test) { saveFake({ on: true, sit: { sitId: plan.sitId, status: 'playing', startedAt: Date.now(), lengthMs: plan.lengthMs, pausedFor: '', journal: [{ type: 'started', at: Date.now() }] } }); return; }
  await native.start(plan);
}

export async function calmPlaybackStatus(): Promise<CalmStatus | null> {
  const test = fake();
  if (test) {
    const sit = test.sit;
    if (!sit) return null;
    // The phone's player ends a timed sit at its length on its own, screen on or off.
    if (sit.status === 'playing' && sit.lengthMs && sit.journal.filter(event => event.type !== 'bell').length === 1 && Date.now() - sit.startedAt >= sit.lengthMs) { fakeEvent('ended', 'ended'); return calmPlaybackStatus(); }
    return sit;
  }
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const result = await native.status();
    if (!result.sitId) return null;
    return { sitId: result.sitId, status: (['playing', 'paused', 'ended', 'stopped'].includes(result.status) ? result.status : '') as CalmStatus['status'], startedAt: result.startedAt, lengthMs: result.lengthMs > 0 ? result.lengthMs : null, pausedFor: result.pausedFor, journal: readJournal(result.journal) };
  } catch { return null; }
}

export async function pauseCalmPlayback(): Promise<void> { if (fake()) return fakeEvent('paused', 'paused', 'user'); await native.pause(); }
export async function resumeCalmPlayback(): Promise<void> { if (fake()) return fakeEvent('resumed', 'playing'); await native.resume(); }
export async function stopCalmPlayback(): Promise<void> { if (fake()) return fakeEvent('stopped', 'stopped'); await native.stop(); }
export async function clearCalmPlayback(sitId: string): Promise<void> {
  const test = fake();
  if (test) { if (test.sit?.sitId === sitId && (test.sit.status === 'ended' || test.sit.status === 'stopped')) saveFake({ on: true }); return; }
  await native.clear({ sitId });
}

/** Your sound, as base64 for the native player to copy to a private file. */
export async function blobBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let text = '';
  for (let index = 0; index < bytes.length; index += 0x8000) text += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(text);
}
