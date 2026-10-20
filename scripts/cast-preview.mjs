// Screenshots of the cast for design review: node scripts/cast-preview.mjs <url> <outDir>
// Opens Meet the cast at phone width in light and dark, with the opening animation skipped.
import { chromium } from 'playwright';

const [url = 'http://localhost:5199', out = 'cast-shots'] = process.argv.slice(2);
const browser = await chromium.launch();
for (const scheme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, colorScheme: scheme, reducedMotion: 'reduce' });
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.goto(`${url}/#you/cast`);
  await page.getByRole('heading', { name: 'Meet the cast' }).waitFor();
  await page.screenshot({ path: `${out}/cast-${scheme}.png`, fullPage: true });
  // Close-up: every pose drawn at 150 px, one image per character.
  await page.addStyleTag({ content: '.cast-gallery-poses{display:grid!important;grid-template-columns:repeat(2,1fr)!important;gap:8px}.cast-gallery-pose svg{width:150px!important;height:150px!important}.tabbar,.app-header{display:none!important}' });
  for (const row of await page.locator('.cast-gallery-row').all()) await row.screenshot({ path: `${out}/big-${scheme}-${(await row.getAttribute('aria-label'))?.toLowerCase()}.png` });
  await page.close();
}
await browser.close();
