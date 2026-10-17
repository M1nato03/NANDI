import { chromium } from '@playwright/test';

const origin = process.argv[2] ?? 'http://localhost:4175/';
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
const samples = [];
try {
  for (let run = 0; run < 5; run++) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.clock.setFixedTime(new Date('2026-10-17T22:00:00+05:30'));
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    await page.getByRole('region', { name: 'Now deck' }).getByRole('article').first().waitFor({ state: 'visible' });
    const ms = await page.evaluate(() => performance.now());
    samples.push(Math.round(ms));
    await context.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ samples, median: [...samples].sort((a, b) => a - b)[2] }));
