import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
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

test('upgrade keeps data and works offline', async ({
  page,
  context,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-390x844',
    'Build B is shared across projects',
  );
  test.setTimeout(120_000);

  execFileSync(
    process.execPath,
    [
      resolve('node_modules/vite/bin/vite.js'),
      'build',
      '--outDir',
      'dist-e2e-b',
    ],
    {
      env: { ...process.env, VITE_E2E: '1', NANDI_VERSION: '0.1.0-b' },
      stdio: 'inherit',
    },
  );

  // Chromium fetches service worker updates outside Playwright's route interception.
  // Serve both builds from the same real origin so /sw.js can change with the page.
  let servedDir = buildADir;
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url ?? '/', 'http://localhost').pathname,
      );
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

  try {
    await page.goto(`${origin}/?e2e#ground`);
    await expect(
      page.getByRole('main').getByRole('heading', { name: 'Ground' }),
    ).toBeVisible();
    await expect(page.getByText(/NANDI 0\.1\.0 ·/)).toBeVisible();
    await page.waitForFunction(() => window.__nandiTest !== undefined);
    await page.evaluate(async () => {
      await window.__nandiTest!.seedShell();
    });
    const count = await page.evaluate(
      async () => (await window.__nandiTest!.shellCounts()).tasks,
    );
    expect(count).toBeGreaterThan(0);

    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload(); // Build A now controls this page.
    await page.waitForFunction(
      () => navigator.serviceWorker.controller !== null,
    );

    servedDir = buildBDir;
    await page.reload(); // Registration checks the service worker script served from build B.
    const update = page.getByRole('region', { name: 'App update' });
    await expect(update).toContainText('Update available', {
      timeout: 20_000,
    });
    const reloaded = page.waitForEvent('load');
    await update.getByRole('button', { name: 'Update', exact: true }).click();
    await reloaded;

    await expect(page.getByText(/NANDI 0\.1\.0-b ·/)).toBeVisible();
    await page.waitForFunction(() => window.__nandiTest !== undefined);
    expect(
      await page.evaluate(
        async () => (await window.__nandiTest!.shellCounts()).tasks,
      ),
    ).toBe(count);

    await context.setOffline(true);
    await page.reload();
    await expect(
      page.getByRole('main').getByRole('heading', { name: 'Ground' }),
    ).toBeVisible();
    await expect(page.getByText(/NANDI 0\.1\.0-b ·/)).toBeVisible();
  } finally {
    await new Promise<void>((resolveClose, rejectClose) =>
      server.close((error) => (error ? rejectClose(error) : resolveClose())),
    );
  }
});
