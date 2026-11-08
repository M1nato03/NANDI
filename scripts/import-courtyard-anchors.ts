/**
 * Spec 571 stage 2 commit 3: copies the keys the app reads from a Blender pass's anchor file into
 * src/ui/courtyard/anchors.json (the app never ships the pass's camera, world or occluder data). A new pass (9q) is:
 *   npx tsx scripts/import-courtyard-anchors.ts <path to anchors-p9q.json> <pass name>
 * then `vitest run src/core/courtyard` re-checks every layout gate on the new numbers.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { parseAnchors } from '../src/core/courtyard/anchors';

const [source, pass] = process.argv.slice(2);
if (!source || !pass) throw new Error('usage: import-courtyard-anchors.ts <anchors.json> <pass>');
type Row = Record<string, unknown>;
const raw = JSON.parse(readFileSync(source, 'utf8')) as { canvas: unknown; coordinate_system: unknown; layout: Row; friends: Record<string, Row>; tag?: Row; prop_rects_css?: Row };
parseAnchors(raw); // throws on a missing key, before anything is written
const keep = {
  pass,
  canvas: raw.canvas,
  coordinate_system: raw.coordinate_system,
  layout: { header_mask: raw.layout.header_mask, card_begins_y: raw.layout.card_begins_y, tab_bar_begins_y: raw.layout.tab_bar_begins_y, crop_rule: raw.layout.crop_rule },
  friends: Object.fromEntries(Object.entries(raw.friends).map(([id, row]) => [id, { area: row.area, foot_point: row.foot_point, tap_rect: row.tap_rect, today_glow_rect: row.today_glow_rect, scale: row.scale }])),
  ...(raw.tag ? { tag: { peg_point: raw.tag.peg_point, tag_rect_css: raw.tag.tag_rect_css } } : {}),
  prop_rects_css: raw.prop_rects_css,
};
writeFileSync('src/ui/courtyard/anchors.json', `${JSON.stringify(keep, null, 2)}\n`);
console.log(`anchors from ${pass}: ${Object.keys(keep.friends).length} friends, ${Object.keys(keep.prop_rects_css ?? {}).length} props`);
