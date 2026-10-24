import type { ReactNode } from 'react';
import { Cast, type Pose } from './Cast';
import { STAGES, type Area } from '../areas';

/**
 * Spec 25 §2: the friend stage at the top of a tab. The friend sits big on a band in the area's stage colour, fixed in
 * both themes; the band is light behind a dark friend and deep behind a light one, so the friend reads at 3:1 or more.
 * The heading and a short line sit beside the friend; later the stage hosts that friend's own game (spec 24).
 */
export function FriendStage({ area, pose = 'idle', size = 96, children }: { area: Area; pose?: Pose; size?: number; children?: ReactNode }) {
  const stage = STAGES[area];
  return <section className="friend-stage" data-friend={stage.friend} data-rim={stage.rim} aria-label={`${stage.friend}'s stage`}>
    <Cast name={stage.friend} pose={pose} size={size} />
    {children && <div className="friend-stage-text">{children}</div>}
  </section>;
}
