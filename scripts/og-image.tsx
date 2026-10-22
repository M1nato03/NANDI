// Link preview image (spec 19 A): Nandi on the app background, 1200×630 PNG under 300 KB.
// Run: npx tsx scripts/og-image.tsx  →  public/og-nandi.png
// Uses sharp, which is already in node_modules (no new dependency); the PNG is committed, so CI never runs this.
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { register } from 'node:module';
import { statSync } from 'node:fs';

// Cast.tsx imports its stylesheet; Node cannot load CSS, so the drawing loads without it.
register(`data:text/javascript,${encodeURIComponent("export async function load(url, context, next) { return url.endsWith('.css') ? { format: 'module', source: '', shortCircuit: true } : next(url, context); }")}`);
(globalThis as { React?: typeof React }).React = React;
const { Nandi } = await import('../src/ui/cast/Cast');
const sharp = (await import('sharp' as string)).default as (input: Buffer) => { png: (options: object) => { toFile: (path: string) => Promise<unknown> } };

const W = 1200, H = 630;
const nandi = renderToStaticMarkup(createElement(Nandi, { pose: 'cheer', size: 470 })).replace('<svg ', '<svg x="660" y="90" ');
// A few faint board cells behind the text, in the app's region colours: a hint of the puzzle, not a real board.
const cells = ['#AE91F0', '#F4A26A', '#5BD3C8', '#EF85B6', '#B9D967', '#7DABFA', '#F3D46E', '#F18B7B', '#5BD3C8']
  .map((fill, i) => `<rect x="${84 + (i % 3) * 46}" y="${400 + Math.floor(i / 3) * 46}" width="40" height="40" rx="9" fill="${fill}" opacity="0.85"/>`).join('');
const font = "font-family=\"'Segoe UI', 'DejaVu Sans', Arial, sans-serif\"";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#0E0F12"/>
  <circle cx="895" cy="330" r="270" fill="#16171C"/>
  <circle cx="895" cy="330" r="200" fill="#1E2027"/>
  <text x="80" y="170" ${font} font-size="112" font-weight="800" fill="#FFB25B" letter-spacing="4">NANDI</text>
  <text x="84" y="250" ${font} font-size="54" font-weight="700" fill="#F4F0E8">Today's board</text>
  <text x="84" y="318" ${font} font-size="30" fill="#C9C3B8">Same board for everyone.</text>
  <text x="84" y="360" ${font} font-size="30" fill="#C9C3B8">Free, no sign-up, works offline.</text>
  ${cells}
  ${nandi}
</svg>`;
const out = 'public/og-nandi.png';
await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(out);
const bytes = statSync(out).size;
console.log(`${out}: ${bytes} bytes`);
if (bytes > 300_000) { console.error('Over 300 KB'); process.exitCode = 1; }
