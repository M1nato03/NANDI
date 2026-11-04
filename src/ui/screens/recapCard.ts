import { receiptWeek, type ReceiptContent } from '../../core/recap';
import { WEB_APP } from '../../core/puzzles/challenge';

/** Spec 53: story size (9:16), so the receipt fills a story without bars. */
export const RECAP_WIDTH = 1080;
export const RECAP_HEIGHT = 1920;

// The paper strip and its printable area.
const PAPER_LEFT = 150, PAPER_RIGHT = 930;
const INK_LEFT = 210, INK_RIGHT = 870;
export const RECEIPT_INK = { left: INK_LEFT, right: INK_RIGHT };
const LOGO_SIZE = 170;

const DISPLAY = '"Bricolage Grotesque", sans-serif';
const BODY = '"DM Sans", sans-serif';

export type ReceiptText = { text: string; x: number; y: number; size: number; font: 'display' | 'body'; weight: number; align: 'left' | 'right' | 'center'; color: 'ink' | 'muted' | 'accent' };
export type ReceiptRule = { y: number; dashed: boolean };
export type ReceiptLeader = { y: number; from: number; to: number };
export type ReceiptLayout = { paperTop: number; paperBottom: number; logo?: { x: number; y: number; size: number }; texts: ReceiptText[]; rules: ReceiptRule[]; leaders: ReceiptLeader[] };
/** Text width at a size; the canvas's measureText on the phone, a fixed estimate in unit tests. */
export type Measure = (text: string, size: number, font: 'display' | 'body', weight: number) => number;

const fontOf = (size: number, font: 'display' | 'body', weight: number) => `${weight} ${size}px ${font === 'display' ? DISPLAY : BODY}`;

/**
 * Where everything goes, worked out before anything is drawn, so a test can check that nothing is clipped or overlaps.
 * A line whose label and value would not fit with a short leader between them steps its size down until it does.
 */
