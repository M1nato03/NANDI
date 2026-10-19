export function nightRouteTime(now: number, shutdown: string): boolean {
  const date = new Date(now);
  const minutes = date.getHours() * 60 + date.getMinutes();
  const [hour = 23, minute = 15] = shutdown.split(':').map(Number);
  return minutes < 4 * 60 || minutes >= hour * 60 + minute;
}

export function nightRouteTransition(wasNight: boolean, isNight: boolean, path: string): 'night' | 'plan' | null {
  if (wasNight === isNight) return null;
  if (isNight && path !== 'night') return 'night';
  if (!isNight && path === 'night') return 'plan';
  return null;
}
