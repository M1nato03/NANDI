import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// `npm run shots`: the 360x800 screenshot set every UI change is checked against before a push (item 140).
// Pictures go to SHOTS_DIR (default shots-out/); SHOTS_THEME=light|dark|both picks the themes (default light).
export default defineConfig({
  ...base,
  testDir: 'tests/shots',
  reporter: 'line',
  workers: 1,
  projects: [{ name: 'shots-360x800', use: { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true } }],
});
