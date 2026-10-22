import { readFileSync, statSync } from 'node:fs';
import { expect, it } from 'vitest';

// Spec 19 A: a pasted link shows a preview, not a bare URL.
it('index.html carries the link-preview tags and a 1200×630 image under 300 KB', () => {
  const html = readFileSync('index.html', 'utf8');
  const meta = (key: string) => html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`))?.[1];
  expect(meta('og:title')).toBe("NANDI · today's board");
  expect(meta('og:description')).toBe('Same board for everyone. Free, no sign-up, works offline.');
  expect(meta('og:url')).toBe('https://nandi.nandi11.workers.dev/');
  expect(meta('og:image')).toBe('https://nandi.nandi11.workers.dev/og-nandi.png');
  expect(meta('twitter:card')).toBe('summary_large_image');
  const png = readFileSync('public/og-nandi.png');
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
  expect(statSync('public/og-nandi.png').size).toBeLessThan(300_000);
});
