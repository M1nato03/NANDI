import { receiptContent, type WeeklyRecapData } from '../../core/recap';
import { RECAP_HEIGHT, RECAP_WIDTH, RECEIPT_INK, receiptLayout, recapPng, type Measure } from './recapCard';

/**
 * Spec 53, e2e build only: the receipt laid out with the real bundled fonts. `problems` lists any text that leaves the
 * printable area or the paper, or overlaps another; `png` is the full-size image for the shots.
 */
async function fonts() {
  await Promise.all([document.fonts.load('800 68px "Bricolage Grotesque"'), document.fonts.load('500 46px "DM Sans"')]).catch(() => undefined);
}

async function problems(week: WeeklyRecapData, now?: number): Promise<string[]> {
  await fonts();
  const context = document.createElement('canvas').getContext('2d')!;
  const measure: Measure = (text, size, font, weight) => { context.font = `${weight} ${size}px ${font === 'display' ? '"Bricolage Grotesque"' : '"DM Sans"'}, sans-serif`; return context.measureText(text).width; };
  const out: string[] = [];
  for (const logo of [true, false]) {
    const layout = receiptLayout(receiptContent(week, now), measure, logo);
    if (layout.paperTop < 0 || layout.paperBottom + 40 > RECAP_HEIGHT) out.push(`paper ${layout.paperTop}-${layout.paperBottom}`);
    const boxes = layout.texts.map(text => {
      const width = measure(text.text, text.size, text.font, text.weight);
      const left = text.align === 'left' ? text.x : text.align === 'right' ? text.x - width : text.x - width / 2;
      return { text: text.text, left, right: left + width, top: text.y - text.size, bottom: text.y + text.size * 0.25 };
    });
    for (const box of boxes) {
      if (box.left < RECEIPT_INK.left - 0.5 || box.right > RECEIPT_INK.right + 0.5) out.push(`${box.text}: outside the print area`);
      if (box.top <= layout.paperTop || box.bottom >= layout.paperBottom) out.push(`${box.text}: off the paper`);
    }
    boxes.forEach((a, i) => boxes.slice(i + 1).forEach(b => {
      if (!(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top)) out.push(`${a.text} overlaps ${b.text}`);
    }));
    for (const leader of layout.leaders) if (leader.to - leader.from < 16) out.push(`leader at ${leader.y} too short`);
  }
  return out;
}

async function png(week: WeeklyRecapData, now?: number): Promise<{ dataUrl: string; width: number; height: number }> {
  const blob = await recapPng(receiptContent(week, now), document.querySelector<SVGSVGElement>('.recap-logo-source svg'));
  const bitmap = await createImageBitmap(blob);
  const dataUrl = await new Promise<string>(resolve => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(blob); });
  return { dataUrl, width: bitmap.width, height: bitmap.height };
}

declare global { interface Window { __nandiReceiptTest?: { problems: typeof problems; png: typeof png; size: { width: number; height: number } } } }
window.__nandiReceiptTest = { problems, png, size: { width: RECAP_WIDTH, height: RECAP_HEIGHT } };
