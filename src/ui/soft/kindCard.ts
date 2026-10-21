/** Spec 15 E: a small square card with a courtyard friend, the kind line and a quiet footer. Drawn on the phone; nothing is uploaded. */
export const KIND_SIZE = 1080;

const wrap = (context: CanvasRenderingContext2D, text: string, width: number): string[] => {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > width && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
};

async function svgImage(svg: SVGSVGElement): Promise<HTMLImageElement | null> {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copy.setAttribute('width', '420'); copy.setAttribute('height', '420');
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' }));
  try {
    return await new Promise(resolve => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => resolve(null); image.src = url; });
  } finally { setTimeout(() => URL.revokeObjectURL(url), 0); }
}

export async function kindCardPng(line: string, friend: SVGSVGElement | null, link: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = KIND_SIZE; canvas.height = KIND_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image canvas unavailable');
  const background = context.createLinearGradient(0, 0, 0, KIND_SIZE);
  background.addColorStop(0, '#FFF4E3');
  background.addColorStop(1, '#F7E1C8');
  context.fillStyle = background;
  context.fillRect(0, 0, KIND_SIZE, KIND_SIZE);
  // A warm lantern glow behind the friend.
  const glow = context.createRadialGradient(540, 330, 40, 540, 330, 320);
  glow.addColorStop(0, 'rgba(255, 190, 92, 0.55)');
  glow.addColorStop(1, 'rgba(255, 190, 92, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, KIND_SIZE, KIND_SIZE);
  const image = friend ? await svgImage(friend) : null;
  if (image) context.drawImage(image, 330, 110, 420, 420);
  context.fillStyle = '#3B2A20';
  context.font = '700 64px "Bricolage Grotesque", sans-serif';
  context.textAlign = 'center';
  const lines = wrap(context, line, 860).slice(0, 4);
  lines.forEach((text, index) => context.fillText(text, 540, 640 + index * 82));
  context.fillStyle = '#8A6D58';
  context.font = '400 32px "DM Sans", sans-serif';
  context.fillText('sent with NANDI', 540, 980);
  context.font = '400 26px "DM Sans", sans-serif';
  context.fillText(link.replace(/^https?:\/\//, ''), 540, 1024);
  return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not make the card')), 'image/png'));
}
