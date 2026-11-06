// Spec 33: Read replaces Learn. Spec 34: Yatra holds Train, Kapi's shelf (Mind) and Calm. Spec 37: Yatra is home, so it comes first.
// Spec 571 stage 1: Grow holds the doors to Read, Remember, Play, Train and Calm & Sleep.
export const tabs = ['Yatra', 'Plan', 'Grow', 'You'] as const;
export type Tab = typeof tabs[number];
