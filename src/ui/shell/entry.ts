/**
 * Spec 45a: how NANDI was opened. A link to a place (the address had a route, a notification or the widget sent it) is
 * not an ordinary open, so the opening breath stays away. Read at load, before the router sets its first route.
 */
let linked = typeof location !== 'undefined' && location.hash.replace(/^#\/?/, '') !== '';

export function markLinkedEntry(): void { linked = true; }
export function linkedEntry(): boolean { return linked; }
/** A new open (NANDI came back after a while away) starts as ordinary until a notification or the widget says otherwise. */
export function startNewEntry(): void { linked = false; }
