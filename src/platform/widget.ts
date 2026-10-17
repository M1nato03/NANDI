import { Capacitor, registerPlugin } from '@capacitor/core';
import type { WidgetState } from '../core/widgetText';

type WidgetPlugin = { setState(state: WidgetState): Promise<void>; consumeLaunchRoute(): Promise<{ route: string }> };
const native = registerPlugin<WidgetPlugin>('Widget');

export function widgetAvailable(): boolean { return Capacitor.isNativePlatform(); }
export async function setWidgetState(state: WidgetState): Promise<void> {
  if (widgetAvailable()) await native.setState(state);
}
export async function consumeWidgetLaunchRoute(): Promise<string> {
  return widgetAvailable() ? (await native.consumeLaunchRoute()).route : '';
}
