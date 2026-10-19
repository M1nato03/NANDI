import type { SettingRow } from '../../data/types';

export function economyVisible(settings: SettingRow[], today: string): boolean {
  const value = settings.find(row => row.key === 'economyVisibleFrom' && row.deleted === 0)?.value;
  return value == null || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && today >= value);
}

export function nightMindNote(visible: boolean): string {
  return visible ? 'After bedtime, Mind earns 0 XP.' : 'Mind is resting for the night.';
}
