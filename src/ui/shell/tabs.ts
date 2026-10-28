// Spec 33: Read replaces Learn. Spec 34: Yatra holds Train, Kapi's shelf (Mind) and Calm. Spec 37: Yatra is home, so it comes first.
export const tabs = ['Yatra', 'Plan', 'Read', 'You'] as const;
export type Tab = typeof tabs[number];
