import { nightWindow } from './tasks/planner';

export function deckMode(now: number, shutdown: string, bedtime: string, windDownAt?: number): 'day' | 'night' {
  return nightWindow(now, shutdown, bedtime, windDownAt) === 'day' ? 'day' : 'night';
}
