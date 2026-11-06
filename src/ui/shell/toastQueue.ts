import type { FinishActivity } from './finish';

export type Notice = {
  text: string; macro: boolean; gain?: number; detail?: string; activity?: FinishActivity;
  character?: 'Nandi' | 'Kachhua'; level?: number; totalXp?: number; jar?: string;
  kind?: 'badge';
};
export type ToastQueue = { current: Notice | null; pending: readonly Notice[] };
export const emptyToastQueue: ToastQueue = { current: null, pending: [] };
export const welcomeToastLine = 'Welcome back. Here is a small gift.';

/** A visible notice keeps its turn. Badges stay recorded for You; jar lines lead the waiting list. */
export function nextToast(pending: readonly Notice[]): Notice | null {
  return pending.find(item => item.kind !== 'badge' && !!item.jar)
    ?? pending.find(item => item.kind !== 'badge') ?? null;
}

export function enqueueToast(queue: ToastQueue, notice: Notice): ToastQueue {
  if (notice.kind === 'badge') return queue;
  // A level page waits behind the jar earned by the same act.
  const incoming = notice.macro && notice.jar
    ? [{ text: notice.jar, jar: notice.jar, macro: false, activity: notice.activity }, { ...notice, jar: undefined }]
    : [notice];
  const pending = [...queue.pending, ...incoming];
  if (queue.current) return { current: queue.current, pending };
  const current = nextToast(pending);
  return { current, pending: pending.filter(item => item !== current) };
}

export function closeToast(queue: ToastQueue): ToastQueue {
  const current = nextToast(queue.pending);
  return { current, pending: queue.pending.filter(item => item !== current && item.kind !== 'badge') };
}

const words = (text: string) => text.trim().split(/\s+/).filter(word => word !== '·').length;
const fit = (text: string) => words(text) <= 8;
/**
 * One short line (E4: at most 8 words). The jar line wins (spec 54's whole line, "+5 min into the jar · idea read",
 * cut to its first part only if it is too long). Without a jar line, the XP count joins the warm line when both fit;
 * otherwise the warm line (spec 24's one warm line at each finish) stays and the count waits for You.
 */
export function finishToastText(line: string, gain = 0, shownXp = 0, jar?: string): string {
  if (jar) return fit(jar) ? jar : jar.split(' · ')[0]!;
  if (gain <= 0 || line === welcomeToastLine) return line;
  const combined = `+${shownXp} XP today · ${line}`;
  return fit(combined) ? combined : line;
}
export const toastWords = words;
