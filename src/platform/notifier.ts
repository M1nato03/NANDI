import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export type Reminder = { id: string; at: number; title: string; body: string; channel: 'tasks' | 'rest' | 'planning' };
export interface Notifier {
  checkPermission(): Promise<'granted' | 'denied' | 'prompt'>;
  requestPermission(): Promise<'granted' | 'denied' | 'prompt'>;
  schedule(reminder: Reminder): Promise<void>;
  cancel(id: string): Promise<void>;
  listPending(): Promise<string[]>;
}

/** Stable positive int32 ID. Stored in reminders too, so future migrations can preserve it. */
export function notifId(id: string): number {
  let hash = 2166136261;
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) & 0x7fffffff || 1;
}

export class WebNotifier implements Notifier {
  private timers = new Map<string, number>();
  async checkPermission(): Promise<'granted' | 'denied' | 'prompt'> { return typeof Notification === 'undefined' ? 'denied' : Notification.permission === 'default' ? 'prompt' : Notification.permission; }
  async requestPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (typeof Notification === 'undefined') return 'denied';
    const result = await Notification.requestPermission();
    return result === 'default' ? 'prompt' : result;
  }
  async schedule(reminder: Reminder): Promise<void> {
    await this.cancel(reminder.id);
    if (reminder.at <= Date.now() || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const delay = reminder.at - Date.now();
    if (delay > 2_147_483_647) return;
    this.timers.set(reminder.id, window.setTimeout(() => {
      this.timers.delete(reminder.id);
      if (document.visibilityState === 'visible') void navigator.serviceWorker?.ready.then(registration => registration.showNotification(reminder.title, { body: reminder.body, data: { route: reminder.channel === 'rest' ? '#train' : '#plan' } }));
    }, delay));
  }
  async cancel(id: string): Promise<void> { const timer = this.timers.get(id); if (timer !== undefined) window.clearTimeout(timer); this.timers.delete(id); }
  async listPending(): Promise<string[]> { return [...this.timers.keys()]; }
}

export class CapacitorNotifier implements Notifier {
  async createChannels(): Promise<void> {
    await Promise.all([
      LocalNotifications.createChannel({ id: 'tasks', name: 'Task blocks', importance: 4 }),
      LocalNotifications.createChannel({ id: 'rest', name: 'Rest timer', importance: 4 }),
      LocalNotifications.createChannel({ id: 'planning', name: 'Planning', importance: 3 }),
    ]);
  }
  async requestPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted' ? 'granted' : result.display === 'prompt' ? 'prompt' : 'denied';
  }
  async checkPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    const result = await LocalNotifications.checkPermissions();
    return result.display === 'granted' ? 'granted' : result.display === 'prompt' ? 'prompt' : 'denied';
  }
  async schedule(reminder: Reminder): Promise<void> {
    const result = await LocalNotifications.schedule({ notifications: [{
      id: notifId(reminder.id), title: reminder.title, body: reminder.body, channelId: reminder.channel,
      extra: { reminderId: reminder.id },
      schedule: { at: new Date(reminder.at), allowWhileIdle: true },
    }] });
    if (result.warning) console.warn(result.warning.message);
  }
  async cancel(id: string): Promise<void> { await LocalNotifications.cancel({ notifications: [{ id: notifId(id) }] }); }
  async listPending(): Promise<string[]> {
    return (await LocalNotifications.getPending()).notifications
      .map(item => item.extra?.reminderId)
      .filter((id): id is string => typeof id === 'string');
  }
  async exactAlarmGranted(): Promise<boolean> { return (await LocalNotifications.checkExactNotificationSetting()).exact_alarm === 'granted'; }
  async openExactAlarmSettings(): Promise<void> { await LocalNotifications.changeExactNotificationSetting(); }
}

export const notifier: Notifier = Capacitor.isNativePlatform() ? new CapacitorNotifier() : new WebNotifier();
