export function nightRouteTime(now: number, shutdown: string): boolean {
  const date = new Date(now);
  const minutes = date.getHours() * 60 + date.getMinutes();
  const [hour = 23, minute = 15] = shutdown.split(':').map(Number);
  const start = hour * 60 + minute;
  // A shutdown after midnight (a busy-day shift can push 23:15 to 00:15) runs from then until 04:00 only.
  if (start < 4 * 60) return minutes >= start && minutes < 4 * 60;
  return minutes < 4 * 60 || minutes >= start;
}

export function nightRouteTransition(wasNight: boolean, isNight: boolean, path: string): 'night' | 'plan' | null {
  if (wasNight === isNight) return null;
  if (isNight && path !== 'night') return 'night';
  if (!isNight && path === 'night') return 'plan';
  return null;
}
