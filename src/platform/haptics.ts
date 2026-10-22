import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export async function tapHaptic(enabled: boolean, pattern: number | number[] = 20): Promise<void> {
  // Motion off (in NANDI or the phone) also turns off taps that only decorate (economy review 32, F3).
  const reduced = typeof document !== 'undefined' && (document.documentElement.dataset.motion === 'reduce' || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches));
  if (!enabled || reduced) return;
  if (typeof navigator !== 'undefined' && navigator.vibrate?.(pattern)) return;
  if (Capacitor.isNativePlatform()) await Haptics.impact({ style: Array.isArray(pattern) ? ImpactStyle.Medium : ImpactStyle.Light });
}
