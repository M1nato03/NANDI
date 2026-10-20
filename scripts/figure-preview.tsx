// Review tool: renders every exercise drawing on one page, light and dark. Run: npx tsx scripts/figure-preview.tsx <out.html>
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, writeFileSync } from 'node:fs';

(globalThis as { React?: typeof React }).React = React;
const { EXERCISE_LIBRARY } = await import('../src/core/train/library');
const { ExerciseFigure } = await import('../src/ui/train/ExerciseFigure');
const css = readFileSync('src/ui/train/train.css', 'utf8').split('/* Exercise how-to drawings */')[1];
const cell = (id: string) => `<div class="cell"><b>${EXERCISE_LIBRARY[id]!.name}</b>${renderToStaticMarkup(createElement(ExerciseFigure, { id, name: EXERCISE_LIBRARY[id]!.name })) || '<p>MISSING</p>'}</div>`;
const grid = Object.keys(EXERCISE_LIBRARY).map(cell).join('');
const theme = (dark: boolean) => dark ? '--ink:#f4f0e8;--muted:#9a958c;--surface:#1b1d22;--raised:#2a2d33;--line:#3a3d44;--accent:#f2994a;background:#121317;color:#f4f0e8' : '--ink:#1d1b18;--muted:#8b857b;--surface:#fffdf8;--raised:#efe9dd;--line:#d8d0c2;--accent:#d9661f;background:#fbf7ef;color:#1d1b18';
writeFileSync(process.argv[2]!, `<!doctype html><meta charset="utf-8"><style>body{margin:0;font:12px sans-serif}.g{display:grid;grid-template-columns:repeat(5,200px);gap:6px;padding:8px}.cell{border:1px solid #8884;border-radius:6px;padding:4px}${css}</style><div class="g" style="${theme(false)}">${grid}</div><div class="g" style="${theme(true)}">${grid}</div>`);
