import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { environment: 'node', include: ['content-drafts/puzzles/**/*.test.ts'], testTimeout: 30000 } });
