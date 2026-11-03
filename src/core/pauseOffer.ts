import type { SettingRow } from '../data/types';
import { readPauseCard } from './pauseCard';
import { PICKS_KEY } from './welcome';

/**
 * Spec 52 D: the Pause card is offered once, after the first finish moment, never in Welcome (its Android permissions
 * would break the first win). Only where the card works (`available`: the phone build), only for someone who has not
 * set it up, and only for installs that came through spec 52's Welcome, so nothing changes for anyone else. The key
 * is written when the offer shows, so it shows once; "Not now" is final and the setup stays at Plan → Pause card.
 */
export const PAUSE_OFFER_KEY = 'pause.offer';

export function pauseOfferDue(settings: readonly SettingRow[], today: string, available: boolean): boolean {
  if (!available) return false;
  const has = (key: string) => settings.some(row => row.key === key && !row.deleted);
  return has(PICKS_KEY.size) && !has(PAUSE_OFFER_KEY) && !readPauseCard(settings, today).on;
}
