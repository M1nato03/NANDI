import type { ReactNode } from 'react';
import type { ChikuProp } from '../../core/learn/chiku';

// Spec 30: the stage's props, original flat shapes in the area palette on a 64 × 64 grid. One per scene.
const ink = 'var(--ink)', learn = 'var(--area-learn)', think = 'var(--area-think)', notice = 'var(--area-notice)', move = 'var(--area-move)', night = 'var(--area-night)', soft = 'var(--surface-3)';
const PATHS: Record<ChikuProp, ReactNode> = {
  bus: <><rect x="6" y="16" width="52" height="30" rx="6" fill={notice} /><rect x="11" y="21" width="12" height="10" rx="2" fill={soft} /><rect x="26" y="21" width="12" height="10" rx="2" fill={soft} /><rect x="41" y="21" width="12" height="10" rx="2" fill={soft} /><circle cx="17" cy="47" r="5" fill={ink} /><circle cx="47" cy="47" r="5" fill={ink} /></>,
  train: <><rect x="10" y="10" width="44" height="38" rx="9" fill={think} /><rect x="16" y="16" width="32" height="13" rx="3" fill={soft} /><circle cx="22" cy="38" r="3" fill={soft} /><circle cx="42" cy="38" r="3" fill={soft} /><path d="M18 48l-6 8M46 48l6 8" stroke={ink} strokeWidth="3" strokeLinecap="round" /></>,
  phone: <><rect x="20" y="6" width="24" height="52" rx="5" fill={ink} /><rect x="23" y="12" width="18" height="36" rx="2" fill={learn} /><circle cx="32" cy="53" r="2" fill={soft} /></>,
  book: <><path d="M8 14q12-4 24 2v38q-12-6-24-2z" fill={learn} /><path d="M56 14q-12-4-24 2v38q12-6 24-2z" fill={notice} /><path d="M32 16v38" stroke={ink} strokeWidth="2" /></>,
  clock: <><circle cx="32" cy="32" r="24" fill={soft} stroke={ink} strokeWidth="3" /><path d="M32 18v14l9 6" stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none" /></>,
  bed: <><rect x="6" y="30" width="52" height="14" rx="3" fill={night} /><rect x="8" y="22" width="16" height="10" rx="4" fill={soft} /><path d="M6 20v34M58 34v20" stroke={ink} strokeWidth="3" strokeLinecap="round" /></>,
  plate: <><ellipse cx="32" cy="38" rx="26" ry="10" fill={soft} stroke={ink} strokeWidth="2" /><circle cx="26" cy="34" r="6" fill={move} /><circle cx="38" cy="34" r="5" fill={notice} /></>,
  cup: <><path d="M14 20h30l-4 32H18z" fill={notice} /><path d="M44 26h4a6 6 0 0 1 0 12h-6" fill="none" stroke={ink} strokeWidth="3" /><path d="M24 8q-3 5 0 8M32 8q-3 5 0 8" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" /></>,
  laptop: <><rect x="12" y="12" width="40" height="28" rx="3" fill={ink} /><rect x="15" y="15" width="34" height="22" fill={think} /><path d="M4 46h56l-4 6H8z" fill={soft} stroke={ink} strokeWidth="2" /></>,
  coin: <><circle cx="32" cy="32" r="22" fill={notice} stroke={ink} strokeWidth="3" /><path d="M26 22h12M26 30h12M28 22q10 0 6 8l-8 12" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" /></>,
  shop: <><rect x="10" y="26" width="44" height="30" fill={soft} stroke={ink} strokeWidth="2" /><path d="M6 26l6-14h40l6 14z" fill={move} /><rect x="26" y="38" width="12" height="18" fill={learn} /></>,
  tree: <><rect x="28" y="38" width="8" height="20" fill={ink} /><circle cx="32" cy="26" r="18" fill={move} /></>,
  rain: <><path d="M14 30a12 12 0 0 1 22-8a10 10 0 0 1 16 10H14z" fill={soft} stroke={ink} strokeWidth="2" /><path d="M20 40l-3 8M32 40l-3 8M44 40l-3 8" stroke={think} strokeWidth="3" strokeLinecap="round" /></>,
  sun: <><circle cx="32" cy="32" r="13" fill={notice} /><path d="M32 6v8M32 50v8M6 32h8M50 32h8M14 14l6 6M44 44l6 6M14 50l6-6M44 20l6-6" stroke={notice} strokeWidth="4" strokeLinecap="round" /></>,
  door: <><rect x="16" y="6" width="32" height="52" rx="2" fill={learn} stroke={ink} strokeWidth="2" /><circle cx="40" cy="34" r="3" fill={ink} /></>,
  bag: <><rect x="12" y="20" width="40" height="34" rx="6" fill={think} /><path d="M24 20v-6a8 8 0 0 1 16 0v6" fill="none" stroke={ink} strokeWidth="3" /><rect x="22" y="32" width="20" height="8" rx="2" fill={soft} /></>,
  bat: <><path d="M44 6l8 4-22 40-8-4z" fill={notice} stroke={ink} strokeWidth="2" /><path d="M22 46l-6 12" stroke={ink} strokeWidth="5" strokeLinecap="round" /><circle cx="50" cy="50" r="5" fill={move} /></>,
  weight: <><rect x="8" y="22" width="8" height="20" rx="2" fill={ink} /><rect x="48" y="22" width="8" height="20" rx="2" fill={ink} /><rect x="16" y="29" width="32" height="6" fill={soft} stroke={ink} strokeWidth="1.5" /></>,
  notebook: <><rect x="14" y="8" width="36" height="48" rx="3" fill={soft} stroke={ink} strokeWidth="2" /><path d="M22 20h20M22 28h20M22 36h14" stroke={think} strokeWidth="2.5" strokeLinecap="round" /><path d="M14 14h-4M14 26h-4M14 38h-4M14 50h-4" stroke={ink} strokeWidth="2" /></>,
  alarm: <><circle cx="32" cy="36" r="18" fill={notice} stroke={ink} strokeWidth="3" /><path d="M32 26v10h8" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M12 16l8-6M52 16l-8-6" stroke={ink} strokeWidth="4" strokeLinecap="round" /></>,
  fan: <><circle cx="32" cy="28" r="4" fill={ink} /><path d="M32 28q-4-18 8-16q4 10-8 16zM32 28q18-2 14 10q-10 2-14-10zM32 28q-12 12-18 2q4-8 18-2z" fill={think} /><path d="M32 32v24M22 56h20" stroke={ink} strokeWidth="3" strokeLinecap="round" /></>,
  road: <><path d="M20 58l8-52h8l8 52z" fill={soft} /><path d="M32 12v8M32 28v8M32 44v8" stroke={notice} strokeWidth="3" strokeLinecap="round" /></>,
  crowd: <><circle cx="18" cy="24" r="7" fill={learn} /><circle cx="32" cy="20" r="7" fill={notice} /><circle cx="46" cy="24" r="7" fill={think} /><path d="M8 54q2-18 20-18M24 54q8-22 24-14M38 54q4-16 18-16" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" /></>,
  mirror: <><ellipse cx="32" cy="28" rx="18" ry="22" fill={soft} stroke={ink} strokeWidth="3" /><path d="M24 18q-4 8 0 16" stroke={think} strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M32 50v8M24 58h16" stroke={ink} strokeWidth="3" strokeLinecap="round" /></>,
};

export function ChikuPropArt({ prop, className }: { prop: ChikuProp; className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" width="72" height="72" aria-hidden="true" focusable="false" data-prop={prop}>{PATHS[prop]}</svg>;
}
