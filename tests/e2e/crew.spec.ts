import { expect, test, type Browser, type Page, type TestInfo } from '@playwright/test';

// Spec 55: two browser contexts are two phones. Links travel as the text a person would paste into a chat; here each
// phone's "share" lands in its own outbox (no share sheet on the web build, so the app copies it), and the other phone
// pastes it into Yatra → your crew → "Paste a crew link", as an app user does before App Links are live.
const MADE = new Date('2026-11-01T10:00:00');
const LATER = new Date('2026-11-05T12:00:00');

async function phone(browser: Browser, at: Date, info: TestInfo): Promise<Page> {
  // A second context does not inherit the project's options, so the same ones are passed on.
  const use = info.project.use;
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, baseURL: use.baseURL, storageState: use.storageState });
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    const outbox: string[] = [];
    (window as Window & { outbox?: string[] }).outbox = outbox;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { outbox.push(text); } } });
  });
  await page.clock.setFixedTime(at);
  await page.goto('/?e2e#yatra/crew');
  return page;
}
const outbox = (page: Page) => page.evaluate(() => (window as Window & { outbox?: string[] }).outbox ?? []);
/** The newest message this phone "sent" (the share is async, so it waits for it to land). */
async function lastSent(page: Page): Promise<string> {
  await expect.poll(async () => (await outbox(page)).length).toBeGreaterThan(0);
  return (await outbox(page)).at(-1)!;
}
const linkIn = (text: string) => text.match(/https:\/\/\S+#crew\/\S+/)![0];
async function paste(page: Page, text: string) {
  await page.goto('/?e2e#yatra/crew');
  await page.getByRole('button', { name: 'Paste a crew link' }).click();
  await page.getByLabel('Crew link').fill(text);
  await page.getByRole('button', { name: 'Use this link' }).click();
}
async function seedSessions(page: Page, days: string[], perDay: number) {
  await page.evaluate(async ([list, count]) => {
    const database = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('nandi'); request.onsuccess = () => resolve(request.result); });
    await new Promise<void>(resolve => {
      const transaction = database.transaction(['ledger', 'settings'], 'readwrite');
      transaction.objectStore('settings').put({ key: 'yatra.jarFrom', value: '2026-11-01', updatedAt: 1, deleted: 0, deviceId: 'e2e' });
      for (const day of list) for (let n = 0; n < count; n++) transaction.objectStore('ledger').put({ id: `crew-e2e-${day}-${n}`, mode: 'train', kind: 'session', refId: `${day}-${n}`, dayKey: day, inputs: { workingSets: 6, status: 'completed' }, updatedAt: new Date(`${day}T15:00:00`).getTime() + n, deleted: 0, deviceId: 'e2e' });
      transaction.oncomplete = () => resolve();
    });
    database.close();
  }, [days, perDay] as const);
  await page.reload();
}

