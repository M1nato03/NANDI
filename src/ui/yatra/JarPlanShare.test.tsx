// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PayoutCard } from './JarPlan';
import type { Trek } from '../../core/yatra/trek';

// The day window and the share are recorded, not run.
const sent = vi.hoisted(() => ({ share: vi.fn() }));
vi.mock('../shareActions', async original => ({ ...await original<typeof import('../shareActions')>(), useShareDay: () => true, shareFileNow: sent.share }));

let drawn: string[] = [];
beforeEach(() => {
  drawn = [];
  sent.share.mockResolvedValue('shared');
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:camp', revokeObjectURL: vi.fn() });
  Object.defineProperty(document, 'fonts', { configurable: true, value: { load: vi.fn().mockResolvedValue([]) } });
  const context = new Proxy({ font: '', fillStyle: '', strokeStyle: '', lineWidth: 1, textAlign: 'left' } as Record<string, unknown>, {
    get: (target, key: string) => key in target ? target[key]
      : key === 'fillText' ? (text: string) => { drawn.push(text); }
        : key === 'measureText' ? (text: string) => ({ width: text.length * 22 })
          : key === 'createLinearGradient' ? () => ({ addColorStop: vi.fn() })
            : () => undefined,
    set: (target, key: string, value) => { target[key] = value; return true; },
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(new Blob(['png'], { type: 'image/png' })));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('spec 54 privacy: the person\'s plan line stays on their screen and never reaches the image or the share text', async () => {
  const trek = { trail: { places: [{ name: 'Jobra' }, { name: 'Chika' }] } } as unknown as Trek;
  render(<PayoutCard trek={trek} plan={{ line: 'zq-plan-7731', camp: 1, setAt: 1, needMinutes: 30 }} done={vi.fn()} />);
  // On the person's own card the line is there.
  expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('You reached Chika: zq-plan-7731');
  fireEvent.click(screen.getByRole('button', { name: 'Share' }));
  const sheet = await screen.findByRole('dialog', { name: 'Share this camp' });
  await waitFor(() => expect(sheet.querySelector('img')).not.toBeNull(), { timeout: 4000 });
  expect(drawn).toContain('Chika');
  fireEvent.click(screen.getAllByRole('button', { name: 'Share' }).at(-1)!);
  await waitFor(() => expect(sent.share).toHaveBeenCalled());
  const text = String(sent.share.mock.calls[0]![1]);
  expect(text).toBe('I reached Chika on my NANDI trail.\nhttps://nandi.nandi11.workers.dev');
  expect(drawn.some(line => line.includes('zq-plan-7731'))).toBe(false);
  expect(text.includes('zq-plan-7731')).toBe(false);
  expect(sheet.querySelector('img')!.getAttribute('alt')).not.toContain('zq-plan-7731');
});
