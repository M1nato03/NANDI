import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['content-drafts/kapi-cases/*.test.ts'],
    maxWorkers: 1,
    fileParallelism: false,
  },
});
