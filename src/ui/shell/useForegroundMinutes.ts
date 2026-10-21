import { useEffect } from 'react';
import { FOREGROUND_TICK_MS, foregroundSlice } from '../../core/guard';
import { dayKey } from '../../core/time';
import { db } from '../../data/db';
import { addAppMinutes, anyTimerRunning } from '../../data/repos/guard';
import { recordError } from '../errorRing';

/**
 * Counts NANDI's own foreground time into dailyLog.appMinutes (HANDOVER guard metric). Time while a
 * workout or focus timer runs is left out. Whole minutes are written; the part-minute carries over.
 */
export function useForegroundMinutes() {
  useEffect(() => {
    let last = Date.now();
    let day = dayKey(last);
    let pending = 0;
    let busy = false;
    const flush = () => {
      const whole = Math.floor(pending / 60_000);
      if (whole <= 0) return;
      pending -= whole * 60_000;
      void addAppMinutes(db, day, whole, Date.now()).catch(error => recordError('promise', error));
    };
    const count = async () => {
      if (busy) return;
      const now = Date.now();
      const slice = foregroundSlice(last, now);
      last = now;
      if (slice <= 0) return;
      busy = true;
      try {
        if (await anyTimerRunning(db, now)) return;
        const today = dayKey(now);
        if (today !== day) { flush(); pending = 0; day = today; }
        pending += slice;
        flush();
      } catch (error) { recordError('promise', error); } finally { busy = false; }
    };
    const tick = () => { if (document.visibilityState === 'visible') void count(); };
    const visibility = () => {
      if (document.visibilityState === 'hidden') void count();
      else last = Date.now();
    };
    const timer = window.setInterval(tick, FOREGROUND_TICK_MS);
    document.addEventListener('visibilitychange', visibility);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', visibility); };
  }, []);
}
