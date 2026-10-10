import { defineConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);

export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: `http://localhost:${port}`,
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL as 'msedge' | undefined,
  },
  projects: [
    {
      name: 'mobile-390x844',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
    {
      name: 'mobile-360x800',
      use: { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    // Separate e2e build: only it compiles in the ?e2e test hook (VITE_E2E), never the deployed dist/.
    command: `npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port ${port} --strictPort`,
    env: { VITE_E2E: '1' },
    url: `http://localhost:${port}`,
    reuseExistingServer: false, // never test another worktree's server on the same port
  },
});
