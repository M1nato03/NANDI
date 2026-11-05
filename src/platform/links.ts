import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Spec 55: a crew link that opened the app (App Links) waits on the native side until the app takes it, as a plain
 * string. The app then routes it like any other hash, through the one crew link validator.
 */
const native = registerPlugin<{ take(): Promise<{ route?: string }> }>('Link');

export async function takeLaunchLink(): Promise<string> {
  if (!Capacitor.isNativePlatform()) return '';
  try { return (await native.take()).route ?? ''; } catch { return ''; }
}

/** The web app's own address, for the "Open in the NANDI app" hint (true only in a browser, never in the app). */
export const inBrowser = () => !Capacitor.isNativePlatform();
