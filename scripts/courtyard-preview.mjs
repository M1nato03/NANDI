// Screenshots of the courtyard for design review: node scripts/courtyard-preview.mjs <url> <outDir>
// Seeds practice days so each corner reaches a chosen stage, then shoots the scene at four times of day.
import { chromium } from 'playwright';

const [url = 'http://localhost:5199', out = 'courtyard-shots'] = process.argv.slice(2);
const need = [0, 3, 7, 14, 30, 60];
const areas = { train: ['train', 'session', {}], plan: ['tasks', 'done', {}], learn: ['mind', 'learn-drop', {}], remember: ['mind', 'learn-retention', {}], mind: ['mind', 'board', {}], sleep: ['bonuses', 'lightsout', { metTarget: true }] };
const day = (offset) => new Date(Date.UTC(2026, 9, 20) - offset * 86_400_000).toISOString().slice(0, 10);
function facts(stages, doneToday) {
  const rows = [];
  for (const [area, stage] of Object.entries(stages)) {
    const [mode, kind, inputs] = areas[area];
    for (let i = 0; i < need[stage]; i++) {
      const dayKey = day(doneToday.includes(area) ? i : i + 1);
      rows.push({ id: `${kind}:preview-${area}-${i}`, dayKey, mode, kind, refId: `preview-${area}-${i}`, inputs, updatedAt: Date.parse(`${dayKey}T12:00:00Z`), deleted: 0, deviceId: 'preview' });
    }
  }
  return rows;
}
const scenarios = [
  { name: 'new', time: '2026-10-20T08:00:00', stages: { train: 0, plan: 0, learn: 0, remember: 0, mind: 0, sleep: 0 }, today: [] },
  { name: 'week2-day', time: '2026-10-20T13:00:00', stages: { train: 2, plan: 3, learn: 1, remember: 1, mind: 2, sleep: 1 }, today: ['train', 'plan'] },
  { name: 'month-evening', time: '2026-10-20T23:40:00', stages: { train: 4, plan: 3, learn: 4, remember: 3, mind: 3, sleep: 4 }, today: ['learn', 'sleep', 'train'] },
  { name: 'full-night', time: '2026-10-21T02:30:00', stages: { train: 5, plan: 5, learn: 5, remember: 5, mind: 5, sleep: 5 }, today: [] },
  { name: 'full-day', time: '2026-10-20T12:00:00', stages: { train: 5, plan: 5, learn: 5, remember: 5, mind: 5, sleep: 5 }, today: ['train', 'plan', 'learn', 'remember', 'mind', 'sleep'] },
];
const browser = await chromium.launch();
for (const scheme of ['light', 'dark']) for (const s of scenarios) {
  if (scheme === 'dark' && !['week2-day', 'full-night'].includes(s.name)) continue;
  const page = await browser.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3, colorScheme: scheme, reducedMotion: 'reduce' });
  await page.clock.setFixedTime(new Date(s.time));
  await page.goto(`${url}/#you/courtyard`);
  await page.evaluate(async rows => {
    const database = await new Promise((resolve, reject) => { const r = indexedDB.open('nandi'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    await new Promise((resolve, reject) => { const t = database.transaction('ledger', 'readwrite'); for (const row of rows) t.objectStore('ledger').put(row); t.oncomplete = resolve; t.onerror = () => reject(t.error); });
    database.close();
  }, facts(s.stages, s.today));
  await page.reload();
  const heading = page.getByRole('heading', { name: 'Courtyard', exact: true });
  const leave = page.getByRole('button', { name: 'Leave night deck' });
  await heading.or(leave).first().waitFor();
  await page.waitForTimeout(1500);
  if (await leave.isVisible()) { await leave.click(); await page.evaluate(() => { location.hash = '#you/courtyard'; }); }
  await heading.waitFor({ timeout: 8000 }).catch(async error => { await page.screenshot({ path: `${out}/debug-${s.name}.png` }); throw error; });
  await page.locator('.courtyard').first().waitFor({ timeout: 8000 }).catch(async error => { await page.screenshot({ path: `${out}/debug2-${s.name}.png` }); console.log(await page.content().then(html => html.slice(0, 3000))); throw error; });
  await page.locator('.courtyard').first().screenshot({ path: `${out}/${scheme}-${s.name}.png` });
  if (s.name === 'week2-day' || s.name === 'month-evening') await page.screenshot({ path: `${out}/${scheme}-${s.name}-screen.png`, fullPage: true });
  if (s.name === 'month-evening' && scheme === 'light') {
    await page.evaluate(() => { location.hash = '#plan'; });
    await page.locator('.courtyard-banner').waitFor();
    await page.screenshot({ path: `${out}/${scheme}-plan.png` });
    await page.evaluate(() => { location.hash = '#you/story/20261012'; });
    await page.getByRole('heading', { name: 'Your week as a story' }).waitFor();
    for (let i = 0; i < 3; i++) { await page.screenshot({ path: `${out}/${scheme}-story-${i}.png` }); await page.getByRole('button', { name: 'Turn the page' }).click(); }
  }
  await page.close();
}
await browser.close();
