import { RULES } from '../rules.config';
import { deriveEconomy, seasonIndex, type EconomyView } from './deriveEconomy';
import type { RulesHistoryEntry } from '../rules.config';
import type { LedgerRow, SettingRow } from '../../data/types';

export type ShopKind = 'freeze' | 'cardBack' | 'banner' | 'puzzlePack' | 'soundPack' | 'theme';
export type ShopItem = { id: string; kind: ShopKind; name: string; price: number; description: string };
export const SHOP_ITEMS: readonly ShopItem[] = [
  { id: 'freeze', kind: 'freeze', name: 'Rest day', price: RULES.shards.prices.freeze, description: 'Adds one day to your rest bank.' },
  { id: 'cardback:weave', kind: 'cardBack', name: 'Weave card back', price: 100, description: 'A quiet woven pattern.' },
  { id: 'cardback:orbit', kind: 'cardBack', name: 'Orbit card back', price: 150, description: 'Small circles in motion.' },
  { id: 'cardback:steps', kind: 'cardBack', name: 'Steps card back', price: 150, description: 'A path of gentle steps.' },
  { id: 'banner:dawn', kind: 'banner', name: 'Dawn banner', price: 100, description: 'Warm light for your season card.' },
  { id: 'banner:grove', kind: 'banner', name: 'Grove banner', price: 150, description: 'A green place to begin.' },
  { id: 'banner:sky', kind: 'banner', name: 'Sky banner', price: 150, description: 'A soft blue horizon.' },
  { id: 'puzzle:paths', kind: 'puzzlePack', name: 'Paths practice pack', price: 150, description: 'Handpicked Path boards.' },
  { id: 'puzzle:patterns', kind: 'puzzlePack', name: 'Patterns practice pack', price: 250, description: 'Handpicked Crowns and Sudoku boards.' },
  { id: 'sound:soft', kind: 'soundPack', name: 'Soft sounds', price: 300, description: 'Quiet sounds for check-offs.' },
  { id: 'theme:linen', kind: 'theme', name: 'Linen theme', price: 400, description: 'Warm paper in light and dark.' },
  { id: 'theme:lagoon', kind: 'theme', name: 'Lagoon theme', price: 800, description: 'Calm teal in light and dark.' },
];
export const SHOP_CATALOGUES = [
  ['freeze', 'cardback:weave', 'banner:dawn', 'puzzle:paths', 'sound:soft', 'theme:linen', 'theme:lagoon'],
  ['freeze', 'cardback:orbit', 'banner:grove', 'puzzle:patterns', 'sound:soft', 'theme:linen', 'theme:lagoon'],
  ['freeze', 'cardback:steps', 'banner:sky', 'puzzle:paths', 'sound:soft', 'theme:linen', 'theme:lagoon'],
  ['freeze', 'cardback:weave', 'banner:grove', 'puzzle:patterns', 'sound:soft', 'theme:linen', 'theme:lagoon'],
] as const;
/** Fixed practice boards; each seed is bundled and playable offline. */
export const PUZZLE_PACKS = [
  { id: 'puzzle:paths', name: 'Paths practice pack', boards: [{ type: 'path' as const, diff: 'easy' as const, seed: 21031 }, { type: 'path' as const, diff: 'medium' as const, seed: 21037 }] },
  { id: 'puzzle:patterns', name: 'Patterns practice pack', boards: [{ type: 'crowns' as const, diff: 'easy' as const, seed: 31019 }, { type: 'sudoku' as const, diff: 'medium' as const, seed: 31033 }] },
] as const;
export function catalogue(day: string): ShopItem[] {
  const ids: readonly string[] = SHOP_CATALOGUES[seasonIndex(day) % 4]!;
  return ids.map(id => SHOP_ITEMS.find(item => item.id === id)!);
}
/** `derived` lets a screen that lists every item derive the economy once (item 38). */
export function purchaseDecision(itemId: string, facts: readonly LedgerRow[], settings: readonly SettingRow[], today: string, history?: readonly RulesHistoryEntry[], derived?: EconomyView): { ok: boolean; reason?: string; item?: ShopItem } {
  const item = catalogue(today).find(row => row.id === itemId);
  if (!item) return { ok: false, reason: 'This item is not in this season.' };
  const economy = derived ?? deriveEconomy(facts, history, settings, today);
  if (item.kind !== 'freeze' && economy.owned.includes(itemId)) return { ok: false, reason: 'Already yours.' };
  if (item.kind === 'freeze' && economy.streak.restDays >= RULES.streak.restBankMax) return { ok: false, reason: 'Your rest bank is full.' };
  if (economy.shards < item.price) return { ok: false, reason: `You need ${item.price - economy.shards} more Shards.` };
  return { ok: true, item };
}
