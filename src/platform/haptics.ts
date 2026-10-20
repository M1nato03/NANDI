import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export async function tapHaptic(enabled: boolean, pattern: number | number[] = 20): Promise<void> {
  if (!enabled) return;
  if (typeof navigator !== 'undefined' && navigator.vibrate?.(pattern)) return;
  if (Capacitor.isNativePlatform()) await Haptics.impact({ style: Array.isArray(pattern) ? ImpactStyle.Medium : ImpactStyle.Light });
}
