import { useCallback, useEffect, useState } from 'react';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { createSettingsRepos } from '../../data/repos/settings';
import { recordError } from '../errorRing';

type Theme = 'system' | 'dark' | 'light';
type Motion = 'system' | 'reduce';
export interface Appearance {
  theme: Theme;
  motion: Motion;
  setTheme: (value: string) => Promise<void>;
  setMotion: (value: string) => Promise<void>;
}

function themeValue(value: unknown): Theme { return value === 'dark' || value === 'light' ? value : 'system'; }
function motionValue(value: unknown): Motion { return value === 'reduce' ? value : 'system'; }

export function useAppearance(): Appearance & { reload: () => Promise<void> } {
  const [theme, setThemeState] = useState<Theme>('system');
  const [motion, setMotionState] = useState<Motion>('system');
  const reload = useCallback(async () => {
    const [themeRow, motionRow] = await Promise.all([db.settings.get('theme'), db.settings.get('motion')]);
    setThemeState(themeValue(themeRow?.deleted ? undefined : themeRow?.value));
    setMotionState(motionValue(motionRow?.deleted ? undefined : motionRow?.value));
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void reload().catch(error => recordError('promise', error)); }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => { document.documentElement.dataset.motion = motion; }, [motion]);
  const save = async (key: 'theme' | 'motion', value: string) => {
    const now = Date.now();
    const deviceId = await getOrCreateDeviceId(db, now);
    await createSettingsRepos(db, deviceId).settings.put({ key, value }, now);
  };
  const setTheme = async (value: string) => {
    const next = themeValue(value);
    try { await save('theme', next); setThemeState(next); }
    catch (error) { recordError('promise', error); }
  };
  const setMotion = async (value: string) => {
    const next = motionValue(value);
    try { await save('motion', next); setMotionState(next); }
    catch (error) { recordError('promise', error); }
  };
  return { theme, motion, setTheme, setMotion, reload };
}
