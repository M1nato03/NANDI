# Startup measurement

Measured on a production `vite build` served by `vite preview` at 390 × 844 in headless Microsoft Edge. Each timing is the median of five fresh browser contexts, with `Emulation.setCPUThrottlingRate({ rate: 4 })` applied before navigation. The clock is fixed to 22:00 on 17 October 2026, so the first card is the night Now card. `scripts/perf-measure.mjs` measures from navigation start until Playwright reports the first deck article visible.

| Build | Main JS chunk, minified | Main JS gzip | First card samples (ms) | Median |
| --- | ---: | ---: | --- | ---: |
| Before | 1,178.55 kB | 344.14 kB | 1899, 1545, 1550, 1533, 1537 | 1,545 ms |
| After split (first run) | 260.07 kB | 81.19 kB | 1809, 1723, 1439, 1177, 1348 | 1,439 ms |
| After split (repeat) | 260.38 kB | 81.20 kB | 1665, 1536, 1637, 2019, 1724 | 1,665 ms |
| After split (third run) | 260.40 kB | 81.20 kB | 4422, 3257, 3494, 4065, 3597 | 3,597 ms |
| After split (final build) | 260.41 kB | 81.20 kB | 2701, 2157, 2196, 2081, 2103 | 2,157 ms |

The main chunk fell 77.9%. The first after run improved 6.9%; the later runs were slower than baseline. The 30% first-card target has not been demonstrated. The runs varied substantially on this machine while other Edge processes were active, so these timings need a quieter-machine repeat before treating them as a stable user-visible improvement.

The after build emits 67 JavaScript assets. Large deferred chunks include the three topic packs (77.28–81.21 kB each), lesson packs (47.00 and 68.63 kB), Mind (52.13 kB), Train (31.35 kB), and Planner (31.41 kB). `vite-plugin-pwa` reports 85 precache entries; its `injectManifest.globPatterns` includes `**/*.js`. All 67 generated JavaScript assets are listed in `dist/sw.js`, including the deferred content and screen chunks.

Commands:

```powershell
npm.cmd run build
npm.cmd run preview -- --port 4175 --strictPort
$env:PLAYWRIGHT_CHANNEL='msedge'; node scripts/perf-measure.mjs
```
