import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const fixtures = [
  ['busy-week', { tasks: 6, focusHours: 4.2, longestFocusMinutes: 50, workouts: 3, sideQuests: 2, concepts: 9, nights: 4 }],
  ['light-week', { tasks: 1, focusHours: 0, longestFocusMinutes: 0, workouts: 1, sideQuests: 0, concepts: 0, nights: 0 }],
  ['only-learning', { tasks: 0, focusHours: 0, longestFocusMinutes: 0, workouts: 0, sideQuests: 0, concepts: 1, nights: 0 }],
] as const;

const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  await server.listen();
  const address = server.httpServer!.address();
  if (!address || typeof address === 'string') throw new Error('Fixture server address unavailable');
  browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${address.port}/#you`);
  await page.evaluate(() => document.fonts.ready);
  await mkdir('tests/fixtures/recap-share', { recursive: true });
  for (const [name, values] of fixtures) {
    const base64 = await page.evaluate(async data => {
      const corePath = '/src/core/recap.ts';
      const cardPath = '/src/ui/screens/recapCard.ts';
      const { recapCardContent } = await import(/* @vite-ignore */ corePath);
      const { renderRecapCard } = await import(/* @vite-ignore */ cardPath);
      const canvas = document.createElement('canvas');
      renderRecapCard(canvas, recapCardContent({ from: '2026-10-12', to: '2026-10-19', ...data }));
      return canvas.toDataURL('image/png').split(',')[1]!;
    }, values);
    await writeFile(`tests/fixtures/recap-share/${name}.png`, Buffer.from(base64, 'base64'));
    console.log(`tests/fixtures/recap-share/${name}.png`);
  }
} finally {
  await browser?.close();
  await server.close();
}
