import type { RecapCardContent } from '../../core/recap';

export const RECAP_WIDTH = 1080;
export const RECAP_HEIGHT = 1350;

export function renderRecapCard(canvas: HTMLCanvasElement, card: RecapCardContent): void {
  canvas.width = RECAP_WIDTH;
  canvas.height = RECAP_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image canvas unavailable');
  const ink = '#F3EFE8';
  const muted = '#BDB6A9';
  const saffron = '#FFB25B';
  const teal = '#5FD4C0';
  const background = context.createLinearGradient(0, 0, RECAP_WIDTH, RECAP_HEIGHT);
  background.addColorStop(0, '#26201D');
  background.addColorStop(0.55, '#17191D');
  background.addColorStop(1, '#102624');
  context.fillStyle = background;
  context.fillRect(0, 0, RECAP_WIDTH, RECAP_HEIGHT);
  context.fillStyle = saffron;
  context.fillRect(0, 0, 18, RECAP_HEIGHT);
  context.fillStyle = teal;
  context.beginPath();
  context.arc(920, 120, 210, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#17191D';
  context.beginPath();
  context.arc(920, 120, 187, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = saffron;
  context.font = '600 27px "DM Sans"';
  context.fillText('A WEEK IN REAL LIFE', 88, 130);
  context.fillStyle = ink;
  context.font = '800 88px "Bricolage Grotesque"';
  context.fillText('What my week', 82, 260);
  context.fillText('became.', 82, 355);
  context.fillStyle = muted;
  context.font = '400 36px "DM Sans"';
  context.fillText(card.dates, 88, 421);

  card.lines.forEach((line, index) => {
    const top = 493 + index * 150;
    context.fillStyle = index % 2 === 0 ? saffron : teal;
    context.fillRect(88, top, 7, 105);
    context.fillStyle = ink;
    context.font = '800 54px "Bricolage Grotesque"';
    context.fillText(line, 119, top + 68, 850);
  });
  context.fillStyle = '#28332F';
  context.beginPath();
  context.roundRect(88, 1118, 904, 116, 24);
  context.fill();
  context.fillStyle = teal;
  context.font = '600 26px "DM Sans"';
  context.fillText('A MOMENT TO KEEP', 120, 1161);
  context.fillStyle = ink;
  context.font = '600 37px "DM Sans"';
  context.fillText(card.highlight, 120, 1207, 830);
  context.fillStyle = saffron;
  context.beginPath();
  context.arc(94, 1290, 9, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = ink;
  context.font = '800 30px "Bricolage Grotesque"';
  context.fillText('NANDI', 118, 1300);
}

export async function recapPng(card: RecapCardContent): Promise<Blob> {
  await Promise.all([
    document.fonts.load('800 88px "Bricolage Grotesque"'),
    document.fonts.load('600 37px "DM Sans"'),
  ]);
  const canvas = document.createElement('canvas');
  renderRecapCard(canvas, card);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not make recap image')), 'image/png'));
}
