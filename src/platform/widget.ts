import { Capacitor, registerPlugin } from '@capacitor/core';
import type { WidgetState } from '../core/widgetText';

type WidgetPlugin = { setState(state: WidgetState): Promise<void> };
const native = registerPlugin<WidgetPlugin>('Widget');

export function widgetAvailable(): boolean { return Capacitor.isNativePlatform(); }
export async function setWidgetState(state: WidgetState): Promise<void> {
  if (widgetAvailable()) await native.setState(state);
}
