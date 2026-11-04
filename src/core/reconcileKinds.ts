/**
 * The ledger kinds reconcileGamify writes on its own, as consequences of facts the person made (data/repos/gamify.ts).
 * The finish feedback leaves them out when it asks whether an update was one action or a bulk restore. Gold review is
 * not here: it is mode 'gamify' too, but a person's own answer writes it.
 */
export const RECONCILE_KINDS: ReadonlySet<string> = new Set(['tomorrow-plan', 'learn-drop', 'perfect-drop', 'welcome-back', 'daily-quest', 'focus-boost', 'unit-chest', 'badge-tier', 'monthly-challenge']);
