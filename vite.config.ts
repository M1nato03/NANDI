import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'child_process';
import pkg from './package.json';

const commit = process.env.GITHUB_SHA 
  ? process.env.GITHUB_SHA.slice(0, 7)
  : (() => {
      try {
        return execSync('git rev-parse --short HEAD').toString().trim();
      } catch {
        return 'dev';
      }
    })();

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.NANDI_VERSION ?? pkg.version),
    __BUILD_COMMIT__: JSON.stringify(commit),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().split('T')[0]),
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // Precache fonts and icons too, or the installed app loses its typefaces offline.
      // The link-preview image is for chat apps' crawlers only; the app never shows it, so it stays out of the offline cache.
      injectManifest: { globPatterns: ['**/*.{js,css,html,woff2,svg,png,webmanifest}'], globIgnores: ['**/og-nandi.png'] },
      registerType: 'prompt',
      manifest: {
        name: 'NANDI',
        short_name: 'NANDI',
        start_url: '/',
        display: 'standalone',
        background_color: '#0A0C10',
        theme_color: '#0A0C10',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
});
