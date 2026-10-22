import { useEffect, useState } from 'react';
import { Cast, castNames } from './Cast';
import { useModalFocus } from '../shell/useModalFocus';

export function completedModuleKey(modules: { id: string; concepts: { id: string }[] }[], learned: ReadonlySet<string>, seen: (id: string) => boolean): string | undefined {
  return modules.find(module => module.concepts.length > 0 && module.concepts.every(concept => learned.has(concept.id)) && !seen(module.id))?.id;
}
export function UnitScene({ moduleId, close }: { moduleId: string; close: () => void }) {
  const dialog = useModalFocus<HTMLDivElement>(close);
  useEffect(() => {
    const timer = window.setTimeout(close, 2200);
    return () => window.clearTimeout(timer);
  }, [close]);
  return <div ref={dialog} tabIndex={-1} className="cast-unit-scene" role="dialog" aria-modal="true" aria-label="Unit complete"><div className="cast-unit-card card">
    <div className="cast-unit-friends">{castNames.map(name => <Cast key={name} name={name} pose="cheer" size={44} />)}</div>
    <h2>Unit complete</h2><p>Those ideas are yours to keep.</p><button type="button" onClick={close} data-module={moduleId}>Continue</button><button type="button" className="secondary" onClick={close}>Skip scene</button>
  </div></div>;
}
export function useUnitScene(moduleId: string | undefined) {
  const [active, setActive] = useState<string>();
  useEffect(() => { if (moduleId) queueMicrotask(() => setActive(moduleId)); }, [moduleId]);
  const close = () => setActive(undefined);
  return { active, close };
}