export function receiptLayout(card: ReceiptContent, measure: Measure, hasLogo: boolean): ReceiptLayout {
  const texts: ReceiptText[] = [], rules: ReceiptRule[] = [], leaders: ReceiptLeader[] = [];
  const width = INK_RIGHT - INK_LEFT;
  const centre = (text: string, y: number, size: number, font: 'display' | 'body', weight: number, color: ReceiptText['color']) => {
    let fitted = size;
    while (fitted > 20 && measure(text, fitted, font, weight) > width) fitted -= 2;
    texts.push({ text, x: (INK_LEFT + INK_RIGHT) / 2, y, size: fitted, font, weight, align: 'center', color });
  };
  let y = 0;
  const logo = hasLogo ? { x: (RECAP_WIDTH - LOGO_SIZE) / 2, y: 70, size: LOGO_SIZE } : undefined;
  y = logo ? logo.y + logo.size + 90 : 140;
  centre('NANDI · RECEIPT', y, 68, 'display', 800, 'ink');
  y += 62;
  centre(receiptWeek(card), y, 38, 'body', 500, 'muted');
  y += 56;
  rules.push({ y, dashed: true });
  y += 96;
  const row = (label: string, value: string, size: number, font: 'display' | 'body', weight: number) => {
    let fitted = size;
    while (fitted > 26 && measure(label, fitted, font, weight) + measure(value, fitted, font, weight) + 64 > width) fitted -= 2;
    texts.push({ text: label, x: INK_LEFT, y, size: fitted, font, weight, align: 'left', color: 'ink' });
    texts.push({ text: value, x: INK_RIGHT, y, size: fitted, font, weight, align: 'right', color: 'ink' });
    leaders.push({ y: y - fitted * 0.18, from: INK_LEFT + measure(label, fitted, font, weight) + 20, to: INK_RIGHT - measure(value, fitted, font, weight) - 20 });
  };
  for (const line of card.lines) { row(line.label, line.value, 46, 'body', 500); y += 92; }
  y -= 30;
  rules.push({ y, dashed: false });
  if (card.total) {
    y += 100;
    row('REAL THINGS', card.total, 54, 'display', 800);
    y += 50;
    rules.push({ y, dashed: false });
  }
  if (card.highlight) { y += 70; centre(card.highlight, y, 34, 'body', 500, 'muted'); }
  y += 120;
  centre('Paid in real life.', y, 52, 'display', 700, 'accent');
  for (const slot of [card.slots.crew, card.slots.baithak]) if (slot) { y += 64; centre(slot, y, 34, 'body', 500, 'ink'); }
  y += 72;
  centre(WEB_APP.replace(/^https:\/\//, ''), y, 30, 'body', 500, 'muted');
  const height = y + 90;
  // The strip sits in the middle of the story, its torn edge below.
  const offset = Math.max(60, Math.round((RECAP_HEIGHT - height - 40) / 2));
  const shift = <T extends { y: number }>(item: T): T => ({ ...item, y: item.y + offset });
  return {
    paperTop: offset, paperBottom: offset + height,
    logo: logo && shift(logo),
    texts: texts.map(shift), rules: rules.map(shift), leaders: leaders.map(shift),
  };
}

const COLORS = { ink: '#2B211B', muted: '#7A6A5C', accent: '#B05A12' };

export function renderRecapCard(canvas: HTMLCanvasElement, card: ReceiptContent, logo?: CanvasImageSource | null): void {
  canvas.width = RECAP_WIDTH;
  canvas.height = RECAP_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image canvas unavailable');
  const measure: Measure = (text, size, font, weight) => { context.font = fontOf(size, font, weight); return context.measureText(text).width; };
  const layout = receiptLayout(card, measure, !!logo);
  // Always the light paper look, so the receipt reads the same on every story.
  const background = context.createLinearGradient(0, 0, 0, RECAP_HEIGHT);
  background.addColorStop(0, '#F1DDBF');
  background.addColorStop(1, '#E3C29B');
  context.fillStyle = background;
  context.fillRect(0, 0, RECAP_WIDTH, RECAP_HEIGHT);
  // The paper with a soft shadow, and a torn edge at the bottom.
  const tooth = 26;
  const paper = () => {
    context.beginPath();
    context.moveTo(PAPER_LEFT, layout.paperTop);
    context.lineTo(PAPER_RIGHT, layout.paperTop);
    context.lineTo(PAPER_RIGHT, layout.paperBottom);
    for (let x = PAPER_RIGHT, down = false; x > PAPER_LEFT; x -= tooth, down = !down) context.lineTo(Math.max(PAPER_LEFT, x - tooth), layout.paperBottom + (down ? 0 : 18));
    context.lineTo(PAPER_LEFT, layout.paperTop);
    context.closePath();
  };
  context.fillStyle = 'rgba(80, 50, 20, 0.16)';
  context.save(); context.translate(0, 14); paper(); context.fill(); context.restore();
  context.fillStyle = '#FFFBF3';
  paper(); context.fill();
  if (logo && layout.logo) context.drawImage(logo, layout.logo.x, layout.logo.y, layout.logo.size, layout.logo.size);
  context.strokeStyle = COLORS.muted;
  context.lineWidth = 3;
  for (const rule of layout.rules) {
    context.setLineDash(rule.dashed ? [14, 10] : []);
    context.beginPath(); context.moveTo(INK_LEFT, rule.y); context.lineTo(INK_RIGHT, rule.y); context.stroke();
  }
  context.setLineDash([]);
  context.fillStyle = COLORS.muted;
  for (const leader of layout.leaders) for (let x = leader.from; x <= leader.to; x += 16) { context.beginPath(); context.arc(x, leader.y, 2.6, 0, Math.PI * 2); context.fill(); }
  for (const text of layout.texts) {
    context.font = fontOf(text.size, text.font, text.weight);
    context.textAlign = text.align;
    context.fillStyle = COLORS[text.color];
    context.fillText(text.text, text.x, text.y);
  }
  context.textAlign = 'left';
}

/** The friend's own drawing as an image; null when the WebView cannot load it, and the receipt draws without a logo. */
export async function svgLogo(svg: SVGSVGElement | null | undefined): Promise<HTMLImageElement | null> {
  if (!svg) return null;
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copy.setAttribute('width', String(LOGO_SIZE)); copy.setAttribute('height', String(LOGO_SIZE));
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' }));
  try {
    // A load that never settles (some WebViews) gives no logo after 1.5 s rather than holding the card.
    return await new Promise(resolve => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => resolve(null); setTimeout(() => resolve(null), 1500); image.src = url; });
  } finally { setTimeout(() => URL.revokeObjectURL(url), 0); }
}

export async function recapPng(card: ReceiptContent, logoSvg?: SVGSVGElement | null): Promise<Blob> {
  // Fonts are bundled, but never let a slow font load block the card: draw after at most 2 s.
  await Promise.race([
    Promise.all([
      document.fonts.load('800 68px "Bricolage Grotesque"'),
      document.fonts.load('500 46px "DM Sans"'),
    ]).catch(() => undefined),
    new Promise(resolve => setTimeout(resolve, 2000)),
  ]);
  const logo = await svgLogo(logoSvg).catch(() => null);
  const canvas = document.createElement('canvas');
  renderRecapCard(canvas, card, logo);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not make recap image')), 'image/png'));
}
