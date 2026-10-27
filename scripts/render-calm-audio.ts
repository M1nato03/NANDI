/**
 * Spec 35: renders a 20-second preview WAV of each Calm sound (and one of the bells) with the app's own sound code, in
 * an OfflineAudioContext inside headless Chromium, so the sounds can be heard before a ship.
 * Usage: npx tsx scripts/render-calm-audio.ts [out dir]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { root } from './pack-files';

const out = resolve(process.argv[2] ?? 'calm-audio');
const RATE = 44_100, SECONDS = 20;

/** 16-bit mono PCM WAV. */
function wav(samples: Int16Array): Buffer {
  const data = Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength), header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVE', 8);
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24); header.writeUInt32LE(RATE * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const bundle = await build({ entryPoints: [resolve(root, 'src/platform/calmSound.ts')], bundle: true, write: false, format: 'iife', globalName: 'calm', target: 'chrome110' });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><title>calm audio</title>');
  await page.addScriptTag({ content: bundle.outputFiles[0]!.text });
  const ids = await page.evaluate(() => (window as unknown as { calm: typeof import('../src/platform/calmSound') }).calm.CALM_SOUNDS.map(sound => sound.id as string));
  await mkdir(out, { recursive: true });
  for (const id of [...ids, 'bells']) {
    const pcm = await page.evaluate(async ({ id, RATE, SECONDS }) => {
      const calm = (window as unknown as { calm: typeof import('../src/platform/calmSound') }).calm;
      const ctx = new OfflineAudioContext(1, RATE * SECONDS, RATE);
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -10; limiter.ratio.value = 12; limiter.attack.value = 0.003; limiter.release.value = 0.25;
      limiter.connect(ctx.destination);
      if (id === 'bells') {
        // Start bell, a scan tick, an interval bell, then the end bell, at the app's default bell volume (70).
        const bells = ctx.createGain(); bells.gain.value = 0.49 * 2; bells.connect(limiter);
        calm.softStrike(ctx, bells, 0.5, 0.2); calm.tick(ctx, bells, 6); calm.softStrike(ctx, bells, 9, 0.12); calm.endBell(ctx, bells, 15);
      } else {
        // The app's default sound volume (60), its 3 s fade-in and 4 s fade-out; tanpura at Sa = C sharp.
        const sound = ctx.createGain(), level = 0.36;
        sound.gain.setValueAtTime(0.0001, 0); sound.gain.linearRampToValueAtTime(level, 3);
        sound.gain.setValueAtTime(level, SECONDS - 4); sound.gain.exponentialRampToValueAtTime(0.0001, SECONDS);
        sound.connect(limiter);
        const voice = calm.startPreset(ctx, sound, id as never, { seed: 35, pitch: 138.59, at: 0.05 });
        voice.fill(SECONDS);
      }
      const data = (await ctx.startRendering()).getChannelData(0);
      const ints = new Int16Array(data.length);
      let peak = 0;
      for (let i = 0; i < data.length; i++) { const v = Math.max(-1, Math.min(1, data[i]!)); peak = Math.max(peak, Math.abs(v)); ints[i] = Math.round(v * 32767); }
      let text = '';
      const bytes = new Uint8Array(ints.buffer);
      for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return { b64: btoa(text), peak };
    }, { id, RATE, SECONDS });
    const bytes = Buffer.from(pcm.b64, 'base64');
    const file = resolve(out, `${id}.wav`);
    await writeFile(file, wav(new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2)));
    console.log(`${id}.wav  peak ${pcm.peak.toFixed(3)}`);
  }
} finally { await browser.close(); }
