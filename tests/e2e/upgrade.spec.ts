import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, isAbsolute, relative, resolve } from 'node:path';

const buildADir = resolve('dist-e2e');
const buildBDir = resolve('dist-e2e-b');
const contentTypes: Record<string, string> = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.mjs': 'text/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function startUpgradeServer() {
  // Build B is produced once per run by tests/e2e/global-setup.ts (parallel tests must not rebuild it).

  // Chromium fetches service worker updates outside Playwright's route interception.
  // Serve both builds from the same real origin so /sw.js can change with the page.
  let servedDir = buildADir;
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url ?? '/', 'http://localhost').pathname,
      );
      if (pathname === '/_e2e_reset') {
        response.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }).end('<!doctype html><title>Reset</title>');
        return;
      }
      const file = resolve(
        servedDir,
        `.${pathname === '/' ? '/index.html' : pathname}`,
      );
      const inside = relative(servedDir, file);
      if (
        inside.startsWith('..') ||
        isAbsolute(inside) ||
        !(await stat(file).catch(() => null))?.isFile()
      ) {
        response.writeHead(404).end();
        return;
      }
      response
        .writeHead(200, {
          'Content-Type':
            contentTypes[extname(file)] ?? 'application/octet-stream',
          'Cache-Control': 'no-store',
        })
        .end(await readFile(file));
    } catch {
      response.writeHead(500).end();
    }
  });
  await new Promise<void>((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  return {
    origin,
    serveBuildB() { servedDir = buildBDir; },
    close: () => new Promise<void>((resolveClose, rejectClose) =>
      server.close((error) => (error ? rejectClose(error) : resolveClose())),
    ),
  };
}

async function prepareUpgrade(page: Page, context: BrowserContext, origin: string) {
  // Each test has its own browser context. Clear the origin before the app runs.
  await context.clearCookies();
  await page.goto(`${origin}/_e2e_reset`);
  await page.evaluate(async () => {
    for (const registration of await navigator.serviceWorker.getRegistrations()) {
      await registration.unregister();
    }
    for (const key of await caches.keys()) await caches.delete(key);
    localStorage.clear();
    sessionStorage.clear();
    for (const database of await indexedDB.databases()) {
      if (!database.name) continue;
      await new Promise<void>((resolveDelete, rejectDelete) => {
        const request = indexedDB.deleteDatabase(database.name!);
        request.onsuccess = () => resolveDelete();
        request.onerror = () => rejectDelete(request.error);
        request.onblocked = () => rejectDelete(new Error('Database cleanup blocked'));
      });
    }
  });

  await page.goto(`${origin}/?e2e#you`);
  await expect(
    page.getByRole('main').getByRole('heading', { name: 'You', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Settings/ }).click();
  await expect(page.getByText(/NANDI 0\.1\.0 ·/)).toBeAttached();
  await page.waitForFunction(() => window.__nandiTest !== undefined);
  await page.evaluate(async () => {
    await window.__nandiTest!.seedShell();
  });

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect.poll(async () => (await page.evaluate(() => window.__nandiTest!.shellCounts())).tasks).toBe(1);
  await page.reload(); // Build A now controls this page.
  await page.waitForFunction(
    () => navigator.serviceWorker.controller !== null,
  );
}

test('upgrade keeps data and works offline', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844', 'Build B is shared across projects');
  test.setTimeout(120_000);
  const server = await startUpgradeServer();

  try {
    await prepareUpgrade(page, context, server.origin);
    const count = await page.evaluate(
      async () => (await window.__nandiTest!.shellCounts()).tasks,
    );
    expect(count).toBeGreaterThan(0);

    server.serveBuildB();
    await page.reload(); // Registration checks the service worker script served from build B.
    const update = page.getByRole('region', { name: 'App update' });
    await expect(update).toContainText('Update available', {
      timeout: 20_000,
    });
    const reloaded = page.waitForEvent('load');
    await update.getByRole('button', { name: 'Update', exact: true }).click();
    await reloaded;

    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'You' }).click();
    await expect(page.getByRole('main').getByRole('heading', { name: 'You', exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Settings/ }).click();
    await expect(page.getByText(/NANDI 0\.1\.0-b ·/)).toBeAttached();
    await page.waitForFunction(() => window.__nandiTest !== undefined);
    expect(
      await page.evaluate(
        async () => (await window.__nandiTest!.shellCounts()).tasks,
      ),
    ).toBe(count);

    await context.setOffline(true);
    await page.reload();
    await expect(
      page.getByRole('main').getByRole('heading', { name: 'Settings', exact: true, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(/NANDI 0\.1\.0-b ·/)).toBeAttached();
  } finally {
    await server.close();
  }
});

test('active focus waits until paused before updating', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390x844', 'Build B is shared across projects');
  test.setTimeout(120_000);
  const server = await startUpgradeServer();

  try {
    await prepareUpgrade(page, context, server.origin);
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Plan' }).click();
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').click();
    await page.getByPlaceholder('Add a task, e.g. call bank 15m').fill('Focus through update');
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Now' }).click();
    await expect(page.getByRole('region', { name: 'Now deck' })).toContainText('Focus through update');
    await page.getByRole('article', { name: 'First step card' }).getByRole('button', { name: 'Start' }).click();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    await expect.poll(async () => (await page.evaluate(() => window.__nandiTest!.shellCounts())).focus).toBe(1);
    const count = await page.evaluate(
      async () => (await window.__nandiTest!.shellCounts()).tasks,
    );
    expect(count).toBeGreaterThan(1);

    server.serveBuildB();
    await page.reload();
    const update = page.getByRole('region', { name: 'App update' });
    await expect(update).toContainText('Update available', { timeout: 20_000 });
    let loads = 0;
    page.on('load', () => { loads++; });
    await update.getByRole('button', { name: 'Update', exact: true }).click();
    await expect(update).toContainText('Finish or pause your focus first');
    expect(loads).toBe(0);
    const reloaded = page.waitForEvent('load');
    await page.getByRole('button', { name: 'Pause' }).click();
    await reloaded;

    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'You' }).click();
    await expect(page.getByRole('main').getByRole('heading', { name: 'You', exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Settings/ }).click();
    await expect(page.getByText(/NANDI 0\.1\.0-b ·/)).toBeAttached();
    await page.waitForFunction(() => window.__nandiTest !== undefined);
    expect(await page.evaluate(
      async () => (await window.__nandiTest!.shellCounts()).tasks,
    )).toBe(count);
    await page.getByRole('navigation', { name: 'Main tabs' }).getByRole('link', { name: 'Now' }).click();
    await page.getByRole('article', { name: 'First step card' }).getByRole('button', { name: 'Done' }).click();
  } finally {
    await server.close();
  }
});
