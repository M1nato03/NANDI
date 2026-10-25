import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['content-drafts/kolam/**/*.test.ts'],
  },
});
