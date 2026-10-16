export type DeckNavigation = { index: number; length: number };

export type DeckAction =
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'jump'; index: number };

export function deckNavigation(state: DeckNavigation, action: DeckAction): DeckNavigation {
  const requested = action.type === 'next' ? state.index + 1
    : action.type === 'previous' ? state.index - 1 : action.index;
  return { ...state, index: Math.max(0, Math.min(state.length - 1, requested)) };
}
