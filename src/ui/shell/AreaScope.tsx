import { useEffect, useSyncExternalStore } from 'react';
import type { Area } from '../areas';

/**
 * Spec 25 §6: inside an area, screens keep its colour, except review screens (idea checks, Gold review, Moti's haveli
 * and matka), which switch to Moti's rose while they are open. A screen renders <AreaScope area="review" />; the shell
 * reads the override and falls back to the route's own area when the screen closes.
 */
// Open scopes in mount order; the newest wins, so a review question inside a review practice keeps the rose.
const scopes: { area: Area }[] = [];
let override: Area | undefined;
const listeners = new Set<() => void>();
const emit = () => { for (const listener of listeners) listener(); };
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

export function useAreaOverride(): Area | undefined {
  return useSyncExternalStore(subscribe, () => override, () => undefined);
}

export function AreaScope({ area }: { area: Area }) {
  useEffect(() => {
    const scope = { area };
    scopes.push(scope);
    override = area;
    emit();
    return () => { scopes.splice(scopes.indexOf(scope), 1); override = scopes.at(-1)?.area; emit(); };
  }, [area]);
  return null;
}