test('two phones: make, invite, join, joined back, add, the same add twice, an impossible add, fill on both', async ({ browser }, info) => {
  test.setTimeout(120_000);
  const riya = await phone(browser, MADE, info);
  await riya.getByLabel('What the crew fills up for').fill('Sunday chai at the hill point');
  await riya.getByRole('group', { name: 'How big a jar' }).getByRole('button', { name: '5 h', exact: true }).click();
  await riya.getByLabel('Your first name').fill('Riya');
  await riya.getByRole('button', { name: 'Make the crew' }).click();
  await riya.getByRole('button', { name: 'Invite a friend' }).click();
  const invite = await lastSent(riya);
  expect(invite).toMatch(/^Join my NANDI crew: when we fill 5 h together, it's Sunday chai at the hill point\. https:\/\/nandi\.nandi11\.workers\.dev\/#crew\/join\//);

  const dev = await phone(browser, MADE, info);
  await paste(dev, invite);
  await expect(dev.getByRole('heading', { name: 'Join the Sunday chai at the hill point crew?' })).toBeVisible();
  await expect(dev.getByText('Crews hold up to 5.')).toBeVisible();
  await dev.getByLabel('Your first name').fill('Dev');
  await dev.getByRole('button', { name: 'Join' }).click();
  await dev.getByRole('button', { name: 'Send it to the crew' }).click();
  const joined = await lastSent(dev);
  expect(joined).toMatch(/^Dev joined our NANDI crew\. https:\/\/\S+#crew\/joined\//);
  await paste(riya, joined);
  await expect(riya.getByText('2 walking')).toBeVisible();

  // Dev walks four full days, then sends from Home.
  await dev.clock.setFixedTime(LATER);
  await seedSessions(dev, ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'], 6);
  await dev.goto('/?e2e#yatra');
  await dev.getByRole('button', { name: 'Send' }).click();
  const add = await lastSent(dev);
  expect(add).toMatch(/^Dev added 4 h to our crew jar · 4 h of 5 h · https:\/\/\S+#crew\/add\//);

  await riya.clock.setFixedTime(LATER);
  await paste(riya, add);
  await expect(riya.getByText('4 h of 5 h')).toBeVisible();
  // The same link again changes nothing.
  await paste(riya, add);
  await expect(riya.getByText('4 h of 5 h')).toBeVisible();
  // An edited link with an impossible total is ignored quietly: no crash, no message about anyone.
  const payload = linkIn(add).split('/').at(-1)!;
  const edited = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')) as Record<string, unknown>;
  const forged = Buffer.from(JSON.stringify({ ...edited, u: 9000 })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  await paste(riya, `https://nandi.nandi11.workers.dev/#crew/add/${forged}`);
  await expect(riya.getByText('4 h of 5 h')).toBeVisible();
  await expect(riya.locator('main')).not.toContainText(/cheat|fake|invalid|wrong/i);

  // Riya walks her own hour; the crew fills on her phone, then on Dev's once her add arrives.
  await seedSessions(riya, ['2026-11-05'], 6);
  await riya.goto('/?e2e#yatra/crew');
  await expect(riya.getByRole('heading', { name: 'The crew filled 5 h: Sunday chai at the hill point' })).toBeVisible();
  await riya.goto('/?e2e#yatra');
  await riya.getByRole('button', { name: 'Send' }).click();
  await paste(dev, await lastSent(riya));
  await expect(dev.getByRole('heading', { name: 'The crew filled 5 h: Sunday chai at the hill point' })).toBeVisible();
  // Nothing in what travelled names an app, a time of day or a phone figure.
  for (const text of [invite, joined, add]) expect(text).not.toMatch(/instagram|youtube|scroll|reel|\d{1,2}:\d{2}/i);
});

test('a crew link opened in a browser leads with "Have the app? Copy this link"', async ({ browser }, info) => {
  const riya = await phone(browser, MADE, info);
  await riya.getByLabel('What the crew fills up for').fill('Sunday chai');
  await riya.getByLabel('Your first name').fill('Riya');
  await riya.getByRole('button', { name: 'Make the crew' }).click();
  await riya.getByRole('button', { name: 'Invite a friend' }).click();
  const url = linkIn(await lastSent(riya)).replace('https://nandi.nandi11.workers.dev/', '/?e2e');
  const visitor = await phone(browser, MADE, info);
  await visitor.goto(url);
  await expect(visitor.getByText('Have the app?')).toBeVisible();
  await visitor.getByRole('button', { name: 'Copy this link' }).click();
  expect(await lastSent(visitor)).toMatch(/#crew\/join\//);
  await visitor.getByRole('button', { name: 'Join here in the browser' }).click();
  await expect(visitor.getByRole('heading', { name: 'Join the Sunday chai crew?' })).toBeVisible();
});

test('from Yatra with no crew: a row leads to making a crew, and "Paste a crew link" is one tap (no URL typed)', async ({ browser }, info) => {
  const riya = await phone(browser, MADE, info);
  await riya.goto('/?e2e#yatra');
  await riya.getByRole('button', { name: 'Fill a jar with friends' }).click();
  await riya.getByLabel('What the crew fills up for').fill('Sunday chai');
  await riya.getByLabel('Your first name').fill('Riya');
  await riya.getByRole('button', { name: 'Make the crew' }).click();
  await riya.getByRole('button', { name: 'Invite a friend' }).click();
  const invite = await lastSent(riya);
  const dev = await phone(browser, MADE, info);
  await dev.goto('/?e2e#yatra');
  await dev.getByRole('button', { name: 'Paste a crew link' }).click();
  // The field is open and focused, ready for the keyboard's Paste.
  await expect(dev.getByLabel('Crew link')).toBeFocused();
  await dev.keyboard.insertText(invite);
  await dev.getByRole('button', { name: 'Use this link' }).click();
  await expect(dev.getByRole('heading', { name: 'Join the Sunday chai crew?' })).toBeVisible();
  // With a crew, Yatra still offers the paste in one tap.
  await riya.goto('/?e2e#yatra');
  await expect(riya.getByRole('region', { name: 'Sunday chai crew' })).toContainText('0 m of 15 h for Sunday chai');
  await riya.getByRole('button', { name: 'Paste a crew link' }).click();
  await expect(riya.getByLabel('Crew link')).toBeFocused();
});
