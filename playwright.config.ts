import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:4173',
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
    command: 'npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port 4173 --strictPort',
    env: { VITE_E2E: '1' },
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
