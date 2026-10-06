// Original NANDI placeholder mark, drawn with Node's built-in PNG encoder pieces.
import { writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { URL } from 'node:url';
import { deflateSync } from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let value = n;
  for (let bit = 0; bit < 8; bit++) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function chunk(name, data) {
  const type = Buffer.from(name);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  let crc = 0xffffffff;
  for (const byte of Buffer.concat([type, data])) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, type, data, checksum]);
}
function icon(size) {
  const rows = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const px = x / size * 512, py = y / size * 512;
    const cornerX = Math.max(112 - px, 0, px - 400), cornerY = Math.max(112 - py, 0, py - 400);
    const inside = cornerX * cornerX + cornerY * cornerY <= 112 * 112;
    // A rising slash plus a small hash notch. Coordinates match icon.svg closely.
    const slash = py >= 153 && py <= 359 && px >= 488 - py && px <= 537 - py;
    const notch = (px >= 286 && px <= 381 && py >= 302 && py <= 322)
      || (px >= 322 && px <= 341 && py >= 267 && py <= 357);
    const lime = inside && (slash || notch);
    const offset = y * (1 + size * 4) + 1 + x * 4;
    rows[offset] = lime ? 200 : 10;
    rows[offset + 1] = lime ? 255 : 12;
    rows[offset + 2] = lime ? 46 : 16;
    rows[offset + 3] = inside ? 255 : 0;
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]);
}
for (const size of [192, 512]) writeFileSync(new URL(`../public/icon-${size}.png`, import.meta.url), icon(size));
