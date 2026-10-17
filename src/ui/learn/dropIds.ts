import { dayKey } from '../../core/time';

export const dailyDropId = (now: number) => `drop:daily:${dayKey(now)}`;
export const nightDropId = (now: number) => `drop:night:${dayKey(now)}`;
