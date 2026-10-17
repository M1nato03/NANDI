type Area = 'do' | 'move' | 'think' | 'learn' | 'extra';

const glyphs: Record<Area, string> = { do: '✦', move: '◌', think: '◇', learn: '✧', extra: '✳' };

export function EmptyState({ area, children }: { area: Area; children: string }) {
  return <div className="ui-empty-state" data-area={area}><span className="ui-empty-glyph" aria-hidden="true">{glyphs[area]}</span><p>{children}</p></div>;
}
