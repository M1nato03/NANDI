import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'dist/**',
      'dist-e2e/**',
      'dist-e2e-b/**',
      'coverage/**',
      'legacy/**',
      'reference/**',
      'playwright-report/**',
      'test-results/**',
      '.codex-runs/**',
      '.npm-cache/**',
      '.playwright-browsers/**',
      'android/**',
      'src/core/puzzles/puzzles.js',
      'src/core/mysteries/cases.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,ts,tsx,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.serviceworker,
      },
    },
  },
  { files: ['**/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  reactHooks.configs.flat.recommended,
];
