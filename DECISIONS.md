# Decisions

One row per decision, newest last. New dependency → one line saying why.

| Date | Decision | Why |
|---|---|---|
| 2026-10-04 | **Rename** Prime Pocket → NANDI in code and copy. Backup file `nandi-backup-YYYY-MM-DD.json`, envelope `app: 'nandi'`, weekly file `nandi-week-*.json` (git-ignored). Docs keep their original wording. | Jenil chose one name for the app and the repo. |
| 2026-10-04 | **Versions**: Vite 8, React 19, TypeScript 6.0.x (not 7), Dexie 4.4 + dexie-export-import + dexie-react-hooks, Valibot 1, vite-plugin-pwa 2, Vitest, Playwright, ulidx, fake-indexeddb, tsx, wrangler 4. | typescript-eslint 8 supports only TS < 6.1. |
| 2026-10-04 | **Hosting**: Cloudflare Workers static assets (`wrangler.jsonc`, SPA fallback, `public/_headers` per spec 01 §8), deployed from GitHub Actions with a repo-secret API token. | Free; Jenil has no host account yet. |
| 2026-10-04 | **Banned-words check** is case-sensitive with word boundaries and scans only `src/` and `content/`. | Lowercase "ego" in the Charaka lesson and "zip" in code are ordinary words. |
| 2026-10-04 | **Placement band**: stop band is 5–11; 12 or more moves up (03-train §1). | "≥12 up" overlapped "stop at 5–12"; wording fix, same meaning. |
| 2026-10-04 | **Line endings LF** via `.gitattributes`. | Windows checkout; keeps diffs and CI clean. |
| 2026-10-04 | **One agent at a time**: build in-session, one review before closing the phase (not parallel subagents). | Jenil's standing rule; token budget. |
| 2026-10-07 | **Codex writes the code**, Claude plans and checks PASS/FAIL; the harness runs `npm.cmd install`/build/test (Codex has no network). | Token budget; an independent check judges each step. |
| 2026-10-07 | jsdom + @testing-library/react + workbox-window/-build added | Component tests and the PWA plugin's required peers. |
